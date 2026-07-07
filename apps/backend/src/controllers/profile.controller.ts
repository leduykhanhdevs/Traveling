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
  appLocale: z.string().optional(),
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

export const getProfileStats = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to load stats.', 401);
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: req.auth.userId },
  });
  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found.', 404);
  }

  const tripsPlanned = await prisma.itinerary.count({
    where: { userId: user.id },
  });

  const placesSaved = await prisma.savedPlace.count({
    where: { userId: user.id },
  });

  const itineraries = await prisma.itinerary.findMany({
    where: { userId: user.id },
    select: { destination: true },
  });
  
  const savedPlaces = await prisma.savedPlace.findMany({
    where: { userId: user.id },
    select: { address: true },
  });

  const locations = new Set<string>();
  if (user.nationality) {
    locations.add(user.nationality.toLowerCase());
  }
  itineraries.forEach((it: { destination: string }) => {
    locations.add(it.destination.toLowerCase().trim());
  });
  savedPlaces.forEach((pl: { address: string }) => {
    const parts = pl.address.split(',');
    const lastPart = parts[parts.length - 1]?.trim().toLowerCase();
    if (lastPart) {
      locations.add(lastPart);
    }
  });

  const countriesVisited = Math.max(1, locations.size);

  sendSuccess(res, {
    countriesVisited,
    tripsPlanned,
    placesSaved,
  });
});
