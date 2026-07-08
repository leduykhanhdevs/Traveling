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
import { posthog } from '../services/posthog.service.js';

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
  posthog.capture({
    distinctId: userId,
    event: 'text_translated',
    properties: {
      source_lang: body.sourceLang,
      target_lang: body.targetLang,
      text_length: body.sourceText.length,
    },
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
  posthog.capture({
    distinctId: userId,
    event: 'ocr_translation_requested',
    properties: {
      target_lang: body.targetLang,
      blocks_count: blocks.length,
    },
  });

  sendSuccess(res, { blocks });
});
