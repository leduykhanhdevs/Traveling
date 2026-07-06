import { Router } from 'express';
import { postTranscribe } from '../controllers/speech.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const speechRouter = Router();

speechRouter.post('/transcribe', requireAuth, postTranscribe);
