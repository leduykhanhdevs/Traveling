import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

const INVITE_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const invitePayloadSchema = z.object({
  version: z.literal(1),
  resourceType: z.enum(['budget', 'itinerary']),
  resourceId: z.string().trim().min(1).max(128),
  role: z.enum(['viewer', 'editor']),
  expiresAt: z.number().int().positive(),
});

export type InviteResourceType = z.infer<typeof invitePayloadSchema>['resourceType'];
export type InviteRole = z.infer<typeof invitePayloadSchema>['role'];

const signatureFor = (encodedPayload: string): Buffer =>
  createHmac('sha256', env.INVITE_TOKEN_SECRET).update(encodedPayload).digest();

export const createInviteToken = (input: {
  resourceType: InviteResourceType;
  resourceId: string;
  role: InviteRole;
}): string => {
  const payload = invitePayloadSchema.parse({
    version: 1,
    ...input,
    expiresAt: Math.floor(Date.now() / 1000) + INVITE_LIFETIME_SECONDS,
  });
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${signatureFor(encodedPayload).toString('base64url')}`;
};

export const verifyInviteToken = (
  token: string,
  expectedResourceType: InviteResourceType,
): z.infer<typeof invitePayloadSchema> => {
  if (token.length > 2048) {
    throw new AppError('INVALID_INVITE_TOKEN', 'Invite token is invalid.', 400);
  }

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError('INVALID_INVITE_TOKEN', 'Invite token is invalid.', 400);
  }

  let providedSignature: Buffer;
  let payload: unknown;
  try {
    providedSignature = Buffer.from(parts[1], 'base64url');
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new AppError('INVALID_INVITE_TOKEN', 'Invite token is invalid.', 400);
  }

  const expectedSignature = signatureFor(parts[0]);
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    throw new AppError('INVALID_INVITE_TOKEN', 'Invite token is invalid.', 401);
  }

  const parsed = invitePayloadSchema.safeParse(payload);
  if (!parsed.success || parsed.data.resourceType !== expectedResourceType) {
    throw new AppError('INVALID_INVITE_TOKEN', 'Invite token is invalid.', 400);
  }

  if (parsed.data.expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new AppError('INVITE_TOKEN_EXPIRED', 'Invite token has expired.', 410);
  }

  return parsed.data;
};
