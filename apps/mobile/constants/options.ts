import type { DietaryRestriction, TravelStyle } from '@traveling/shared';

export const dietaryOptions: readonly { label: string; value: DietaryRestriction }[] = [
  { label: 'Halal', value: 'halal' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Gluten-free', value: 'gluten-free' },
  { label: 'Keto', value: 'keto' },
  { label: 'Kosher', value: 'kosher' },
  { label: 'Nut-free', value: 'nut-free' },
  { label: 'Dairy-free', value: 'dairy-free' },
  { label: 'Shellfish-free', value: 'shellfish-free' },
];

export const travelStyles: readonly { label: string; value: TravelStyle }[] = [
  { label: 'Local', value: 'local' },
  { label: 'Family', value: 'family' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Budget', value: 'budget' },
  { label: 'Culture', value: 'culture' },
];

export const queryTypes = ['What to eat', 'Where to go', 'What to do'] as const;
