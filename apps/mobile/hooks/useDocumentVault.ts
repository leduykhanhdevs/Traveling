import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { MMKV } from 'react-native-mmkv';

export type VaultDocument = {
  id: string;
  label: string;
  localUri: string; // Will now be a base64 data URI directly from MMKV
  createdAt: string;
};

// We lazy-initialize the encrypted MMKV instance
let vaultStorage: MMKV | null = null;

const getVaultStorage = async (): Promise<MMKV> => {
  if (vaultStorage) return vaultStorage;
  let key = await SecureStore.getItemAsync('traveling-vault-encryption-key');
  if (!key) {
    // Generate a secure 32-character hex string as key
    key = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync('traveling-vault-encryption-key', key);
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
      
      const metadata = JSON.parse(rawMetadata) as readonly VaultDocument[];
      // Hydrate localUri with the encrypted base64 data
      const hydrated = metadata.map(doc => ({
        ...doc,
        localUri: storage.getString(`doc_${doc.id}`) || '',
      })).filter(doc => !!doc.localUri);
      
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

        const base64Data = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const storage = await getVaultStorage();
        const id = `${Date.now()}`;
        const dataUri = `data:image/jpeg;base64,${base64Data}`;
        
        // Store the encrypted blob and delete the unencrypted temp file
        storage.set(`doc_${id}`, dataUri);
        await FileSystem.deleteAsync(result.assets[0].uri, { idempotent: true });

        // Update metadata
        const rawMetadata = storage.getString('vault-metadata');
        const metadata = rawMetadata ? (JSON.parse(rawMetadata) as VaultDocument[]) : [];
        const newDoc = { id, label, localUri: '', createdAt: new Date().toISOString() };
        metadata.push(newDoc);
        storage.set('vault-metadata', JSON.stringify(metadata));

        // Reload UI state
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
