import { itineraryRequestSchema } from '@traveling/shared';
import { z } from 'zod';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { checkAndIncrementUsage } from '../services/billing.service.js';
import { getEntitlementStatus } from '../services/billing.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { AppError } from '../utils/errors.js';
import { prisma } from '../services/prisma.service.js';
import crypto from 'crypto';

export const postGenerateItinerary = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  await checkAndIncrementUsage(userId, 'itinerary');
  
  const body = itineraryRequestSchema.parse(req.body);
  const plan = await generateItinerary({
    ...body,
    userId,
  });
  sendSuccess(res, plan);
});

export const generateItineraryInvite = asyncHandler(async (req, res) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) throw new AppError('UNAUTHORIZED', 'Sign in to invite.', 401);
  const itineraryId = z.string().min(1).parse(req.params.id);

  const status = await getEntitlementStatus(clerkUserId);
  if (status.tier !== 'premium') {
    throw new AppError('PAYMENT_REQUIRED', 'Only Premium users can share itineraries.', 402);
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }});
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, userId: user.id }
  });

  if (!itinerary) {
    throw new AppError('NOT_FOUND', 'Itinerary not found or you do not own it.', 404);
  }

  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret');
  hmac.update(`itinerary_invite:${itineraryId}`);
  const signature = hmac.digest('hex');

  const inviteToken = Buffer.from(JSON.stringify({ itineraryId, sig: signature })).toString('base64');
  
  sendSuccess(res, { inviteToken, url: `https://traveling.app/invite/itinerary?token=${inviteToken}` });
});

export const acceptItineraryInvite = asyncHandler(async (req, res) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) throw new AppError('UNAUTHORIZED', 'Sign in to accept invite.', 401);
  const { token } = req.body;
  if (!token) throw new AppError('INVALID_INPUT', 'Token is required', 400);

  let payload;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch (e) {
    throw new AppError('INVALID_INPUT', 'Invalid token', 400);
  }

  const { itineraryId, sig } = payload;
  if (!itineraryId || !sig) throw new AppError('INVALID_INPUT', 'Invalid token format', 400);

  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret');
  hmac.update(`itinerary_invite:${itineraryId}`);
  const expectedSig = hmac.digest('hex');

  if (sig !== expectedSig) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired invite token', 401);
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }});
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  await prisma.sharedItinerary.upsert({
    where: { itineraryId_userId: { itineraryId, userId: user.id } },
    update: {},
    create: { itineraryId, userId: user.id, role: 'editor' }
  });

  sendSuccess(res, { success: true, itineraryId });
});

export const postExportItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  if (!req.auth?.userId) throw new AppError('UNAUTHORIZED', 'Sign in to export itineraries.', 401);
  const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User profile not found.', 404);

  const existing = await prisma.itinerary.findFirst({ where: { id: itineraryId, userId: user.id } });
  if (!existing) throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);

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
  if (!req.auth?.userId) throw new AppError('UNAUTHORIZED', 'Sign in to access itineraries.', 401);
  const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User profile not found.', 404);

  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, userId: user.id },
  });
  if (!itinerary) {
    throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);
  }
  sendSuccess(res, itinerary);
});

import { getWeather } from '../services/utility.service.js';

export const postReplanWeather = asyncHandler(async (req, res) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) throw new AppError('UNAUTHORIZED', 'Sign in required.', 401);
  const itineraryId = z.string().min(1).parse(req.params.id);

  const status = await getEntitlementStatus(clerkUserId);
  if (status.tier !== 'premium') {
    throw new AppError('PAYMENT_REQUIRED', 'Weather-aware re-planning is a premium feature.', 402);
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }});
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, userId: user.id }
  });

  if (!itinerary) {
    throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);
  }

  const weather = await getWeather(itinerary.destination);

  const newContent = await generateItinerary({
    destination: `${itinerary.destination} (Weather context: ${weather.description}, ${weather.temperatureCelsius}°C, prioritizing indoor activities if it's raining)`,
    days: itinerary.days,
    budgetRange: itinerary.budgetRange as any,
    userId: user.id,
    travelStyle: user.travelStyle || 'any',
  });

  const updated = await prisma.itinerary.update({
    where: { id: itinerary.id },
    data: { content: newContent }
  });

  sendSuccess(res, updated);
});

export const putItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  const { content } = req.body;
  if (!content) {
    throw new AppError('BAD_REQUEST', 'Content payload is required.', 400);
  }
  if (!req.auth?.userId) throw new AppError('UNAUTHORIZED', 'Sign in to modify itineraries.', 401);
  const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User profile not found.', 404);

  const existing = await prisma.itinerary.findFirst({ where: { id: itineraryId, userId: user.id } });
  if (!existing) throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);
  
  const itinerary = await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { content },
  });
  sendSuccess(res, itinerary);
});

export const deleteItinerary = asyncHandler(async (req, res) => {
  const itineraryId = z.string().trim().min(1).parse(req.params.id);
  if (!req.auth?.userId) throw new AppError('UNAUTHORIZED', 'Sign in to delete itineraries.', 401);
  const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User profile not found.', 404);

  const existing = await prisma.itinerary.findFirst({ where: { id: itineraryId, userId: user.id } });
  if (!existing) throw new AppError('NOT_FOUND', 'Itinerary not found.', 404);

  await prisma.itinerary.delete({
    where: { id: itineraryId },
  });
  sendSuccess(res, { success: true });
});
