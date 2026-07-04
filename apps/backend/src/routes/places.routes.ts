import { Router } from 'express';
import { getPlaceDetail, postSavePlace } from '../controllers/places.controller.js';

export const placesRouter = Router();

placesRouter.get('/:placeId', getPlaceDetail);
placesRouter.post('/save', postSavePlace);
