jest.mock('../services/translation.service.js', () => ({
  translateImageText: jest.fn(),
  translateText: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { postOcrTranslate, postTranslate } from '../controllers/translate.controller.js';
import { translateImageText, translateText } from '../services/translation.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

const validTranslateBody = {
  sourceText: 'Hello',
  targetLang: 'vi',
};

describe('translate.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('translates text input', async () => {
      const translation = {
        sourceText: 'Hello',
        translatedText: 'Xin chao',
        sourceLang: 'en' as const,
        targetLang: 'vi' as const,
        provider: 'deepl' as const,
        pronunciation: {
          ipa: '/xin chao/',
          romanization: 'Xin chao',
        },
        cached: false,
      };
      const translateTextMock = jest.mocked(translateText);
      translateTextMock.mockResolvedValue(translation);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postTranslate],
        },
      ]);

      const response = await request(app).post('/').send(validTranslateBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: translation });
      expect(translateTextMock).toHaveBeenCalledWith({
        sourceText: 'Hello',
        sourceLang: undefined,
        targetLang: 'vi',
      });
    });
  });

  describe('4xx error', () => {
    it('returns validation error for empty text', async () => {
      const translateTextMock = jest.mocked(translateText);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postTranslate],
        },
      ]);

      const response = await request(app).post('/').send({ ...validTranslateBody, sourceText: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(translateTextMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected translation route has no user', async () => {
      const translateImageTextMock = jest.mocked(translateImageText);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/ocr',
          handlers: [requireAuthForTest, postOcrTranslate],
        },
      ]);

      const response = await request(app)
        .post('/ocr')
        .send({ imageBase64: 'b'.repeat(120), targetLang: 'en' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(translateImageTextMock).not.toHaveBeenCalled();
    });
  });
});
