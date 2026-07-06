import {
  ocrTranslateRequestSchema,
  translateRequestSchema,
  type LanguageCode,
} from '@traveling/shared';
import { translateImageText, translateText } from '../services/translation.service.js';
import { checkAndIncrementUsage } from '../services/billing.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { logUserActivity } from '../services/activity.service.js';

export const postTranslate = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  await checkAndIncrementUsage(userId, 'translation');
  
  const body = translateRequestSchema.parse(req.body);
  const data = await translateText({
    sourceText: body.sourceText,
    sourceLang: body.sourceLang as LanguageCode | undefined,
    targetLang: body.targetLang as LanguageCode,
  });
  
  await logUserActivity(userId, 'translate', {
    sourceLang: body.sourceLang,
    targetLang: body.targetLang,
    textLength: body.sourceText.length,
  });
  
  sendSuccess(res, data);
});

export const postOcrTranslate = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  await checkAndIncrementUsage(userId, 'translation');
  
  const body = ocrTranslateRequestSchema.parse(req.body);
  const blocks = await translateImageText(body.imageBase64, body.targetLang as LanguageCode);
  
  await logUserActivity(userId, 'ocr_translate', {
    targetLang: body.targetLang,
    blocksCount: blocks.length,
  });
  
  sendSuccess(res, { blocks });
});
