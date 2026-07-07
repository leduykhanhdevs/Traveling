import { Router } from 'express';
import { createBankTransferOrder, getBankTransferOrders } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const paymentRouter = Router();

paymentRouter.post('/bank-transfer/create', requireAuth, createBankTransferOrder);
paymentRouter.get('/bank-transfer', requireAuth, getBankTransferOrders);
