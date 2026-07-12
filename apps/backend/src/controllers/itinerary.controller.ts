import { itineraryRequestSchema } from '@traveling/shared';
import { z } from 'zod';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { checkAndIncrementUsage } from '../services/billing.service.js';
import { getEntitlementStatus } from '../services/billing.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { AppError } from '../utils/errors.js';
import { prisma } from '../services/prisma.service.js';
import { posthog } from '../services/posthog.service.js';
import { createInviteToken, verifyInviteToken } from '../utils/invite-token.js';

const FREE_TIER_SAVED_ITINERARY_LIMIT = 1;

export const postGenerateItinerary = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;

  // Free tier keeps at most 1 saved itinerary; premium is unlimited.
  const entitlement = await getEntitlementStatus(userId);
  if (entitlement.tier !== 'premium') {
    const profile = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (profile) {
      const savedCount = await prisma.itinerary.count({ where: { userId: profile.id } });
      if (savedCount >= FREE_TIER_SAVED_ITINERARY_LIMIT) {
        throw new AppError(
          'PAYMENT_REQUIRED',
          `Free plan is limited to ${FREE_TIER_SAVED_ITINERARY_LIMIT} saved itinerary. Delete an itinerary or upgrade to premium.`,
          402,
        );
      }
    }
  }

  await checkAndIncrementUsage(userId, 'itinerary');

  const body = itineraryRequestSchema.parse(req.body);
  const plan = await generateItinerary({
    ...body,
    userId,
  });
  posthog.capture({
    distinctId: userId,
    event: 'itinerary_generated',
    properties: {
      destination: body.destination,
      days: body.days,
      budget_range: body.budgetRange,
      travel_style: body.travelStyle,
    },
  });
  sendSuccess(res, plan);
});

export const generateItineraryInvite = asyncHandler(async (req, res) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) throw new AppError('UNAUTHORIZED', 'Sign in to invite.', 401);
  const itineraryId = z.string().min(1).parse(req.params.id);
  const { role } = z
    .object({ role: z.enum(['viewer', 'editor']).default('editor') })
    .parse(req.body ?? {});

  const status = await getEntitlementStatus(clerkUserId);
  if (status.tier !== 'premium') {
    throw new AppError('PAYMENT_REQUIRED', 'Only Premium users can share itineraries.', 402);
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found.', 404);

  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, userId: user.id },
  });

  if (!itinerary) {
    throw new AppError('NOT_FOUND', 'Itinerary not found or you do not own it.', 404);
  }

  const inviteToken = createInviteToken({
    resourceType: 'itinerary',
    resourceId: itineraryId,
    role,
  });

  posthog.capture({
    distinctId: clerkUserId,
    event: 'itinerary_shared',
    properties: { itinerary_id: itineraryId },
  });

  sendSuccess(res, {
    inviteToken,
    url: `https://traveling.app/invite/itinerary?token=${encodeURIComponent(inviteToken)}`,
  });
});

export const acceptItineraryInvite = asyncHandler(async (req, res) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) throw new AppError('UNAUTHORIZED', 'Sign in to accept invite.', 401);
  const { token } = z.object({ token: z.string().trim().min(1).max(2048) }).parse(req.body);
  const invite = verifyInviteToken(token, 'itinerary');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found.', 404);

  const itinerary = await prisma.itinerary.findUnique({
    where: { id: invite.resourceId },
    select: { id: true, userId: true },
  });
  if (!itinerary) {
    throw new AppError('ITINERARY_NOT_FOUND', 'Itinerary could not be found.', 404);
  }

  if (itinerary.userId === user.id) {
    sendSuccess(res, { success: true, itineraryId: itinerary.id });
    return;
  }

  await prisma.sharedItinerary.upsert({
    where: { itineraryId_userId: { itineraryId: itinerary.id, userId: user.id } },
    update: { role: invite.role },
    create: {
      itineraryId: itinerary.id,
      userId: user.id,
      role: invite.role,
    },
  });

  posthog.capture({
    distinctId: clerkUserId,
    event: 'itinerary_invite_accepted',
    properties: { itinerary_id: itinerary.id },
  });

  sendSuccess(res, { success: true, itineraryId: itinerary.id });
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

  posthog.capture({
    distinctId: req.auth!.userId,
    event: 'itinerary_exported',
    properties: { itinerary_id: itineraryId },
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    budgetRange: itinerary.budgetRange as any,
    userId: user.id,
    travelStyle: user.travelStyle || 'any',
  });

  const updated = await prisma.itinerary.update({
    where: { id: itinerary.id },
    data: { content: newContent }
  });

  posthog.capture({
    distinctId: clerkUserId,
    event: 'weather_replan_triggered',
    properties: {
      itinerary_id: itineraryId,
      destination: itinerary.destination,
    },
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
  posthog.capture({
    distinctId: req.auth!.userId,
    event: 'itinerary_deleted',
    properties: { itinerary_id: itineraryId },
  });
  sendSuccess(res, { success: true });
});
