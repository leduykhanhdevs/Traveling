import type {
  BudgetCategory,
  BudgetWithItems,
  CreateBudgetInput,
  CreateBudgetItemInput,
} from '@traveling/shared';
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
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before managing budgets.', 404);
  }

  return user.id;
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

export type BudgetSplitInput =
  | { type: 'equal'; participantIds: readonly string[] }
  | { type: 'custom'; shares: readonly { userId: string; amount: number }[] };

export type CreateBudgetItemWithSplitInput = CreateBudgetItemInput & {
  paidById?: string;
  split?: BudgetSplitInput;
};

const getAccessibleBudget = async (
  budgetId: string,
  userId: string,
  requireEditor: boolean,
): Promise<BudgetRecord & { userId: string }> => {
  const roleFilter = requireEditor ? ['editor'] : ['editor', 'viewer'];
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      OR: [
        { userId },
        { sharedUsers: { some: { userId, role: { in: roleFilter } } } },
      ],
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

const listBudgetMemberIds = async (budget: { id: string; userId: string }): Promise<Set<string>> => {
  const shared = await prisma.sharedBudget.findMany({
    where: { budgetId: budget.id },
  });
  return new Set<string>([budget.userId, ...shared.map((entry) => entry.userId)]);
};

const buildSplitShares = (
  split: BudgetSplitInput,
  amount: number,
): readonly { userId: string; amount: number }[] => {
  if (split.type === 'custom') {
    const participantIds = split.shares.map((share) => share.userId);
    if (new Set(participantIds).size !== participantIds.length) {
      throw new AppError('INVALID_SPLIT', 'Each split participant must be unique.', 400);
    }

    const total = split.shares.reduce((sum, share) => sum + share.amount, 0);
    if (Math.abs(total - amount) > 0.01) {
      throw new AppError(
        'INVALID_SPLIT',
        `Split amounts (${total.toFixed(2)}) must add up to the item amount (${amount.toFixed(2)}).`,
        400,
      );
    }
    return split.shares.map((share) => ({ userId: share.userId, amount: share.amount }));
  }

  const ids = [...new Set(split.participantIds)];
  const base = Math.floor((amount / ids.length) * 100) / 100;
  return ids.map((participantId, index) => ({
    userId: participantId,
    // The last participant absorbs the rounding remainder so shares always sum to the amount.
    amount: index === ids.length - 1 ? Math.round((amount - base * (ids.length - 1)) * 100) / 100 : base,
  }));
};

export const createBudgetItem = async (
  clerkUserId: string,
  budgetId: string,
  input: CreateBudgetItemWithSplitInput,
): Promise<BudgetWithItems> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budget = await getAccessibleBudget(budgetId, userId, true);

  const paidById = input.paidById ?? userId;
  let shares: readonly { userId: string; amount: number }[] = [];

  if (input.split || input.paidById) {
    const memberIds = await listBudgetMemberIds(budget);

    if (!memberIds.has(paidById)) {
      throw new AppError('INVALID_INPUT', 'The payer must be a participant of this budget.', 400);
    }

    if (input.split) {
      shares = buildSplitShares(input.split, input.amount);
      const invalidShare = shares.find((share) => !memberIds.has(share.userId));
      if (invalidShare) {
        throw new AppError(
          'INVALID_INPUT',
          'Every split participant must be a member of this budget.',
          400,
        );
      }
    }
  }

  if (shares.length > 0) {
    await prisma.$transaction(async (tx) => {
      const item = await tx.budgetItem.create({
        data: {
          budgetId,
          category: input.category,
          amount: input.amount,
          description: input.description,
          date: new Date(input.date),
          paidById,
        },
      });
      await tx.budgetItemSplit.createMany({
        data: shares.map((share) => ({
          itemId: item.id,
          userId: share.userId,
          amount: share.amount,
        })),
      });
    });
  } else {
    await prisma.budgetItem.create({
      data: {
        budgetId,
        category: input.category,
        amount: input.amount,
        description: input.description,
        date: new Date(input.date),
        ...(input.paidById ? { paidById } : {}),
      },
    });
  }

  return getAccessibleBudget(budgetId, userId, false).then(toBudgetWithItems);
};

export type BudgetParticipantSummary = {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
};

export type BudgetBalance = {
  userId: string;
  email: string;
  paid: number;
  owed: number;
  net: number;
};

export type SettlementTransfer = {
  fromUserId: string;
  fromEmail: string;
  toUserId: string;
  toEmail: string;
  amount: number;
};

