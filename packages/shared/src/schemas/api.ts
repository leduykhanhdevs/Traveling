import { z } from 'zod';
import { isLanguageCode, isTranslationTargetLanguageCode } from '../constants/languages.js';

const MAX_BASE64_PAYLOAD_LENGTH = 14_000_000;

const base64PayloadSchema = z
  .string()
  .trim()
  .min(100)
  .max(MAX_BASE64_PAYLOAD_LENGTH)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'Payload must be valid base64.')
  .refine((value) => value.length % 4 === 0, 'Payload must be valid base64.');

export const languageCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isLanguageCode, 'Unsupported language code.');

export const translationTargetLanguageCodeSchema = languageCodeSchema.refine(
  isTranslationTargetLanguageCode,
  'Target language cannot use automatic detection.',
);

export const speechLanguageCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(12)
  .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z]{2,4})?$/, 'Invalid speech language code.');

export const coordinatesSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();

export const discoveryFiltersSchema = z
  .object({
    radiusMeters: z.number().int().min(100).max(10000).default(2000),
    priceRange: z
      .array(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
      .max(5)
      .refine((values) => new Set(values).size === values.length, 'Price levels must be unique.')
      .default([]),
    dietaryRestrictions: z.array(z.string().trim().min(1).max(64)).max(16).default([]),
    openNow: z.boolean().default(false),
  })
  .strict();

export const discoverRequestSchema = z
  .object({
    query: z.string().trim().min(1).max(240),
    lat: coordinatesSchema.shape.lat,
    lng: coordinatesSchema.shape.lng,
    filters: discoveryFiltersSchema,
    userId: z.string().trim().min(1).max(255).optional(),
    surpriseMe: z.boolean().optional(),
  })
  .strict();

export const translateRequestSchema = z
  .object({
    sourceText: z.string().trim().min(1).max(5000),
    sourceLang: languageCodeSchema.optional(),
    targetLang: translationTargetLanguageCodeSchema,
  })
  .strict();

export const ocrTranslateRequestSchema = z
  .object({
    imageBase64: base64PayloadSchema,
    targetLang: translationTargetLanguageCodeSchema,
  })
  .strict();

export const speechTranscribeRequestSchema = z
  .object({
    audioBase64: base64PayloadSchema,
    languageCode: speechLanguageCodeSchema.optional(),
  })
  .strict();

export const itineraryRequestSchema = z
  .object({
    destination: z.string().trim().min(2).max(120),
    days: z.number().int().min(1).max(21),
    budgetRange: z.union([z.literal('budget'), z.literal('midrange'), z.literal('premium')]),
    travelStyle: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine(
        (value) =>
          [...value].every((character) => {
            const codePoint = character.codePointAt(0) ?? 0;
            return codePoint >= 0x20 && codePoint !== 0x7f;
          }),
        'Travel style cannot contain control characters.',
      ),
    userId: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

export const reviewCreateSchema = z
  .object({
    placeId: z.string().trim().min(1).max(255),
    rating: z.number().min(1).max(5),
    text: z.string().trim().min(1).max(2000),
    photos: z
      .array(
        z
          .string()
          .trim()
          .url()
          .max(2048)
          .regex(/^https:\/\//i, 'Photo URL must use HTTPS.'),
      )
      .max(10)
      .default([]),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    nationality: z.string().trim().min(2).max(80),
  })
  .strict();

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
