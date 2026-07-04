import {
  CACHE_TTL_SECONDS,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type OcrTextBlock,
  type TranslateRequest,
  type TranslateResponse,
} from '@traveling/shared';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { stableHash } from '../utils/hash.js';
import { logUnknownError } from '../utils/logger.js';
import { fetchJson } from './http-client.js';
import { prisma } from './prisma.service.js';
import { getCacheJson, setCacheJson } from './redis.service.js';

type DeepLResponse = {
  translations: readonly {
    detected_source_language?: string;
    text: string;
  }[];
};

type GoogleTranslateResponse = {
  data?: {
    translations?: readonly {
      translatedText?: string;
      detectedSourceLanguage?: string;
    }[];
  };
};

type VisionResponse = {
  responses?: readonly {
    textAnnotations?: readonly {
      description?: string;
      boundingPoly?: {
        vertices?: readonly {
          x?: number;
          y?: number;
        }[];
      };
    }[];
  }[];
};

const languageFor = (
  code: string,
): { deeplTargetCode?: string; googleCode: string; code: LanguageCode } => {
  const language = SUPPORTED_LANGUAGES.find((candidate) => candidate.code === code);
  if (language) {
    return {
      deeplTargetCode: language.deeplTargetCode,
      googleCode: language.googleCode,
      code: language.code,
    };
  }

  return {
    googleCode: code,
    code: code as LanguageCode,
  };
};

const buildPronunciation = (translatedText: string): { ipa: string; romanization: string } => {
  const compact = translatedText.replace(/\s+/g, ' ').trim();
  return {
    ipa: compact.length > 0 ? `/${compact.toLowerCase().slice(0, 80)}/` : '',
    romanization: compact,
  };
};

const translateWithDeepL = async (request: TranslateRequest): Promise<TranslateResponse> => {
  const target = languageFor(request.targetLang);
  const params = new URLSearchParams();
  params.set('text', request.sourceText);
  params.set('target_lang', target.deeplTargetCode ?? request.targetLang.toUpperCase());
  if (request.sourceLang && request.sourceLang !== 'auto') {
    params.set('source_lang', request.sourceLang.toUpperCase());
  }

  const data = await fetchJson<DeepLResponse>(
    'https://api-free.deepl.com/v2/translate',
    {
      method: 'POST',
      headers: {
        authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
    'DeepL',
  );
  const translation = data.translations[0];
  if (!translation) {
    throw new AppError('DEEPL_EMPTY_RESPONSE', 'DeepL returned no translation.', 502);
  }

  return {
    sourceText: request.sourceText,
    translatedText: translation.text,
    sourceLang: (translation.detected_source_language?.toLowerCase() ??
      request.sourceLang ??
      'auto') as LanguageCode,
    targetLang: request.targetLang,
    provider: 'deepl',
    pronunciation: buildPronunciation(translation.text),
    cached: false,
  };
};

const translateWithGoogle = async (request: TranslateRequest): Promise<TranslateResponse> => {
  const target = languageFor(request.targetLang);
  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', env.GOOGLE_CLOUD_API_KEY);
  const body: Record<string, unknown> = {
    q: request.sourceText,
    target: target.googleCode,
    format: 'text',
  };
  if (request.sourceLang && request.sourceLang !== 'auto') {
    body.source = languageFor(request.sourceLang).googleCode;
  }
  const data = await fetchJson<GoogleTranslateResponse>(
    url,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    'Google Translation',
  );
  const translation = data.data?.translations?.[0];
  if (!translation?.translatedText) {
    throw new AppError('GOOGLE_TRANSLATE_EMPTY_RESPONSE', 'Google returned no translation.', 502);
  }

  return {
    sourceText: request.sourceText,
    translatedText: translation.translatedText,
    sourceLang: (translation.detectedSourceLanguage ??
      request.sourceLang ??
      'auto') as LanguageCode,
    targetLang: request.targetLang,
    provider: 'google',
    pronunciation: buildPronunciation(translation.translatedText),
    cached: false,
  };
};

const persistTranslation = async (hash: string, response: TranslateResponse): Promise<void> => {
  try {
    await prisma.translation.upsert({
      where: { hash },
      update: {
        translatedText: response.translatedText,
        cachedAt: new Date(),
      },
      create: {
        hash,
        sourceText: response.sourceText,
        sourceLang: response.sourceLang,
        targetLang: response.targetLang,
        translatedText: response.translatedText,
      },
    });
  } catch (error) {
    logUnknownError('Persisting translation failed', error, { hash });
  }
};

export const translateText = async (request: TranslateRequest): Promise<TranslateResponse> => {
  const cacheKey = `translate:${stableHash(request)}`;
  const cached = await getCacheJson<TranslateResponse>(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true,
    };
  }

  const hash = stableHash(request);

  try {
    const deepl = await translateWithDeepL(request);
    await setCacheJson(cacheKey, deepl, CACHE_TTL_SECONDS.translations);
    await persistTranslation(hash, deepl);
    return deepl;
  } catch (error) {
    logUnknownError('DeepL failed; attempting Google fallback', error, {
      targetLang: request.targetLang,
    });
  }

  const google = await translateWithGoogle(request);
  await setCacheJson(cacheKey, google, CACHE_TTL_SECONDS.translations);
  await persistTranslation(hash, google);
  return google;
};

export const translateImageText = async (
  imageBase64: string,
  targetLang: LanguageCode,
): Promise<readonly OcrTextBlock[]> => {
  try {
    const url = new URL('https://vision.googleapis.com/v1/images:annotate');
    url.searchParams.set('key', env.GOOGLE_CLOUD_API_KEY);
    const vision = await fetchJson<VisionResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 20,
                },
              ],
            },
          ],
        }),
      },
      'Google Vision',
    );

    const annotations = vision.responses?.[0]?.textAnnotations?.slice(1) ?? [];
    const blocks = await Promise.all(
      annotations.slice(0, 30).map(async (annotation) => {
        const translated = await translateText({
          sourceText: annotation.description ?? '',
          targetLang,
        });
        const vertices = annotation.boundingPoly?.vertices ?? [];
        const xs = vertices.map((vertex) => vertex.x ?? 0);
        const ys = vertices.map((vertex) => vertex.y ?? 0);
        const minX = xs.length > 0 ? Math.min(...xs) : 0;
        const minY = ys.length > 0 ? Math.min(...ys) : 0;
        const maxX = xs.length > 0 ? Math.max(...xs) : 0;
        const maxY = ys.length > 0 ? Math.max(...ys) : 0;
        return {
          text: annotation.description ?? '',
          translatedText: translated.translatedText,
          boundingBox: {
            x: minX,
            y: minY,
            width: Math.max(1, maxX - minX),
            height: Math.max(1, maxY - minY),
          },
        };
      }),
    );
    return blocks;
  } catch (error) {
    logUnknownError('OCR translation failed', error);
    throw error;
  }
};
