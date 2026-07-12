import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { MB_BANK_ACCOUNT } from './payment.controller.js';
import { posthog } from '../services/posthog.service.js';
import { prisma } from '../services/prisma.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/errors.js';

const MAX_WEBHOOK_CLOCK_SKEW_SECONDS = 5 * 60;
const TRANSFER_CODE_PATTERN = /(?:^|[^A-Z0-9])(VIP[A-Z0-9]{10,30})(?=$|[^A-Z0-9])/i;

const sePayPayloadSchema = z
  .object({
    id: z.number().int().nonnegative(),
    accountNumber: z.string().trim().min(1).max(64),
    code: z.string().trim().min(1).max(64).nullable().optional(),
    content: z.string().trim().min(1).max(1000),
    transferType: z.enum(['in', 'out']),
    transferAmount: z.number().int().positive().max(1_000_000_000_000),
  })
  .passthrough();

const acknowledge = (res: Response): void => {
  res.status(200).json({ success: true });
};

const verifySignature = (rawBody: Buffer, signature: string, timestamp: string): void => {
  if (!/^\d{10}$/.test(timestamp)) {
    throw new AppError('UNAUTHORIZED', 'Invalid SePay timestamp.', 401);
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_WEBHOOK_CLOCK_SKEW_SECONDS) {
    throw new AppError('UNAUTHORIZED', 'SePay webhook timestamp is outside the allowed window.', 401);
  }

  const expected = Buffer.from(
    `sha256=${createHmac('sha256', env.SEPAY_WEBHOOK_SECRET)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex')}`,
    'utf8',
  );
  const provided = Buffer.from(signature, 'utf8');

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new AppError('UNAUTHORIZED', 'Invalid SePay signature.', 401);
  }
};

const transferCodeFrom = (code: string | null | undefined, content: string): string | null => {
  const normalizedCode = code?.toUpperCase();
  if (normalizedCode?.startsWith('VIP')) {
    return normalizedCode;
  }
  return content.match(TRANSFER_CODE_PATTERN)?.[1]?.toUpperCase() ?? null;
};

export const postBankTransferWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.header('x-sepay-signature');
  const timestamp = req.header('x-sepay-timestamp');
  if (!signature || !timestamp || !Buffer.isBuffer(req.body)) {
    throw new AppError('UNAUTHORIZED', 'Missing or invalid SePay webhook headers.', 401);
  }

  verifySignature(req.body, signature, timestamp);

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(req.body.toString('utf8')) as unknown;
  } catch {
    throw new AppError('INVALID_INPUT', 'Invalid JSON body.', 400);
  }
  const payload = sePayPayloadSchema.parse(rawPayload);

  if (payload.transferType !== 'in' || payload.accountNumber !== MB_BANK_ACCOUNT) {
    acknowledge(res);
    return;
  }

  const providerTransactionId = String(payload.id);
  const alreadyProcessed = await prisma.bankTransferOrder.findUnique({
    where: { providerTransactionId },
  });
  if (alreadyProcessed) {
    acknowledge(res);
    return;
  }

  const transferContent = transferCodeFrom(payload.code, payload.content);
  if (!transferContent) {
    acknowledge(res);
    return;
  }

  const matchingOrder = await prisma.bankTransferOrder.findUnique({
    where: { transferContent },
  });
  if (
    !matchingOrder ||
    matchingOrder.status !== 'pending' ||
    payload.transferAmount !== matchingOrder.amount
  ) {
    acknowledge(res);
    return;
  }

  const now = new Date();
  if (matchingOrder.expiresAt <= now) {
    await prisma.bankTransferOrder.updateMany({
      where: { id: matchingOrder.id, status: 'pending' },
      data: { status: 'expired' },
    });
    acknowledge(res);
    return;
  }

  const durationDays =
    matchingOrder.planCode === 'yearly'
      ? 365
      : matchingOrder.planCode === 'monthly'
        ? 30
        : null;
  if (!durationDays) {
    throw new AppError('INVALID_PAYMENT_PLAN', 'Payment order has an invalid plan.', 500);
  }

  let granted = false;
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.bankTransferOrder.updateMany({
        where: {
          id: matchingOrder.id,
          status: 'pending',
          expiresAt: { gt: now },
        },
        data: {
          status: 'paid',
          paidAt: now,
          providerTransactionId,
        },
      });
      if (claimed.count !== 1) {
        return;
      }

      const latestActiveGrant = await tx.premiumGrant.findFirst({
        where: {
          userId: matchingOrder.userId,
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: 'desc' },
      });
      const startsAt = latestActiveGrant?.expiresAt ?? now;
      const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await tx.premiumGrant.create({
        data: {
          userId: matchingOrder.userId,
          source: 'bank_transfer',
          expiresAt,
        },
      });
      granted = true;
    });
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') {
      throw error;
    }
  }

  if (granted) {
    posthog.capture({
      distinctId: matchingOrder.userId,
      event: 'payment_completed',
      properties: {
        plan_code: matchingOrder.planCode,
        amount: matchingOrder.amount,
        currency: matchingOrder.currency,
        source: 'bank_transfer',
      },
    });
  }

  acknowledge(res);
});
