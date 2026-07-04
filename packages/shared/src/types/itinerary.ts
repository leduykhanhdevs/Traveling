import type { RankedPlace } from './discovery.js';

export type BudgetRange = 'budget' | 'midrange' | 'premium';

export type ItinerarySlot = {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  estimatedSpend: number;
  place?: RankedPlace;
};

export type ItineraryDay = {
  day: number;
  title: string;
  slots: readonly ItinerarySlot[];
  totalEstimatedSpend: number;
};

export type ItineraryPlan = {
  id: string;
  destination: string;
  days: readonly ItineraryDay[];
  budgetRange: BudgetRange;
  totalEstimatedSpend: number;
};

export type ItineraryRequest = {
  destination: string;
  days: number;
  budgetRange: BudgetRange;
  travelStyle: string;
  userId?: string;
};
