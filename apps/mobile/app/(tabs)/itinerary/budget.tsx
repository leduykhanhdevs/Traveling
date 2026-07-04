import { useAuth } from '@clerk/clerk-expo';
import type { BudgetCategory, BudgetWithItems, CreateBudgetItemInput } from '@traveling/shared';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScoreBreakdown } from '../../../components/ScoreBreakdown';
import { TextField } from '../../../components/TextField';
import { theme } from '../../../constants/theme';
import {
  useAddBudgetItemMutation,
  useBudgets,
  useCreateBudgetMutation,
  useDeleteBudgetItemMutation,
} from '../../../services/budget';

const categories: readonly BudgetCategory[] = [
  'Food',
  'Transport',
  'Accommodation',
  'Activities',
  'Other',
];

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

const currencyAmount = (amount: number, currency: string): string =>
  (() => {
    try {
      return new Intl.NumberFormat(undefined, {
        currency,
        maximumFractionDigits: 0,
        style: 'currency',
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(0)}`;
    }
  })();

const parseAmount = (value: string): number => {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

const categoryTotalsFor = (
  budget: BudgetWithItems | null,
): Record<BudgetCategory, number> =>
  categories.reduce(
    (totals, category) => ({
      ...totals,
      [category]:
        budget?.items
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + item.amount, 0) ?? 0,
    }),
    {
      Food: 0,
      Transport: 0,
      Accommodation: 0,
      Activities: 0,
      Other: 0,
    },
  );

export default function BudgetScreen(): JSX.Element {
  const { getToken, userId } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [tripName, setTripName] = useState('Vietnam trip');
  const [totalBudget, setTotalBudget] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState<BudgetCategory>('Food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIsoDate());

  useEffect(() => {
    let mounted = true;

    getToken()
      .then((nextToken) => {
        if (mounted) {
          setToken(nextToken);
        }
      })
      .catch(() => {
        if (mounted) {
          setToken(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [getToken]);

  const budgetsQuery = useBudgets(userId, token);
  const createBudgetMutation = useCreateBudgetMutation(userId, token);
  const addItemMutation = useAddBudgetItemMutation(userId, token);
  const deleteItemMutation = useDeleteBudgetItemMutation(userId, token);
  const budgets = useMemo(() => budgetsQuery.data?.budgets ?? [], [budgetsQuery.data?.budgets]);

  useEffect(() => {
    if (!selectedBudgetId && budgets[0]) {
      setSelectedBudgetId(budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  const selectedBudget = useMemo(
    () => budgets.find((budget) => budget.id === selectedBudgetId) ?? budgets[0] ?? null,
    [budgets, selectedBudgetId],
  );
  const spent = useMemo(
    () => selectedBudget?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [selectedBudget],
  );
  const remaining = (selectedBudget?.totalBudget ?? 0) - spent;
  const categoryTotals = useMemo(() => categoryTotalsFor(selectedBudget), [selectedBudget]);
  const largestTotal = Math.max(1, ...categories.map((nextCategory) => categoryTotals[nextCategory]));
  const score = {
    compositeScore: Math.min(100, Math.round((spent / Math.max(1, selectedBudget?.totalBudget ?? 1)) * 100)),
    googleRatingScore: Math.round((categoryTotals.Food / largestTotal) * 100),
    reviewVolumeScore: Math.round((categoryTotals.Transport / largestTotal) * 100),
    socialProofScore: Math.round((categoryTotals.Accommodation / largestTotal) * 100),
  };

  const submitBudget = (): void => {
    createBudgetMutation.mutate(
      {
        currency: currency.trim().toUpperCase(),
        totalBudget: parseAmount(totalBudget),
        tripName: tripName.trim(),
      },
      {
        onSuccess: (budget) => {
          setSelectedBudgetId(budget.id);
        },
      },
    );
  };

  const submitItem = (): void => {
    if (!selectedBudget) {
      return;
    }

    const item: CreateBudgetItemInput = {
      amount: parseAmount(amount),
      category,
      date: new Date(`${date}T00:00:00.000Z`).toISOString(),
      description: description.trim(),
    };
    addItemMutation.mutate(
      {
        budgetId: selectedBudget.id,
        item,
      },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setDate(todayIsoDate());
        },
      },
    );
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20, paddingBottom: 140 }}>
        <View>
          <Text className="font-inter-bold text-4xl text-white">Budget</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            Plan trip spend, add expenses, and track remaining budget.
          </Text>
        </View>

        <GlassCard>
          <View className="gap-3">
            <Text className="font-inter-semibold text-lg text-white">Create trip budget</Text>
            <TextField value={tripName} onChangeText={setTripName} placeholder="Trip name" />
            <View className="flex-row gap-3">
              <TextField
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="decimal-pad"
                placeholder="Total budget"
                className="flex-1"
              />
              <TextField
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                maxLength={3}
                placeholder="USD"
                className="w-24"
              />
            </View>
            <PrimaryButton
              label="Create budget"
              loading={createBudgetMutation.isPending}
              disabled={!token || tripName.trim().length === 0 || parseAmount(totalBudget) <= 0}
              accessibilityHint="Creates a new trip budget."
              onPress={submitBudget}
            />
          </View>
        </GlassCard>

        {budgets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {budgets.map((budget) => (
                <TouchableOpacity
                  key={budget.id}
                  accessibilityHint={`Selects the ${budget.tripName} budget.`}
                  accessibilityLabel={`${budget.tripName} budget`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedBudget?.id === budget.id }}
                  className={`rounded-lg px-4 py-3 ${
                    selectedBudget?.id === budget.id ? 'bg-primary' : 'bg-white/10'
                  }`}
                  onPress={() => setSelectedBudgetId(budget.id)}
                >
                  <Text className="font-inter-semibold text-white">{budget.tripName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {selectedBudget ? (
          <>
            <GlassCard>
              <View className="gap-4">
                <View className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-inter text-xs text-zinc-400">Total</Text>
                    <Text className="mt-1 font-inter-bold text-xl text-white">
                      {currencyAmount(selectedBudget.totalBudget, selectedBudget.currency)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-inter text-xs text-zinc-400">Spent</Text>
                    <Text className="mt-1 font-inter-bold text-xl text-white">
                      {currencyAmount(spent, selectedBudget.currency)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-inter text-xs text-zinc-400">Remaining</Text>
                    <Text
                      className={`mt-1 font-inter-bold text-xl ${
                        remaining >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {currencyAmount(remaining, selectedBudget.currency)}
                    </Text>
                  </View>
                </View>
                <ScoreBreakdown score={score} />
                <View className="gap-2">
                  {categories.map((nextCategory) => (
                    <View key={nextCategory} className="gap-1">
                      <View className="flex-row justify-between">
                        <Text className="font-inter text-xs text-zinc-300">{nextCategory}</Text>
                        <Text className="font-inter-semibold text-xs text-white">
                          {currencyAmount(categoryTotals[nextCategory], selectedBudget.currency)}
                        </Text>
                      </View>
                      <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <View
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.round(
                              (categoryTotals[nextCategory] / largestTotal) * 100,
                            )}%`,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <View className="gap-3">
                <Text className="font-inter-semibold text-lg text-white">Add expense</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((nextCategory) => (
                    <TouchableOpacity
                      key={nextCategory}
                      accessibilityHint={`Sets the expense category to ${nextCategory}.`}
                      accessibilityLabel={`${nextCategory} expense category`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === nextCategory }}
                      className={`rounded-lg px-3 py-2 ${
                        category === nextCategory ? 'bg-accent' : 'bg-white/10'
                      }`}
                      onPress={() => setCategory(nextCategory)}
                    >
                      <Text className="font-inter-semibold text-xs text-white">{nextCategory}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextField
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="Amount"
                />
                <TextField
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                />
                <TextField value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                <PrimaryButton
                  label="Add expense"
                  loading={addItemMutation.isPending}
                  disabled={parseAmount(amount) <= 0 || description.trim().length === 0}
                  accessibilityHint="Adds this expense to the selected budget."
                  onPress={submitItem}
                />
              </View>
            </GlassCard>

            <View className="gap-3">
              {selectedBudget.items.map((item) => (
                <GlassCard key={item.id}>
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-white">{item.description}</Text>
                      <Text className="mt-1 font-inter text-sm text-zinc-300">
                        {item.category} • {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text className="font-inter-bold text-white">
                        {currencyAmount(item.amount, selectedBudget.currency)}
                      </Text>
                      <TouchableOpacity
                        accessibilityHint={`Deletes the ${item.description} expense.`}
                        accessibilityLabel={`Delete ${item.description} expense`}
                        accessibilityRole="button"
                        className="rounded-lg bg-white/10 p-2"
                        onPress={() =>
                          deleteItemMutation.mutate({
                            budgetId: selectedBudget.id,
                            itemId: item.id,
                          })
                        }
                      >
                        <Trash2 color={theme.colors.danger} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        ) : (
          <GlassCard>
            <Text className="font-inter text-sm text-zinc-300">
              Create your first trip budget to start tracking expenses.
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
