import { Router } from 'express';
import { postOcrTranslate, postTranslate } from '../controllers/translate.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const translateRouter = Router();

translateRouter.post('/', requireAuth, postTranslate);
translateRouter.post('/ocr', requireAuth, postOcrTranslate);
