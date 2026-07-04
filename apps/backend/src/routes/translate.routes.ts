import { Router } from 'express';
import { postOcrTranslate, postTranslate } from '../controllers/translate.controller.js';

export const translateRouter = Router();

translateRouter.post('/', postTranslate);
translateRouter.post('/ocr', postOcrTranslate);
