import { z } from 'zod';
import { getGooglePlaceDetails } from '../services/google-places.service.js';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { posthog } from '../services/posthog.service.js';

const savePlaceSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

export const getPlaceDetail = asyncHandler(async (req, res) => {
  const placeId = z.string().min(1).parse(req.params.placeId);
  const [details, reviews] = await Promise.all([
    getGooglePlaceDetails(placeId),
    prisma.review.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  if (!details) {
    throw new AppError('PLACE_NOT_FOUND', 'Place details could not be found.', 404);
  }

  sendSuccess(res, {
    ...details,
    communityReviews: reviews.map((review: (typeof reviews)[number]) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      photos: review.photos,
      tags: review.tags,
      nationality: review.nationality,
      createdAt: review.createdAt.toISOString(),
    })),
  });
});

export const postSavePlace = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to save places.', 401);
  }
  const body = savePlaceSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: {
      clerkId: req.auth.userId,
    },
  });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before saving places.', 404);
  }

  const { getEntitlementStatus } = await import('../services/billing.service.js');
  const status = await getEntitlementStatus(req.auth.userId);

  if (status.tier !== 'premium') {
    const savedCount = await prisma.savedPlace.count({
      where: { userId: user.id },
    });
    if (savedCount >= status.freeLimits.freeSavedPlaces) {
      throw new AppError(
        'PAYMENT_REQUIRED',
        'You have reached the maximum number of saved places for free users. Upgrade to premium for unlimited saves.',
        402
      );
    }
  }

  const saved = await prisma.savedPlace.upsert({
    where: {
      userId_placeId: {
        userId: user.id,
        placeId: body.placeId,
      },
    },
    update: {
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
    },
    create: {
      userId: user.id,
      placeId: body.placeId,
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
    },
  });
  posthog.capture({
    distinctId: req.auth!.userId,
    event: 'place_saved',
    properties: {
      place_id: body.placeId,
      place_name: body.name,
    },
  });
  sendSuccess(res, saved, 201);
});
