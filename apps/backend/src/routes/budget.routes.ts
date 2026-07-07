import { Router } from 'express';
import {
  deleteBudgetItemById,
  getBudgets,
  postBudget,
  postBudgetItem,
  generateBudgetInvite,
  acceptBudgetInvite,
} from '../controllers/budget.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const budgetRouter = Router();

budgetRouter.use(requireAuth);
budgetRouter.get('/', getBudgets);
budgetRouter.post('/', postBudget);
budgetRouter.post('/:id/items', postBudgetItem);
budgetRouter.delete('/:id/items/:itemId', deleteBudgetItemById);
budgetRouter.post('/:id/share', generateBudgetInvite);
budgetRouter.post('/accept-invite', acceptBudgetInvite);
