import { prisma } from './prisma.service.js';
import { logUnknownError } from '../utils/logger.js';

export const logUserActivity = async (
  userId: string,
  action: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) return;

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        details: details || undefined,
      },
    });
  } catch (error) {
    logUnknownError('Failed to log user activity', error, { userId, action });
  }
};

export const getUserActivities = async (userId: string, limit = 50) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) return [];

    return await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    logUnknownError('Failed to get user activities', error, { userId });
    return [];
  }
};

export const trackViewedPlace = async (
  userId: string,
  place: {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    emoji?: string;
  }
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) return;

    await prisma.viewedPlace.upsert({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.placeId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.id,
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        emoji: place.emoji ?? '📍',
      },
    });
  } catch (error) {
    logUnknownError('Failed to track viewed place', error, { userId, placeId: place.placeId });
  }
};

export const getViewedPlaces = async (userId: string, limit = 10) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) return [];

    return await prisma.viewedPlace.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    logUnknownError('Failed to get viewed places', error, { userId });
    return [];
  }
};
