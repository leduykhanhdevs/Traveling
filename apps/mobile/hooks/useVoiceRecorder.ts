import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';

export type RecordedAudio = {
  uri: string;
  base64: string;
};

export const useVoiceRecorder = (): {
  recording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordedAudio | null>;
} => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission is required for voice translation.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(created.recording);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Recording failed to start.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) {
      return null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) {
        setError('Recorded audio file was unavailable.');
        return null;
      }
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { uri, base64 };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Recording failed to stop.');
      return null;
    }
  }, [recording]);

  return {
    recording: Boolean(recording),
    error,
    startRecording,
    stopRecording,
  };
};
