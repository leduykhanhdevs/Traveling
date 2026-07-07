import { z } from 'zod';
import {
  createBudget,
  createBudgetItem,
  deleteBudgetItem,
  listBudgets,
} from '../services/budget.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';

const budgetSchema = z.object({
  tripName: z.string().trim().min(1).max(120),
  totalBudget: z.number().positive(),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
});

const budgetItemSchema = z.object({
  category: z.enum(['Food', 'Transport', 'Accommodation', 'Activities', 'Other']),
  amount: z.number().positive(),
  description: z.string().trim().min(1).max(240),
  date: z.string().datetime(),
});

const requireUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to manage budgets.', 401);
  }

  return userId;
};

export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await listBudgets(requireUserId(req.auth?.userId));
  sendSuccess(res, { budgets });
});

export const postBudget = asyncHandler(async (req, res) => {
  const body = budgetSchema.parse(req.body);
  const budget = await createBudget(requireUserId(req.auth?.userId), body);
  sendSuccess(res, budget, 201);
});

export const postBudgetItem = asyncHandler(async (req, res) => {
  const budgetId = z.string().min(1).parse(req.params.id);
  const body = budgetItemSchema.parse(req.body);
  const budget = await createBudgetItem(requireUserId(req.auth?.userId), budgetId, body);
  sendSuccess(res, budget, 201);
});

export const deleteBudgetItemById = asyncHandler(async (req, res) => {
  const budgetId = z.string().min(1).parse(req.params.id);
  const itemId = z.string().min(1).parse(req.params.itemId);
  const budget = await deleteBudgetItem(requireUserId(req.auth?.userId), budgetId, itemId);
  sendSuccess(res, budget);
});

import { getEntitlementStatus } from '../services/billing.service.js';
import crypto from 'crypto';

export const generateBudgetInvite = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId);
  const budgetId = z.string().min(1).parse(req.params.id);

  const status = await getEntitlementStatus(clerkUserId);
  if (status.tier !== 'premium') {
    throw new AppError('PAYMENT_REQUIRED', 'Only Premium users can share budgets.', 402);
  }

  const { prisma } = await import('../services/prisma.service.js');
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }});
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId: user.id }
  });

  if (!budget) {
    throw new AppError('NOT_FOUND', 'Budget not found or you do not own it.', 404);
  }

  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret');
  hmac.update(`budget_invite:${budgetId}`);
  const signature = hmac.digest('hex');

  const inviteToken = Buffer.from(JSON.stringify({ budgetId, sig: signature })).toString('base64');
  
  sendSuccess(res, { inviteToken, url: `https://traveling.app/invite/budget?token=${inviteToken}` });
});

export const acceptBudgetInvite = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId);
  const { token } = req.body;
  if (!token) throw new AppError('INVALID_INPUT', 'Token is required', 400);

  let payload;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch (e) {
    throw new AppError('INVALID_INPUT', 'Invalid token', 400);
  }

  const { budgetId, sig } = payload;
  if (!budgetId || !sig) throw new AppError('INVALID_INPUT', 'Invalid token format', 400);

  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret');
  hmac.update(`budget_invite:${budgetId}`);
  const expectedSig = hmac.digest('hex');

  if (sig !== expectedSig) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired invite token', 401);
  }

  const { prisma } = await import('../services/prisma.service.js');
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }});
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  await prisma.sharedBudget.upsert({
    where: { budgetId_userId: { budgetId, userId: user.id } },
    update: {},
    create: { budgetId, userId: user.id, role: 'editor' }
  });

  sendSuccess(res, { success: true, budgetId });
});
