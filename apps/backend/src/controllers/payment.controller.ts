import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { posthog } from '../services/posthog.service.js';

export const MB_BANK_BIN = '970422'; // NAPAS BIN for MB Bank
export const MB_BANK_ACCOUNT = '190720060000';
const MB_BANK_ACCOUNT_NAME = 'PLACEHOLDER_ACCOUNT_NAME';

const bankTransferOrderSchema = z.object({
  planCode: z.enum(['monthly', 'yearly']),
});

export const createBankTransferOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  if (env.NODE_ENV === 'production' && MB_BANK_ACCOUNT_NAME.startsWith('PLACEHOLDER_')) {
    throw new AppError(
      'PAYMENT_CONFIGURATION_REQUIRED',
      'Bank transfer payments are not configured.',
      503,
    );
  }

  const { planCode } = bankTransferOrderSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before purchasing.', 404);
  }

  const amount = planCode === 'monthly' ? 120000 : 1200000; // e.g. 120k VND / month
  const transferContent = `VIP${randomBytes(8).toString('hex').toUpperCase()}`;

  const order = await prisma.bankTransferOrder.create({
    data: {
      userId: user.id,
      planCode,
      amount,
      currency: 'VND',
      transferContent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours to pay
    },
  });

  const qrUrl = new URL(
    `https://api.vietqr.io/image/${MB_BANK_BIN}-${MB_BANK_ACCOUNT}-compact.jpg`,
  );
  qrUrl.searchParams.set('amount', String(amount));
  qrUrl.searchParams.set('addInfo', transferContent);
  qrUrl.searchParams.set('accountName', MB_BANK_ACCOUNT_NAME);

  posthog.capture({
    distinctId: userId,
    event: 'payment_initiated',
    properties: {
      plan_code: planCode,
      amount,
      currency: 'VND',
      order_id: order.id,
    },
  });

  sendSuccess(res, {
    orderId: order.id,
    amount,
    transferContent,
    accountNumber: MB_BANK_ACCOUNT,
    bankName: 'MB Bank',
    accountName: MB_BANK_ACCOUNT_NAME,
    qrUrl: qrUrl.toString(),
    expiresAt: order.expiresAt.toISOString(),
  });
});

export const getBankTransferOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before viewing orders.', 404);
  }

  const orders = await prisma.bankTransferOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { orders });
});
