import { Router } from 'express';
import {
  deleteBudgetItemById,
  getBudgetDetailById,
  getBudgets,
  getBudgetSettlementById,
  getSharedBudgets,
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
budgetRouter.get('/shared', getSharedBudgets);
budgetRouter.get('/:id', getBudgetDetailById);
budgetRouter.get('/:id/settlement', getBudgetSettlementById);
budgetRouter.post('/:id/items', postBudgetItem);
budgetRouter.delete('/:id/items/:itemId', deleteBudgetItemById);
budgetRouter.post('/:id/share', generateBudgetInvite);
budgetRouter.post('/accept-invite', acceptBudgetInvite);
