import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export type VaultDocument = {
  id: string;
  label: string;
  localUri: string;
  createdAt: string;
};

import { Paths } from 'expo-file-system';
const vaultFolder = `${Paths.document.uri}vault/`;

const readVault = async (): Promise<readonly VaultDocument[]> => {
  try {
    const raw = await SecureStore.getItemAsync('traveling-document-vault');
    if (!raw) return [];
    return JSON.parse(raw) as readonly VaultDocument[];
  } catch {
    return [];
  }
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
        await FileSystem.makeDirectoryAsync(vaultFolder, { intermediates: true });
        const id = `${Date.now()}`;
        const localUri = `${vaultFolder}${id}.jpg`;
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
        await SecureStore.setItemAsync('traveling-document-vault', JSON.stringify(next));
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
