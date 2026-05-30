import type {
  BudgetCategory,
  BudgetWithItems,
  CreateBudgetInput,
  CreateBudgetItemInput,
} from '@wanderai/shared';
import { AppError } from '../utils/errors.js';
import { prisma } from './prisma.service.js';

type BudgetRecord = {
  id: string;
  userId: string;
  tripName: string;
  totalBudget: number;
  currency: string;
  createdAt: Date;
  items: readonly {
    id: string;
    budgetId: string;
    category: string;
    amount: number;
    description: string;
    date: Date;
  }[];
};

const toBudgetWithItems = (budget: BudgetRecord): BudgetWithItems => ({
  id: budget.id,
  userId: budget.userId,
  tripName: budget.tripName,
  totalBudget: budget.totalBudget,
  currency: budget.currency,
  createdAt: budget.createdAt.toISOString(),
  items: budget.items.map((item) => ({
    id: item.id,
    budgetId: item.budgetId,
    category: item.category as BudgetCategory,
    amount: item.amount,
    description: item.description,
    date: item.date.toISOString(),
  })),
});

const getUserIdByClerkId = async (clerkUserId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: clerkUserId,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a WanderAI profile before managing budgets.', 404);
  }

  return user.id;
};

const getOwnedBudget = async (budgetId: string, userId: string): Promise<BudgetRecord> => {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
    include: {
      items: {
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  if (!budget) {
    throw new AppError('BUDGET_NOT_FOUND', 'Budget could not be found.', 404);
  }

  return budget;
};

export const listBudgets = async (clerkUserId: string): Promise<readonly BudgetWithItems[]> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
    },
    include: {
      items: {
        orderBy: {
          date: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return budgets.map(toBudgetWithItems);
};

export const createBudget = async (
  clerkUserId: string,
  input: CreateBudgetInput,
): Promise<BudgetWithItems> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budget = await prisma.budget.create({
    data: {
      userId,
      tripName: input.tripName,
      totalBudget: input.totalBudget,
      currency: input.currency,
    },
    include: {
      items: true,
    },
  });

  return toBudgetWithItems(budget);
};

export const createBudgetItem = async (
  clerkUserId: string,
  budgetId: string,
  input: CreateBudgetItemInput,
): Promise<BudgetWithItems> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  await getOwnedBudget(budgetId, userId);
  await prisma.budgetItem.create({
    data: {
      budgetId,
      category: input.category,
      amount: input.amount,
      description: input.description,
      date: new Date(input.date),
    },
  });

  return getOwnedBudget(budgetId, userId).then(toBudgetWithItems);
};

export const deleteBudgetItem = async (
  clerkUserId: string,
  budgetId: string,
  itemId: string,
): Promise<BudgetWithItems> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  await getOwnedBudget(budgetId, userId);
  const result = await prisma.budgetItem.deleteMany({
    where: {
      id: itemId,
      budgetId,
    },
  });

  if (result.count === 0) {
    throw new AppError('BUDGET_ITEM_NOT_FOUND', 'Budget item could not be found.', 404);
  }

  return getOwnedBudget(budgetId, userId).then(toBudgetWithItems);
};
