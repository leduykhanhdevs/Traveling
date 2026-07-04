import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { fetchJson } from './http-client.js';

type SpeechResponse = {
  results?: readonly {
    alternatives?: readonly {
      transcript?: string;
      confidence?: number;
    }[];
  }[];
};

export type TranscriptionResult = {
  transcript: string;
  confidence: number;
};

export const transcribeAudio = async (
  audioBase64: string,
  languageCode = 'en-US',
): Promise<TranscriptionResult> => {
  const url = new URL('https://speech.googleapis.com/v1/speech:recognize');
  url.searchParams.set('key', env.GOOGLE_CLOUD_API_KEY);
  const data = await fetchJson<SpeechResponse>(
    url,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'ENCODING_UNSPECIFIED',
          languageCode,
          enableAutomaticPunctuation: true,
          model: 'latest_short',
        },
        audio: {
          content: audioBase64,
        },
      }),
    },
    'Google Speech',
  );
  const alternative = data.results?.[0]?.alternatives?.[0];
  if (!alternative?.transcript) {
    throw new AppError('TRANSCRIPTION_EMPTY', 'No speech was recognized in the audio.', 422);
  }

  return {
    transcript: alternative.transcript,
    confidence: alternative.confidence ?? 0,
  };
};
