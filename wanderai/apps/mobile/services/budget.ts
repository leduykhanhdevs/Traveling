import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BudgetWithItems,
  CreateBudgetInput,
  CreateBudgetItemInput,
} from '@wanderai/shared';
import { apiRequest } from './api';

export const getBudgets = (
  token?: string | null,
): Promise<{ budgets: readonly BudgetWithItems[] }> => apiRequest('/api/v1/budget', { token });

export const createBudget = (
  budget: CreateBudgetInput,
  token?: string | null,
): Promise<BudgetWithItems> =>
  apiRequest('/api/v1/budget', {
    method: 'POST',
    body: budget,
    token,
  });

export const addBudgetItem = (
  budgetId: string,
  item: CreateBudgetItemInput,
  token?: string | null,
): Promise<BudgetWithItems> =>
  apiRequest(`/api/v1/budget/${encodeURIComponent(budgetId)}/items`, {
    method: 'POST',
    body: item,
    token,
  });

export const deleteBudgetItem = (
  budgetId: string,
  itemId: string,
  token?: string | null,
): Promise<BudgetWithItems> =>
  apiRequest(
    `/api/v1/budget/${encodeURIComponent(budgetId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
      token,
    },
  );

export const budgetQueryKey = (userId: string | null | undefined) =>
  ['budget', userId ?? 'anonymous'] as const;

export const useBudgets = (userId: string | null | undefined, token?: string | null) =>
  useQuery({
    enabled: Boolean(token),
    queryFn: () => getBudgets(token),
    queryKey: budgetQueryKey(userId),
    staleTime: 1000 * 60 * 10,
  });

export const useCreateBudgetMutation = (userId: string | null | undefined, token?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budget: CreateBudgetInput) => createBudget(budget, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetQueryKey(userId) });
    },
  });
};

export const useAddBudgetItemMutation = (
  userId: string | null | undefined,
  token?: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, item }: { budgetId: string; item: CreateBudgetItemInput }) =>
      addBudgetItem(budgetId, item, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetQueryKey(userId) });
    },
  });
};

export const useDeleteBudgetItemMutation = (
  userId: string | null | undefined,
  token?: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, itemId }: { budgetId: string; itemId: string }) =>
      deleteBudgetItem(budgetId, itemId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetQueryKey(userId) });
    },
  });
};
