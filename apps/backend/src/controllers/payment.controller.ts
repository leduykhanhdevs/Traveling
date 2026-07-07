import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';
import { asyncHandler } from '../utils/async-handler.js';

const MB_BANK_BIN = '970422'; // NAPAS BIN for MB Bank
const MB_BANK_ACCOUNT = '190720060000';
const MB_BANK_ACCOUNT_NAME = 'PLACEHOLDER_ACCOUNT_NAME';

export const createBankTransferOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { planCode } = req.body;
  if (!planCode || (planCode !== 'monthly' && planCode !== 'yearly')) {
    throw new AppError('INVALID_INPUT', 'Valid planCode is required (monthly, yearly)', 400);
  }

  const amount = planCode === 'monthly' ? 120000 : 1200000; // e.g. 120k VND / month
  const orderFragment = Math.random().toString(36).substring(2, 8).toUpperCase();
  const userFragment = userId.substring(userId.length - 4).toUpperCase();
  const transferContent = `VIP${userFragment}${orderFragment}`;

  const order = await prisma.bankTransferOrder.create({
    data: {
      userId,
      planCode,
      amount,
      currency: 'VND',
      transferContent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours to pay
    },
  });

  const qrUrl = `https://api.vietqr.io/image/${MB_BANK_BIN}-${MB_BANK_ACCOUNT}-compact.jpg?amount=${amount}&addInfo=${transferContent}&accountName=${MB_BANK_ACCOUNT_NAME}`;

  sendSuccess(res, {
    orderId: order.id,
    amount,
    transferContent,
    accountNumber: MB_BANK_ACCOUNT,
    bankName: 'MB Bank',
    accountName: MB_BANK_ACCOUNT_NAME,
    qrUrl,
  });
});

export const getBankTransferOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const orders = await prisma.bankTransferOrder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { orders });
});
