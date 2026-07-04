import { Router } from 'express';
import { postExportItinerary, postGenerateItinerary } from '../controllers/itinerary.controller.js';

export const itineraryRouter = Router();

itineraryRouter.post('/generate', postGenerateItinerary);
itineraryRouter.post('/:id/export', postExportItinerary);
