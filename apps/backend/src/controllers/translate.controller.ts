import {
  ocrTranslateRequestSchema,
  translateRequestSchema,
  type LanguageCode,
} from '@traveling/shared';
import { translateImageText, translateText } from '../services/translation.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

export const postTranslate = asyncHandler(async (req, res) => {
  const body = translateRequestSchema.parse(req.body);
  const data = await translateText({
    sourceText: body.sourceText,
    sourceLang: body.sourceLang as LanguageCode | undefined,
    targetLang: body.targetLang as LanguageCode,
  });
  sendSuccess(res, data);
});

export const postOcrTranslate = asyncHandler(async (req, res) => {
  const body = ocrTranslateRequestSchema.parse(req.body);
  const blocks = await translateImageText(body.imageBase64, body.targetLang as LanguageCode);
  sendSuccess(res, { blocks });
});
