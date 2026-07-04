import { act, renderHook } from './render-hook';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import type { PermissionStatus } from 'expo-modules-core';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const recording = {
  getURI: jest.fn(() => 'file:///recording.m4a'),
  stopAndUnloadAsync: jest.fn(),
};

describe('useVoiceRecorder', () => {
  const requestPermissionsMock = jest.mocked(Audio.requestPermissionsAsync);
  const setAudioModeMock = jest.mocked(Audio.setAudioModeAsync);
  const createRecordingMock = jest.mocked(Audio.Recording.createAsync);
  const readAsStringMock = jest.mocked(FileSystem.readAsStringAsync);

  beforeEach(() => {
    jest.clearAllMocks();
    recording.getURI.mockReturnValue('file:///recording.m4a');
    recording.stopAndUnloadAsync.mockResolvedValue(undefined as never);
  });

  it('starts with idle recording state', () => {
    const { result } = renderHook(() => useVoiceRecorder());

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts a high-quality recording after microphone permission is granted', async () => {
    requestPermissionsMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    setAudioModeMock.mockResolvedValue(undefined as never);
    createRecordingMock.mockResolvedValue({ recording } as never);
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.error).toBeNull();
    expect(setAudioModeMock).toHaveBeenCalledWith({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    expect(createRecordingMock).toHaveBeenCalledWith(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  });

  it('sets an error when microphone permission is denied', async () => {
    requestPermissionsMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: false,
      status: 'denied' as PermissionStatus,
    });
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBe('Microphone permission is required for voice translation.');
    expect(createRecordingMock).not.toHaveBeenCalled();
  });

  it('sets an error when recording fails to start', async () => {
    requestPermissionsMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    setAudioModeMock.mockRejectedValue(new Error('Audio mode unavailable'));
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBe('Audio mode unavailable');
  });

  it('stops recording and returns base64 audio', async () => {
    requestPermissionsMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    setAudioModeMock.mockResolvedValue(undefined as never);
    createRecordingMock.mockResolvedValue({ recording } as never);
    readAsStringMock.mockResolvedValue('base64-audio');
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    let audio = null;
    await act(async () => {
      audio = await result.current.stopRecording();
    });

    expect(audio).toEqual({ uri: 'file:///recording.m4a', base64: 'base64-audio' });
    expect(result.current.recording).toBe(false);
    expect(recording.stopAndUnloadAsync).toHaveBeenCalled();
    expect(readAsStringMock).toHaveBeenCalledWith('file:///recording.m4a', {
      encoding: FileSystem.EncodingType.Base64,
    });
  });

  it('returns null when stopping without an active recording', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    let audio = null;
    await act(async () => {
      audio = await result.current.stopRecording();
    });

    expect(audio).toBeNull();
    expect(readAsStringMock).not.toHaveBeenCalled();
  });

  it('sets an error when the recorded file URI is unavailable', async () => {
    requestPermissionsMock.mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: 'granted' as PermissionStatus,
    });
    setAudioModeMock.mockResolvedValue(undefined as never);
    createRecordingMock.mockResolvedValue({ recording } as never);
    recording.getURI.mockReturnValue(null as unknown as string);
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.error).toBe('Recorded audio file was unavailable.');
    expect(readAsStringMock).not.toHaveBeenCalled();
  });
});
