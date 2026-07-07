import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import crypto from 'crypto';

const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || 'PLACEHOLDER_SEPAY_SECRET';

export const postBankTransferWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signatureHeader = req.headers['x-sepay-signature'];
  const timestamp = req.headers['x-sepay-timestamp'];
  
  if (!signatureHeader || !timestamp || typeof signatureHeader !== 'string' || typeof timestamp !== 'string') {
    throw new AppError('UNAUTHORIZED', 'Missing SePay headers', 401);
  }

  // req.body is a Buffer because we used express.raw()
  const rawBody = req.body.toString('utf8');
  
  const message = `${timestamp}.${rawBody}`;
  const hash = crypto.createHmac('sha256', SEPAY_WEBHOOK_SECRET).update(message).digest('hex');
  const expectedSignature = `sha256=${hash}`;

  if (signatureHeader !== expectedSignature) {
    throw new AppError('UNAUTHORIZED', 'Invalid signature', 401);
  }

  // Parse the body now that signature is verified
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    throw new AppError('INVALID_INPUT', 'Invalid JSON body', 400);
  }

  // SePay payload structure usually includes transaction content and amount
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _transactionId, content, amount } = payload;
  
  if (!content || !amount) {
    return sendSuccess(res, { success: true, message: 'Ignored, missing content or amount' });
  }

  // Extract the transfer code from content e.g. "VIP12345ABC"
  // content might be like "NGUYEN VAN A CHUYEN TIEN VIP12345ABC"
  // We can find any pending order whose transferContent is included in the webhook content
  
  const pendingOrders = await prisma.bankTransferOrder.findMany({
    where: { status: 'pending' }
  });

  const matchingOrder = pendingOrders.find((order) => content.includes(order.transferContent) && amount >= order.amount);

  if (!matchingOrder) {
    return sendSuccess(res, { success: true, message: 'No matching pending order found' });
  }

  // Idempotency: verify we haven't already processed this (if SePay sends retries)
  // Since we filter by status: 'pending', it won't double-grant, but to be safer:
  
  await prisma.$transaction(async (tx) => {
    // 1. Mark order as paid
    await tx.bankTransferOrder.update({
      where: { id: matchingOrder.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      }
    });

    // 2. Grant Premium
    const days = matchingOrder.planCode === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);
    
    await tx.premiumGrant.create({
      data: {
        userId: matchingOrder.userId,
        source: 'bank_transfer',
        expiresAt,
      }
    });
  });

  res.status(200).json({ success: true });
});
