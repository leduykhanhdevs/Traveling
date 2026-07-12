import { z } from 'zod';
import {
  createBudget,
  createBudgetItem,
  deleteBudgetItem,
  getBudgetDetail,
  getBudgetSettlement,
  listBudgets,
  listSharedBudgets,
} from '../services/budget.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';
import { posthog } from '../services/posthog.service.js';
import { getEntitlementStatus } from '../services/billing.service.js';
import { prisma } from '../services/prisma.service.js';
import { createInviteToken, verifyInviteToken } from '../utils/invite-token.js';

const budgetSchema = z.object({
  tripName: z.string().trim().min(1).max(120),
  totalBudget: z.number().finite().positive().max(1_000_000_000_000),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
});

const splitSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('equal'),
    participantIds: z.array(z.string().trim().min(1)).min(1).max(50),
  }),
  z.object({
    type: z.literal('custom'),
    shares: z
      .array(
        z.object({
          userId: z.string().trim().min(1),
          amount: z.number().finite().positive().max(1_000_000_000_000),
        }),
      )
      .min(1)
      .max(50),
  }),
]);

const budgetItemSchema = z.object({
  category: z.enum(['Food', 'Transport', 'Accommodation', 'Activities', 'Other']),
  amount: z.number().finite().positive().max(1_000_000_000_000),
  description: z.string().trim().min(1).max(240),
  date: z.string().datetime(),
  paidById: z.string().trim().min(1).optional(),
  split: splitSchema.optional(),
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
  const userId = requireUserId(req.auth?.userId);
  const body = budgetSchema.parse(req.body);
  const budget = await createBudget(userId, body);
  posthog.capture({
    distinctId: userId,
    event: 'budget_created',
    properties: {
      currency: body.currency,
      total_budget: body.totalBudget,
    },
  });
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

export const getSharedBudgets = asyncHandler(async (req, res) => {
  const budgets = await listSharedBudgets(requireUserId(req.auth?.userId));
  sendSuccess(res, { budgets });
});

export const getBudgetDetailById = asyncHandler(async (req, res) => {
  const budgetId = z.string().min(1).parse(req.params.id);
  const detail = await getBudgetDetail(requireUserId(req.auth?.userId), budgetId);
  sendSuccess(res, detail);
});

export const getBudgetSettlementById = asyncHandler(async (req, res) => {
  const budgetId = z.string().min(1).parse(req.params.id);
  const settlement = await getBudgetSettlement(requireUserId(req.auth?.userId), budgetId);
  sendSuccess(res, settlement);
});

export const generateBudgetInvite = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId);
  const budgetId = z.string().min(1).parse(req.params.id);
  const { role } = z
    .object({ role: z.enum(['viewer', 'editor']).default('editor') })
    .parse(req.body ?? {});

  const status = await getEntitlementStatus(clerkUserId);
  if (status.tier !== 'premium') {
    throw new AppError('PAYMENT_REQUIRED', 'Only Premium users can share budgets.', 402);
  }

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found.', 404);

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId: user.id },
  });

  if (!budget) {
    throw new AppError('NOT_FOUND', 'Budget not found or you do not own it.', 404);
  }

  const inviteToken = createInviteToken({
    resourceType: 'budget',
    resourceId: budgetId,
    role,
  });

  sendSuccess(res, {
    inviteToken,
    url: `https://traveling.app/invite/budget?token=${encodeURIComponent(inviteToken)}`,
  });
});

export const acceptBudgetInvite = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId);
  const { token } = z.object({ token: z.string().trim().min(1).max(2048) }).parse(req.body);
  const invite = verifyInviteToken(token, 'budget');
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found.', 404);

  const budget = await prisma.budget.findUnique({
    where: { id: invite.resourceId },
    select: { id: true, userId: true },
  });
  if (!budget) {
    throw new AppError('BUDGET_NOT_FOUND', 'Budget could not be found.', 404);
  }

  if (budget.userId === user.id) {
    sendSuccess(res, { success: true, budgetId: budget.id });
    return;
  }

  await prisma.sharedBudget.upsert({
    where: { budgetId_userId: { budgetId: budget.id, userId: user.id } },
    update: { role: invite.role },
    create: { budgetId: budget.id, userId: user.id, role: invite.role },
  });

  sendSuccess(res, { success: true, budgetId: budget.id });
});
