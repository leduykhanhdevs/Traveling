import { Router } from 'express';
import { postUploadUrl } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const uploadRouter = Router();

uploadRouter.post('/url', requireAuth, postUploadUrl);
