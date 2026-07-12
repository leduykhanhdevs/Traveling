import { createClerkClient } from '@clerk/backend';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const getVerifiedPrimaryEmail = async (clerkUserId: string): Promise<string> => {
  const user = await clerk.users.getUser(clerkUserId);
  const primaryEmail = user.primaryEmailAddress;
  if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
    throw new AppError(
      'VERIFIED_EMAIL_REQUIRED',
      'A verified primary email address is required.',
      409,
    );
  }

  return primaryEmail.emailAddress.trim().toLowerCase();
};
