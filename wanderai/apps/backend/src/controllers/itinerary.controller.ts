import { itineraryRequestSchema } from '@wanderai/shared';
import { z } from 'zod';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

export const postGenerateItinerary = asyncHandler(async (req, res) => {
  const body = itineraryRequestSchema.parse(req.body);
  const plan = await generateItinerary({
    ...body,
    userId: req.auth?.userId ?? body.userId,
  });
  sendSuccess(res, plan);
});

export const postExportItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  const pdf = await exportItineraryPdf(itineraryId, req.body as unknown);
  const filename = `wanderai-itinerary-${itineraryId.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

  res
    .status(200)
    .setHeader('content-type', 'application/pdf')
    .setHeader('content-disposition', `attachment; filename="${filename}"`)
    .send(pdf);
});
