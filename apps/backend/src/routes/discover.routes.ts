import { Router } from 'express';
import { postDiscover } from '../controllers/discover.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const discoverRouter = Router();

discoverRouter.post('/', requireAuth, postDiscover);
