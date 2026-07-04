import { Router } from 'express';
import { postTranscribe } from '../controllers/speech.controller.js';

export const speechRouter = Router();

speechRouter.post('/transcribe', postTranscribe);
