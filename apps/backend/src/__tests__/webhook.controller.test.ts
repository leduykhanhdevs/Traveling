import './external-service-mocks.js';
import crypto from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { MB_BANK_ACCOUNT } from '../controllers/payment.controller.js';
import { postBankTransferWebhook } from '../controllers/webhook.controller.js';
import { prisma } from '../services/prisma.service.js';

describe('webhook.controller', () => {
  const bankTransferOrderFindUniqueMock =
    prisma.bankTransferOrder.findUnique as unknown as jest.MockedFunction<
      (args: unknown) => Promise<unknown>
    >;
  const transactionMock = prisma.$transaction as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;

  const app = express();
  app.use(express.raw({ type: 'application/json' }));
  app.post('/webhook', postBankTransferWebhook);

  const signPayload = (payload: string, timestamp: string): string => {
    const hash = crypto
      .createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET!)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    return `sha256=${hash}`;
  };

  const validPayload = (id = 123): string =>
    JSON.stringify({
      accountNumber: MB_BANK_ACCOUNT,
      code: 'VIPABCDEF1234567890',
      content: 'VIPABCDEF1234567890 thanh toan',
      id,
      transferAmount: 120000,
      transferType: 'in',
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a webhook with an invalid signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const response = await request(app)
      .post('/webhook')
      .set('x-sepay-signature', 'sha256=invalid')
      .set('x-sepay-timestamp', timestamp)
      .set('content-type', 'application/json')
      .send(validPayload());

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects a correctly signed webhook outside the replay window', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000) - 301);
    const payload = validPayload();
    const response = await request(app)
      .post('/webhook')
      .set('x-sepay-signature', signPayload(payload, timestamp))
      .set('x-sepay-timestamp', timestamp)
      .set('content-type', 'application/json')
      .send(payload);

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('atomically grants premium for a valid incoming payment', async () => {
    const order = {
      amount: 120000,
      currency: 'VND',
      expiresAt: new Date(Date.now() + 60_000),
      id: 'order_1',
      planCode: 'monthly',
      status: 'pending',
      transferContent: 'VIPABCDEF1234567890',
      userId: 'user_1',
    };
    bankTransferOrderFindUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce(order);
    const grantCreateMock = jest.fn();
    transactionMock.mockImplementation(async (callback: unknown) => {
      const cb = callback as (tx: unknown) => Promise<unknown>;
      return cb({
        bankTransferOrder: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        premiumGrant: {
          create: grantCreateMock,
          findFirst: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = validPayload();
    const response = await request(app)
      .post('/webhook')
      .set('x-sepay-signature', signPayload(payload, timestamp))
      .set('x-sepay-timestamp', timestamp)
      .set('content-type', 'application/json')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(grantCreateMock).toHaveBeenCalledTimes(1);
  });

  it('acknowledges a duplicate provider transaction without granting again', async () => {
    bankTransferOrderFindUniqueMock.mockResolvedValue({ id: 'already_processed' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = validPayload();

    const first = await request(app)
      .post('/webhook')
      .set('x-sepay-signature', signPayload(payload, timestamp))
      .set('x-sepay-timestamp', timestamp)
      .set('content-type', 'application/json')
      .send(payload);
    const retry = await request(app)
      .post('/webhook')
      .set('x-sepay-signature', signPayload(payload, timestamp))
      .set('x-sepay-timestamp', timestamp)
      .set('content-type', 'application/json')
      .send(payload);

    expect(first.body).toEqual({ success: true });
    expect(retry.body).toEqual({ success: true });
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
