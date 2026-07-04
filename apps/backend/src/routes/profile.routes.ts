import { Router } from 'express';
import { getProfile, putProfile } from '../controllers/profile.controller.js';

export const profileRouter = Router();

profileRouter.get('/', getProfile);
profileRouter.put('/', putProfile);
