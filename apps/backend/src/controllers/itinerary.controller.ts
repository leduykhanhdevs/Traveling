import { itineraryRequestSchema } from '@traveling/shared';
import { z } from 'zod';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { AppError } from '../utils/errors.js';
import { prisma } from '../services/prisma.service.js';

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
  const filename = `traveling-itinerary-${itineraryId.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

  res
    .status(200)
    .setHeader('content-type', 'application/pdf')
    .setHeader('content-disposition', `attachment; filename="${filename}"`)
    .send(pdf);
});

export const getItineraries = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to fetch itineraries.', 401);
  }
  const user = await prisma.user.findUnique({
    where: { clerkId: req.auth.userId },
  });
  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found.', 404);
  }

  const itineraries = await prisma.itinerary.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, itineraries);
});

export const getItineraryById = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
  });
  if (!itinerary) {
    throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);
  }
  sendSuccess(res, itinerary);
});

export const putItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  const { content } = req.body;
  if (!content) {
    throw new AppError('BAD_REQUEST', 'Content payload is required.', 400);
  }
  
  const itinerary = await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { content },
  });
  sendSuccess(res, itinerary);
});

export const deleteItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  await prisma.itinerary.delete({
    where: { id: itineraryId },
  });
  sendSuccess(res, { success: true });
});
