import { Router } from 'express';
import { postDiscover } from '../controllers/discover.controller.js';

export const discoverRouter = Router();

discoverRouter.post('/', postDiscover);
