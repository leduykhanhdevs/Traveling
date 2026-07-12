import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

export type VaultDocument = {
  id: string;
  label: string;
  localUri: string;
  createdAt: string;
};

let vaultStorage: MMKV | null = null;

const encryptionKeyOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const createEncryptionKey = async (): Promise<string> => {
  // MMKV v2 accepts at most 16 UTF-8 bytes. Twelve random bytes encode to
  // exactly 16 ASCII Base64 characters without padding (96 bits of entropy).
  const bytes = await Crypto.getRandomBytesAsync(12);
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    encoded += base64Alphabet[(first >> 2) & 63];
    encoded += base64Alphabet[((first & 3) << 4) | ((second >> 4) & 15)];
    encoded += base64Alphabet[((second & 15) << 2) | ((third >> 6) & 3)];
    encoded += base64Alphabet[third & 63];
  }
  return encoded;
};

const getVaultStorage = async (): Promise<MMKV> => {
  if (vaultStorage) return vaultStorage;
  let key = await SecureStore.getItemAsync(
    'traveling-vault-encryption-key',
    encryptionKeyOptions,
  );
  if (!key || key.length > 16 || /[^\x20-\x7E]/.test(key)) {
    key = await createEncryptionKey();
    await SecureStore.setItemAsync(
      'traveling-vault-encryption-key',
      key,
      encryptionKeyOptions,
    );
  }
  vaultStorage = new MMKV({
    id: 'secure-document-vault',
    encryptionKey: key,
  });
  return vaultStorage;
};

export const useDocumentVault = (): {
  documents: readonly VaultDocument[];
  addDocument: (label: string) => Promise<void>;
  reload: () => Promise<void>;
} => {
  const [documents, setDocuments] = useState<readonly VaultDocument[]>([]);

  const reload = useCallback(async () => {
    try {
      const storage = await getVaultStorage();
      const rawMetadata = storage.getString('vault-metadata');
      if (!rawMetadata) {
        setDocuments([]);
        return;
      }
      
      const parsed = JSON.parse(rawMetadata) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid vault metadata.');
      }
      const metadata = parsed.filter(
        (value): value is VaultDocument =>
          typeof value === 'object' &&
          value !== null &&
          typeof value.id === 'string' &&
          typeof value.label === 'string' &&
          typeof value.createdAt === 'string',
      );
      const hydrated = metadata.map((doc) => ({
        ...doc,
        localUri: storage.getString(`doc_${doc.id}`) || '',
      })).filter((doc) => Boolean(doc.localUri));

      setDocuments(hydrated);
    } catch (err) {
      setDocuments([]);
    }
  }, []);

  const addDocument = useCallback(
    async (label: string) => {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (result.canceled || !result.assets[0]) return;

        const file = new FileSystem.File(result.assets[0].uri);
        const base64Data = await file.base64();

        const storage = await getVaultStorage();
        const id = Crypto.randomUUID();
        const mimeType = result.assets[0].mimeType?.startsWith('image/')
          ? result.assets[0].mimeType
          : 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Data}`;

        storage.set(`doc_${id}`, dataUri);
        try {
          const rawMetadata = storage.getString('vault-metadata');
          const parsedMetadata = rawMetadata ? (JSON.parse(rawMetadata) as unknown) : [];
          if (!Array.isArray(parsedMetadata)) {
            throw new Error('Invalid vault metadata.');
          }
          const newDoc: VaultDocument = {
            id,
            label: label.trim(),
            localUri: '',
            createdAt: new Date().toISOString(),
          };
          storage.set('vault-metadata', JSON.stringify([...parsedMetadata, newDoc]));
        } catch (error) {
          storage.delete(`doc_${id}`);
          throw error;
        }

        await file.delete();
        await reload();
      } catch {
        await reload();
      }
    },
    [reload],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { documents, addDocument, reload };
};
