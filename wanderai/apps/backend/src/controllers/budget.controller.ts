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
