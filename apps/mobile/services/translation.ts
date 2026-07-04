import type {
  LanguageCode,
  OcrTranslateResponse,
  TranslateRequest,
  TranslateResponse,
} from '@traveling/shared';
import { apiRequest } from './api';

export const translateText = (
  request: TranslateRequest,
  token?: string | null,
): Promise<TranslateResponse> =>
  apiRequest<TranslateResponse>('/api/v1/translate', {
    method: 'POST',
    body: request,
    token,
  });

export const translateImage = (
  imageBase64: string,
  targetLang: LanguageCode,
  token?: string | null,
): Promise<OcrTranslateResponse> =>
  apiRequest<OcrTranslateResponse>('/api/v1/translate/ocr', {
    method: 'POST',
    body: {
      imageBase64,
      targetLang,
    },
    token,
  });

export const transcribeAudio = (
  audioBase64: string,
  languageCode: string,
  token?: string | null,
): Promise<{ transcript: string; confidence: number }> =>
  apiRequest('/api/v1/speech/transcribe', {
    method: 'POST',
    body: {
      audioBase64,
      languageCode,
    },
    token,
  });
