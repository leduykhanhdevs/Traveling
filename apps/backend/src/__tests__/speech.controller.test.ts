jest.mock('../services/speech.service.js', () => ({
  transcribeAudio: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { postTranscribe } from '../controllers/speech.controller.js';
import { transcribeAudio } from '../services/speech.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

const validSpeechBody = {
  audioBase64: 'a'.repeat(120),
  languageCode: 'en-US',
};

describe('speech.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('transcribes base64 audio', async () => {
      const transcription = {
        transcript: 'Where is the train station?',
        confidence: 0.94,
      };
      const transcribeAudioMock = jest.mocked(transcribeAudio);
      transcribeAudioMock.mockResolvedValue(transcription);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/transcribe',
          handlers: [authenticated('clerk_user_1'), postTranscribe],
        },
      ]);

      const response = await request(app).post('/transcribe').send(validSpeechBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: transcription });
      expect(transcribeAudioMock).toHaveBeenCalledWith('a'.repeat(120), 'en-US');
    });
  });

  describe('4xx error', () => {
    it('returns validation error for too-short audio payload', async () => {
      const transcribeAudioMock = jest.mocked(transcribeAudio);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/transcribe',
          handlers: [authenticated('clerk_user_1'), postTranscribe],
        },
      ]);

      const response = await request(app)
        .post('/transcribe')
        .send({ ...validSpeechBody, audioBase64: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(transcribeAudioMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected speech route has no user', async () => {
      const transcribeAudioMock = jest.mocked(transcribeAudio);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/transcribe',
          handlers: [requireAuthForTest, postTranscribe],
        },
      ]);

      const response = await request(app).post('/transcribe').send(validSpeechBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(transcribeAudioMock).not.toHaveBeenCalled();
    });
  });
});
