import { act, renderHook } from './render-hook';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as expoAudio from 'expo-audio';
import { File } from 'expo-file-system';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(),
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => {
  return {
    File: jest.fn(),
  };
});

const mockRecorder = {
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn(),
  uri: 'file:///recording.m4a',
};

describe('useVoiceRecorder', () => {
  const requestPermissionsMock = jest.mocked(expoAudio.requestRecordingPermissionsAsync);
  const useAudioRecorderMock = jest.mocked(expoAudio.useAudioRecorder);
  const fileMock = jest.mocked(File);
  const base64Mock = jest.fn<() => Promise<string>>();

  beforeEach(() => {
    jest.clearAllMocks();
    useAudioRecorderMock.mockReturnValue(mockRecorder as any);
    mockRecorder.uri = 'file:///recording.m4a';
    mockRecorder.stop.mockResolvedValue(undefined as never);
    fileMock.mockImplementation(() => ({ base64: base64Mock }) as any);
  });

  it('starts with idle recording state', async () => {
    const { result } = await renderHook(() => useVoiceRecorder());
    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts a high-quality recording after microphone permission is granted', async () => {
    requestPermissionsMock.mockResolvedValue({ granted: true } as any);
    mockRecorder.prepareToRecordAsync.mockResolvedValue(undefined as never);
    
    const { result } = await renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockRecorder.prepareToRecordAsync).toHaveBeenCalled();
    expect(mockRecorder.record).toHaveBeenCalled();
  });

  it('sets an error when microphone permission is denied', async () => {
    requestPermissionsMock.mockResolvedValue({ granted: false } as any);
    const { result } = await renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBe('Microphone permission is required for voice translation.');
    expect(mockRecorder.record).not.toHaveBeenCalled();
  });

  it('sets an error when recording fails to start', async () => {
    requestPermissionsMock.mockResolvedValue({ granted: true } as any);
    mockRecorder.prepareToRecordAsync.mockRejectedValue(new Error('Audio mode unavailable') as never);
    const { result } = await renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toBe('Audio mode unavailable');
  });

  it('stops recording and returns base64 audio', async () => {
    requestPermissionsMock.mockResolvedValue({ granted: true } as any);
    mockRecorder.prepareToRecordAsync.mockResolvedValue(undefined as never);
    base64Mock.mockResolvedValue('base64-audio');
    const { result } = await renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    let audio = null;
    await act(async () => {
      audio = await result.current.stopRecording();
    });

    expect(audio).toEqual({ uri: 'file:///recording.m4a', base64: 'base64-audio' });
    expect(result.current.recording).toBe(false);
    expect(mockRecorder.stop).toHaveBeenCalled();
    expect(fileMock).toHaveBeenCalledWith('file:///recording.m4a');
    expect(base64Mock).toHaveBeenCalled();
  });

  it('returns null when stopping without an active recording', async () => {
    const { result } = await renderHook(() => useVoiceRecorder());

    let audio = null;
    await act(async () => {
      audio = await result.current.stopRecording();
    });

    expect(audio).toBeNull();
    expect(base64Mock).not.toHaveBeenCalled();
  });

  it('sets an error when the recorded file URI is unavailable', async () => {
    requestPermissionsMock.mockResolvedValue({ granted: true } as any);
    mockRecorder.prepareToRecordAsync.mockResolvedValue(undefined as never);
    mockRecorder.uri = null as any;
    const { result } = await renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.error).toBe('Recorded audio file was unavailable.');
    expect(base64Mock).not.toHaveBeenCalled();
  });
});
