import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { File } from 'expo-file-system';
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
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is required for voice translation.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Recording failed to start.');
      setRecording(false);
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!recording) {
      return null;
    }

    try {
      await recorder.stop();
      setRecording(false);

      const uri = recorder.uri;
      if (!uri) {
        setError('Recorded audio file was unavailable.');
        return null;
      }
      const file = new File(uri);
      const base64 = await file.base64();
      return { uri, base64 };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Recording failed to stop.');
      setRecording(false);
      return null;
    }
  }, [recording, recorder]);

  return {
    recording,
    error,
    startRecording,
    stopRecording,
  };
};
