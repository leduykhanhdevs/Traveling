import { act, renderHook } from './render-hook';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as ImagePicker from 'expo-image-picker';
import type { PermissionStatus } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import { useDocumentVault } from '../hooks/useDocumentVault';

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest
    .fn<() => Promise<Uint8Array>>()
    .mockResolvedValue(new Uint8Array(12).fill(7)),
  randomUUID: jest
    .fn<() => string>()
    .mockReturnValue('00000000-0000-4000-8000-000000000001'),
}));

jest.mock('expo-file-system', () => {
  const base64 = jest.fn<() => Promise<string>>().mockResolvedValue('aW1hZ2UtYnl0ZXM=');
  const deleteFile = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const File = jest.fn().mockImplementation(() => ({ base64, delete: deleteFile }));
  return { File, __base64: base64, __deleteFile: deleteFile };
});

jest.mock('react-native-mmkv', () => {
  const data = new Map<string, string>();
  const instance = {
    delete: jest.fn<(key: string) => boolean>((key) => data.delete(key)),
    getString: jest.fn<(key: string) => string | undefined>((key) => data.get(key)),
    set: jest.fn<(key: string, value: string) => Map<string, string>>((key, value) =>
      data.set(key, value),
    ),
  };
  return {
    MMKV: jest.fn().mockImplementation(() => instance),
    __data: data,
    __instance: instance,
  };
});

type FileSystemMock = {
  __base64: jest.Mock<() => Promise<string>>;
  __deleteFile: jest.Mock<() => Promise<void>>;
};

type MmkvMock = {
  __data: Map<string, string>;
  __instance: {
    delete: jest.Mock<(key: string) => boolean>;
    getString: jest.Mock<(key: string) => string | undefined>;
    set: jest.Mock<(key: string, value: string) => unknown>;
  };
};

describe('useDocumentVault', () => {
  const fileSystemMock = jest.requireMock('expo-file-system') as FileSystemMock;
  const mmkvMock = jest.requireMock('react-native-mmkv') as MmkvMock;
  const getItemMock = jest.mocked(SecureStore.getItemAsync);
  const setItemMock = jest.mocked(SecureStore.setItemAsync);
  const requestCameraPermissionMock = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
  const launchCameraMock = jest.mocked(ImagePicker.launchCameraAsync);

  beforeEach(() => {
    jest.clearAllMocks();
    mmkvMock.__data.clear();
    getItemMock.mockResolvedValue('abcdefghijklmnop');
    setItemMock.mockResolvedValue(undefined);
  });

  it('starts with an empty document list when encrypted storage is empty', async () => {
    const { result } = await renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.documents).toEqual([]);
    expect(getItemMock).toHaveBeenCalledWith('traveling-vault-encryption-key', {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('reloads metadata and encrypted document bytes from MMKV', async () => {
    const storedDocument = {
      id: 'doc_1',
      label: 'Passport',
      localUri: '',
      createdAt: '2026-05-30T00:00:00.000Z',
    };
    mmkvMock.__data.set('vault-metadata', JSON.stringify([storedDocument]));
    mmkvMock.__data.set('doc_doc_1', 'data:image/jpeg;base64,aW1hZ2U=');

    const { result } = await renderHook(() => useDocumentVault());
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.documents).toEqual([
      { ...storedDocument, localUri: 'data:image/jpeg;base64,aW1hZ2U=' },
    ]);
  });

  it('adds a captured document to encrypted storage and removes the temporary file', async () => {
    requestCameraPermissionMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    launchCameraMock.mockResolvedValue({
      canceled: false,
      assets: [
        {
          height: 100,
          mimeType: 'image/jpeg',
          uri: 'file:///camera/passport.jpg',
          width: 100,
        },
      ],
    });
    const { result } = await renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    const id = '00000000-0000-4000-8000-000000000001';
    expect(mmkvMock.__data.get(`doc_${id}`)).toBe(
      'data:image/jpeg;base64,aW1hZ2UtYnl0ZXM=',
    );
    expect(mmkvMock.__data.get('vault-metadata')).toContain('"label":"Passport"');
    expect(fileSystemMock.__deleteFile).toHaveBeenCalledTimes(1);
    expect(result.current.documents[0]).toMatchObject({ id, label: 'Passport' });
  });

  it('does not capture a document when camera permission is denied', async () => {
    requestCameraPermissionMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: false,
      status: 'denied' as PermissionStatus,
    });
    const { result } = await renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(launchCameraMock).not.toHaveBeenCalled();
    expect(mmkvMock.__data.size).toBe(0);
  });

  it('rolls back the encrypted blob when metadata persistence fails', async () => {
    requestCameraPermissionMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    launchCameraMock.mockResolvedValue({
      canceled: false,
      assets: [{ height: 100, uri: 'file:///camera/passport.jpg', width: 100 }],
    });
    mmkvMock.__instance.set.mockImplementation((key: string, value: string) => {
      if (key === 'vault-metadata') throw new Error('storage full');
      mmkvMock.__data.set(key, value);
    });
    const { result } = await renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(mmkvMock.__data.size).toBe(0);
    expect(result.current.documents).toEqual([]);
  });
});
