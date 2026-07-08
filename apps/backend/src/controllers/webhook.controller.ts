import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import crypto from 'crypto';
import { posthog } from '../services/posthog.service.js';

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

  // SePay payload structure usually includes transaction id, content and amount
  const { id: providerTransactionId, content, amount } = payload;

  if (!content || !amount) {
    return sendSuccess(res, { success: true, message: 'Ignored, missing content or amount' });
  }

  // Idempotency guard 1: if this provider transaction was already processed
  // (SePay retries webhooks), acknowledge without granting again.
  if (providerTransactionId !== undefined && providerTransactionId !== null) {
    const alreadyProcessed = await prisma.bankTransferOrder.findFirst({
      where: { providerTransactionId: String(providerTransactionId) },
    });

    if (alreadyProcessed) {
      return sendSuccess(res, { success: true, message: 'Transaction already processed' });
    }
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

  // Idempotency guard 2: atomic claim of the pending order. `updateMany` with the
  // status filter only succeeds for exactly one concurrent request; the unique
  // constraint on providerTransactionId is the final DB-level backstop.
  let granted = false;

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.bankTransferOrder.updateMany({
        where: { id: matchingOrder.id, status: 'pending' },
        data: {
          status: 'paid',
          paidAt: new Date(),
          providerTransactionId:
            providerTransactionId !== undefined && providerTransactionId !== null
              ? String(providerTransactionId)
              : null,
        }
      });

      if (claimed.count !== 1) {
        // A concurrent webhook already claimed this order; do not double-grant.
        return;
      }

      const days = matchingOrder.planCode === 'yearly' ? 365 : 30;
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);

      await tx.premiumGrant.create({
        data: {
          userId: matchingOrder.userId,
          source: 'bank_transfer',
          expiresAt,
        }
      });

      granted = true;
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      // Unique constraint violation on providerTransactionId: a concurrent
      // retry already recorded this transaction.
      return sendSuccess(res, { success: true, message: 'Transaction already processed' });
    }
    throw error;
  }

  if (!granted) {
    return sendSuccess(res, { success: true, message: 'Order already claimed by a concurrent request' });
  }

  posthog.capture({
    distinctId: matchingOrder.userId,
    event: 'payment_completed',
    properties: {
      plan_code: matchingOrder.planCode,
      amount: matchingOrder.amount,
      currency: matchingOrder.currency,
      order_id: matchingOrder.id,
      source: 'bank_transfer',
    },
  });

  res.status(200).json({ success: true });
});