export type BudgetSettlement = {
  budgetId: string;
  currency: string;
  balances: readonly BudgetBalance[];
  transfers: readonly SettlementTransfer[];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const listBudgetParticipants = async (
  clerkUserId: string,
  budgetId: string,
): Promise<readonly BudgetParticipantSummary[]> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budget = await getAccessibleBudget(budgetId, userId, false);

  const [owner, shared] = await Promise.all([
    prisma.user.findUnique({ where: { id: budget.userId } }),
    prisma.sharedBudget.findMany({
      where: { budgetId },
      include: { user: true },
    }),
  ]);

  const participants: BudgetParticipantSummary[] = [];
  if (owner) {
    participants.push({ userId: owner.id, email: owner.email, role: 'owner' });
  }
  for (const entry of shared) {
    participants.push({
      userId: entry.userId,
      email: entry.user.email,
      role: entry.role === 'editor' ? 'editor' : 'viewer',
    });
  }

  return participants;
};

export const listSharedBudgets = async (clerkUserId: string): Promise<readonly BudgetWithItems[]> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budgets = await prisma.budget.findMany({
    where: {
      sharedUsers: { some: { userId } },
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

export const getBudgetSettlement = async (
  clerkUserId: string,
  budgetId: string,
): Promise<BudgetSettlement> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budget = await getAccessibleBudget(budgetId, userId, false);
  const participants = await listBudgetParticipants(clerkUserId, budgetId);
  const emailById = new Map(participants.map((entry) => [entry.userId, entry.email]));

  const items = await prisma.budgetItem.findMany({
    where: { budgetId },
    include: { splits: true },
  });

  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  const add = (map: Map<string, number>, key: string, value: number): void => {
    map.set(key, (map.get(key) ?? 0) + value);
  };

  for (const item of items) {
    const payer = item.paidById ?? budget.userId;
    add(paid, payer, item.amount);

    if (item.splits.length === 0) {
      // No split recorded: the payer consumed the expense alone (net zero).
      add(owed, payer, item.amount);
      continue;
    }

    for (const split of item.splits) {
      add(owed, split.userId, split.amount);
    }
  }

  const memberIds = new Set<string>([
    ...participants.map((entry) => entry.userId),
    ...paid.keys(),
    ...owed.keys(),
  ]);

  const balances: BudgetBalance[] = [...memberIds].map((memberId) => {
    const paidTotal = round2(paid.get(memberId) ?? 0);
    const owedTotal = round2(owed.get(memberId) ?? 0);
    return {
      userId: memberId,
      email: emailById.get(memberId) ?? 'unknown',
      paid: paidTotal,
      owed: owedTotal,
      net: round2(paidTotal - owedTotal),
    };
  });

  // Greedy min-cash-flow: largest debtor pays largest creditor until settled.
  const creditors = balances
    .filter((balance) => balance.net > 0.005)
    .map((balance) => ({ ...balance }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((balance) => balance.net < -0.005)
    .map((balance) => ({ ...balance }))
    .sort((a, b) => a.net - b.net);

  const transfers: SettlementTransfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]!;
    const debtor = debtors[debtorIndex]!;
    const amount = round2(Math.min(creditor.net, -debtor.net));

    if (amount > 0.005) {
      transfers.push({
        fromUserId: debtor.userId,
        fromEmail: debtor.email,
        toUserId: creditor.userId,
        toEmail: creditor.email,
        amount,
      });
    }

    creditor.net = round2(creditor.net - amount);
    debtor.net = round2(debtor.net + amount);

    if (creditor.net <= 0.005) creditorIndex += 1;
    if (debtor.net >= -0.005) debtorIndex += 1;
  }

  return {
    budgetId,
    currency: budget.currency,
    balances,
    transfers,
  };
};

export const getBudgetDetail = async (
  clerkUserId: string,
  budgetId: string,
): Promise<{ budget: BudgetWithItems; participants: readonly BudgetParticipantSummary[] }> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  const budget = await getAccessibleBudget(budgetId, userId, false);
  const participants = await listBudgetParticipants(clerkUserId, budgetId);
  return { budget: toBudgetWithItems(budget), participants };
};

export const deleteBudgetItem = async (
  clerkUserId: string,
  budgetId: string,
  itemId: string,
): Promise<BudgetWithItems> => {
  const userId = await getUserIdByClerkId(clerkUserId);
  await getAccessibleBudget(budgetId, userId, true);
  const result = await prisma.budgetItem.deleteMany({
    where: {
      id: itemId,
      budgetId,
    },
  });

  if (result.count === 0) {
    throw new AppError('BUDGET_ITEM_NOT_FOUND', 'Budget item could not be found.', 404);
  }

  return getAccessibleBudget(budgetId, userId, false).then(toBudgetWithItems);
};
