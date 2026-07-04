jest.mock('../config/env.js', () => ({
  env: {
    DEEPL_API_KEY: 'test_deepl_key',
    GOOGLE_CLOUD_API_KEY: 'test_google_cloud_key',
  },
}));

jest.mock('../services/http-client.js', () => ({
  fetchJson: jest.fn(),
}));

import './jest.setup.js';
import './external-service-mocks.js';
import { fetchJson } from '../services/http-client.js';
import { prisma } from '../services/prisma.service.js';
import { getCacheJson, setCacheJson } from '../services/redis.service.js';
import { translateImageText, translateText } from '../services/translation.service.js';

type FetchJsonMock = (
  url: string | URL,
  init: RequestInit | undefined,
  serviceName: string,
) => Promise<unknown>;

const fetchJsonMock = fetchJson as unknown as jest.MockedFunction<FetchJsonMock>;
const getCacheJsonMock = getCacheJson as unknown as jest.MockedFunction<
  (key: string) => Promise<unknown | null>
>;
const setCacheJsonMock = setCacheJson as unknown as jest.MockedFunction<
  (key: string, value: unknown, ttlSeconds: number) => Promise<void>
>;
const translationUpsertMock = prisma.translation.upsert as unknown as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>;

describe('translation.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns cached translations without calling upstream providers', async () => {
      getCacheJsonMock.mockResolvedValue({
        sourceText: 'Hello',
        translatedText: 'Xin chao',
        sourceLang: 'en',
        targetLang: 'vi',
        provider: 'deepl',
        pronunciation: {
          ipa: '/xin chao/',
          romanization: 'Xin chao',
        },
        cached: false,
      });

      const result = await translateText({
        sourceText: 'Hello',
        targetLang: 'vi',
      });

      expect(result.cached).toBe(true);
      expect(result.translatedText).toBe('Xin chao');
      expect(fetchJsonMock).not.toHaveBeenCalled();
      expect(setCacheJsonMock).not.toHaveBeenCalled();
    });

    it('translates OCR blocks through Google Vision and DeepL', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock
        .mockResolvedValueOnce({
          responses: [
            {
              textAnnotations: [
                { description: 'Full menu text' },
                {
                  description: 'Pho bo',
                  boundingPoly: {
                    vertices: [
                      { x: 10, y: 20 },
                      { x: 90, y: 20 },
                      { x: 90, y: 60 },
                      { x: 10, y: 60 },
                    ],
                  },
                },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          translations: [
            {
              detected_source_language: 'VI',
              text: 'Beef noodle soup',
            },
          ],
        });
      translationUpsertMock.mockResolvedValue({ id: 'translation_1' });

      const blocks = await translateImageText('image_base64_payload', 'en');

      expect(blocks).toEqual([
        {
          text: 'Pho bo',
          translatedText: 'Beef noodle soup',
          boundingBox: {
            x: 10,
            y: 20,
            width: 80,
            height: 40,
          },
        },
      ]);
      expect(fetchJsonMock).toHaveBeenNthCalledWith(
        1,
        expect.any(URL),
        expect.objectContaining({ method: 'POST' }),
        'Google Vision',
      );
    });
  });

  describe('error path', () => {
    it('falls back to Google Translation when DeepL fails', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock
        .mockRejectedValueOnce(new Error('DeepL unavailable'))
        .mockResolvedValueOnce({
          data: {
            translations: [
              {
                detectedSourceLanguage: 'en',
                translatedText: 'Xin chao',
              },
            ],
          },
        });
      translationUpsertMock.mockResolvedValue({ id: 'translation_1' });

      const result = await translateText({
        sourceText: 'Hello',
        targetLang: 'vi',
      });

      expect(result.provider).toBe('google');
      expect(result.translatedText).toBe('Xin chao');
      expect(fetchJsonMock).toHaveBeenCalledTimes(2);
      expect(setCacheJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth failure case', () => {
    it('does not require auth context and still avoids exposing provider keys in responses', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock.mockResolvedValueOnce({
        translations: [
          {
            detected_source_language: 'EN',
            text: 'Bonjour',
          },
        ],
      });
      translationUpsertMock.mockResolvedValue({ id: 'translation_2' });

      const result = await translateText({
        sourceText: 'Hello',
        targetLang: 'fr',
      });

      expect(result).toMatchObject({
        provider: 'deepl',
        translatedText: 'Bonjour',
        cached: false,
      });
      expect(JSON.stringify(result)).not.toContain('test_deepl_key');
      expect(JSON.stringify(result)).not.toContain('test_google_cloud_key');
    });
  });
});
