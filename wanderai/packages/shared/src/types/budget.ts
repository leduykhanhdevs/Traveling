export type BudgetCategory = 'Food' | 'Transport' | 'Accommodation' | 'Activities' | 'Other';

export type BudgetItem = {
  id: string;
  budgetId: string;
  category: BudgetCategory;
  amount: number;
  description: string;
  date: string;
};

export type BudgetWithItems = {
  id: string;
  userId: string;
  tripName: string;
  totalBudget: number;
  currency: string;
  createdAt: string;
  items: readonly BudgetItem[];
};

export type CreateBudgetInput = {
  tripName: string;
  totalBudget: number;
  currency: string;
};

export type CreateBudgetItemInput = {
  category: BudgetCategory;
  amount: number;
  description: string;
  date: string;
};
