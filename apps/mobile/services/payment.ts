import { apiRequest } from './api';

export type BankTransferOrder = {
  orderId: string;
  amount: number;
  transferContent: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  qrUrl: string;
};

export const createBankTransferOrder = (
  planCode: 'monthly' | 'yearly',
  token: string
): Promise<BankTransferOrder> =>
  apiRequest('/api/v1/payments/bank-transfer/create', {
    method: 'POST',
    body: { planCode },
    token,
  });

export const getBankTransferOrders = (
  token: string
): Promise<{ orders: unknown[] }> =>
  apiRequest('/api/v1/payments/bank-transfer', { token });
