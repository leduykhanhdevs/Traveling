import { z } from 'zod';

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const discoveryFiltersSchema = z.object({
  radiusMeters: z.number().int().min(100).max(10000).default(2000),
  priceRange: z
    .array(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
    .default([]),
  dietaryRestrictions: z.array(z.string().min(1)).default([]),
  openNow: z.boolean().default(false),
});

export const discoverRequestSchema = z.object({
  query: z.string().trim().min(1).max(240),
  lat: coordinatesSchema.shape.lat,
  lng: coordinatesSchema.shape.lng,
  filters: discoveryFiltersSchema,
  userId: z.string().optional(),
  surpriseMe: z.boolean().optional(),
});

export const translateRequestSchema = z.object({
  sourceText: z.string().trim().min(1).max(5000),
  sourceLang: z.string().optional(),
  targetLang: z.string().trim().min(2).max(8),
});

export const ocrTranslateRequestSchema = z.object({
  imageBase64: z.string().min(100),
  targetLang: z.string().trim().min(2).max(8),
});

export const speechTranscribeRequestSchema = z.object({
  audioBase64: z.string().min(100),
  languageCode: z.string().trim().min(2).max(12).optional(),
});

export const itineraryRequestSchema = z.object({
  destination: z.string().trim().min(2).max(120),
  days: z.number().int().min(1).max(21),
  budgetRange: z.union([z.literal('budget'), z.literal('midrange'), z.literal('premium')]),
  travelStyle: z.string().trim().min(2).max(80),
  userId: z.string().optional(),
});

export const reviewCreateSchema = z.object({
  placeId: z.string().trim().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
  photos: z.array(z.string().url()).default([]),
  tags: z.array(z.string().min(1).max(40)).default([]),
  nationality: z.string().trim().min(2).max(80),
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
