import { z } from 'zod';
import { getEntitlementStatus } from '../services/billing.service.js';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

const upsertProfileSchema = z.object({
  email: z.string().email(),
  preferredLanguage: z.string().min(2),
  dietaryRestrictions: z.array(z.string()).default([]),
  travelStyle: z.string().min(2),
  spicyPreference: z.number().int().min(1).max(5),
  sweetPreference: z.number().int().min(1).max(5),
  savoryPreference: z.number().int().min(1).max(5),
  nationality: z.string().optional(),
});

export const getProfile = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to load your profile.', 401);
  }
  const user = await prisma.user.findUnique({
    where: { clerkId: req.auth.userId },
  });
  const entitlement = await getEntitlementStatus(req.auth.userId);
  sendSuccess(res, {
    user,
    entitlement,
  });
});

export const putProfile = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to update your profile.', 401);
  }
  const body = upsertProfileSchema.parse(req.body);
  const user = await prisma.user.upsert({
    where: {
      clerkId: req.auth.userId,
    },
    update: body,
    create: {
      clerkId: req.auth.userId,
      ...body,
    },
  });
  sendSuccess(res, user);
});
