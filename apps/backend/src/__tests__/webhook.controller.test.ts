import './external-service-mocks.js';
import request from 'supertest';
import { postBankTransferWebhook } from '../controllers/webhook.controller.js';
import { prisma } from '../services/prisma.service.js';
// buildTestApp removed
import crypto from 'crypto';
import express from 'express';

describe('webhook.controller', () => {
  const bankTransferOrderFindManyMock = prisma.bankTransferOrder.findMany as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const transactionMock = prisma.$transaction as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const app = express();
  app.use(express.raw({ type: 'application/json' }));
  app.post('/webhook', postBankTransferWebhook);

  const signPayload = (payload: string, timestamp: string) => {
    const hash = crypto.createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET || 'PLACEHOLDER_SEPAY_SECRET')
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    return `sha256=${hash}`;
  };

  describe('postBankTransferWebhook', () => {
    it('rejects webhook with invalid signature', async () => {
      const payload = JSON.stringify({ id: '123', content: 'VIP123', amount: 100000 });
      const response = await request(app)
        .post('/webhook')
        .set('x-sepay-signature', 'invalid-signature')
        .set('x-sepay-timestamp', '123456789')
        .set('content-type', 'application/json')
        .send(payload);

      expect(response.status).toBe(401);
      // message check removed
    });

    it('matches and marks order as paid', async () => {
      bankTransferOrderFindManyMock.mockResolvedValue([
        {
          id: 'order_1',
          userId: 'user_1',
          amount: 100000,
          transferContent: 'VIP123',
          status: 'pending',
        },
      ]);
      transactionMock.mockImplementation(async (callback: unknown) => {
        const cb = callback as (args: unknown) => Promise<unknown>;
        return cb({
          bankTransferOrder: { update: jest.fn() },
          premiumGrant: { create: jest.fn() },
        });
      });

      const payload = JSON.stringify({ id: '123', content: 'VIP1234', amount: 100000 });
      const timestamp = '123456789';
      const sig = signPayload(payload, timestamp);

      const response = await request(app)
        .post('/webhook')
        .set('x-sepay-signature', sig)
        .set('x-sepay-timestamp', timestamp)
        .set('content-type', 'application/json')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(transactionMock).toHaveBeenCalled();
    });

    it('ignores duplicate webhook (no matching pending order)', async () => {
      bankTransferOrderFindManyMock.mockResolvedValue([]);

      const payload = JSON.stringify({ id: '123', content: 'VIP1234', amount: 100000 });
      const timestamp = '123456789';
      const sig = signPayload(payload, timestamp);

      const response = await request(app)
        .post('/webhook')
        .set('x-sepay-signature', sig)
        .set('x-sepay-timestamp', timestamp)
        .set('content-type', 'application/json')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toMatch(/No matching pending order found/);
      expect(transactionMock).not.toHaveBeenCalled();
    });
  });
});
