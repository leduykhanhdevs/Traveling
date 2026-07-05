import { Router } from 'express';
import {
  postExportItinerary,
  postGenerateItinerary,
  getItineraries,
  getItineraryById,
  putItinerary,
  deleteItinerary,
} from '../controllers/itinerary.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const itineraryRouter = Router();

itineraryRouter.use(requireAuth);
itineraryRouter.get('/', getItineraries);
itineraryRouter.get('/:id', getItineraryById);
itineraryRouter.post('/generate', postGenerateItinerary);
itineraryRouter.put('/:id', putItinerary);
itineraryRouter.delete('/:id', deleteItinerary);
itineraryRouter.post('/:id/export', postExportItinerary);
