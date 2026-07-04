import { speechTranscribeRequestSchema } from '@traveling/shared';
import { transcribeAudio } from '../services/speech.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

export const postTranscribe = asyncHandler(async (req, res) => {
  const body = speechTranscribeRequestSchema.parse(req.body);
  const data = await transcribeAudio(body.audioBase64, body.languageCode);
  sendSuccess(res, data);
});
