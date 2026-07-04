import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export type VaultDocument = {
  id: string;
  label: string;
  localUri: string;
  createdAt: string;
};

const vaultKey = 'traveling-document-vault';

const readVault = async (): Promise<readonly VaultDocument[]> => {
  const raw = await SecureStore.getItemAsync(vaultKey);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as readonly VaultDocument[];
};

export const useDocumentVault = (): {
  documents: readonly VaultDocument[];
  addDocument: (label: string) => Promise<void>;
  reload: () => Promise<void>;
} => {
  const [documents, setDocuments] = useState<readonly VaultDocument[]>([]);

  const reload = useCallback(async () => {
    try {
      setDocuments(await readVault());
    } catch {
      setDocuments([]);
    }
  }, []);

  const addDocument = useCallback(
    async (label: string) => {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (result.canceled || !result.assets[0]) {
          return;
        }
        const folder = `${FileSystem.documentDirectory ?? ''}vault/`;
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        const id = `${Date.now()}`;
        const localUri = `${folder}${id}.jpg`;
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: localUri,
        });
        const next = [
          ...(await readVault()),
          {
            id,
            label,
            localUri,
            createdAt: new Date().toISOString(),
          },
        ];
        await SecureStore.setItemAsync(vaultKey, JSON.stringify(next));
        setDocuments(next);
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
