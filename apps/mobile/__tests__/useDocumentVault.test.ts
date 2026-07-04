import { act, renderHook } from './render-hook';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { PermissionStatus } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import { useDocumentVault } from '../hooks/useDocumentVault';

describe('useDocumentVault', () => {
  const getItemMock = jest.mocked(SecureStore.getItemAsync);
  const setItemMock = jest.mocked(SecureStore.setItemAsync);
  const requestCameraPermissionMock = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
  const launchCameraMock = jest.mocked(ImagePicker.launchCameraAsync);
  const makeDirectoryMock = jest.mocked(FileSystem.makeDirectoryAsync);
  const copyMock = jest.mocked(FileSystem.copyAsync);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with an empty document list when secure storage is empty', async () => {
    getItemMock.mockResolvedValue(null);
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.documents).toEqual([]);
  });

  it('reloads stored vault documents from secure storage', async () => {
    const storedDocuments = [
      {
        id: 'doc_1',
        label: 'Passport',
        localUri: 'file:///documents/vault/doc_1.jpg',
        createdAt: '2026-05-30T00:00:00.000Z',
      },
    ];
    getItemMock.mockResolvedValue(JSON.stringify(storedDocuments));
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.documents).toEqual(storedDocuments);
    expect(getItemMock).toHaveBeenCalledWith('traveling-document-vault');
  });

  it('adds a captured document to the encrypted vault', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(12345);
    getItemMock.mockResolvedValue('[]');
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
    makeDirectoryMock.mockResolvedValue(undefined);
    copyMock.mockResolvedValue(undefined);
    setItemMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(makeDirectoryMock).toHaveBeenCalledWith('file:///documents/vault/', {
      intermediates: true,
    });
    expect(copyMock).toHaveBeenCalledWith({
      from: 'file:///camera/passport.jpg',
      to: 'file:///documents/vault/12345.jpg',
    });
    expect(setItemMock).toHaveBeenCalledWith(
      'traveling-document-vault',
      expect.stringContaining('"label":"Passport"'),
    );
    expect(result.current.documents[0]).toMatchObject({
      id: '12345',
      label: 'Passport',
      localUri: 'file:///documents/vault/12345.jpg',
    });
  });

  it('does not add a document when camera permission is denied', async () => {
    getItemMock.mockResolvedValue('[]');
    requestCameraPermissionMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: false,
      status: 'denied' as PermissionStatus,
    });
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(launchCameraMock).not.toHaveBeenCalled();
    expect(setItemMock).not.toHaveBeenCalled();
    expect(result.current.documents).toEqual([]);
  });

  it('does not add a document when the camera capture is cancelled', async () => {
    getItemMock.mockResolvedValue('[]');
    requestCameraPermissionMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    launchCameraMock.mockResolvedValue({
      canceled: true,
      assets: null,
    });
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(makeDirectoryMock).not.toHaveBeenCalled();
    expect(copyMock).not.toHaveBeenCalled();
    expect(setItemMock).not.toHaveBeenCalled();
  });

  it('falls back to reload when document persistence fails', async () => {
    getItemMock.mockResolvedValue('[]');
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
    makeDirectoryMock.mockRejectedValue(new Error('file system unavailable'));
    const { result } = renderHook(() => useDocumentVault());

    await act(async () => {
      await result.current.addDocument('Passport');
    });

    expect(result.current.documents).toEqual([]);
  });
});
