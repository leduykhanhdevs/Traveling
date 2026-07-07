import type { LanguageCode } from '../constants/languages.js';

export type DietaryRestriction =
  | 'halal'
  | 'vegan'
  | 'vegetarian'
  | 'gluten-free'
  | 'keto'
  | 'kosher'
  | 'nut-free'
  | 'dairy-free'
  | 'shellfish-free';

export type TravelStyle = 'local' | 'family' | 'adventure' | 'luxury' | 'budget' | 'culture';

export type PersonalizationProfile = {
  preferredLanguage: LanguageCode;
  dietaryRestrictions: readonly DietaryRestriction[];
  travelStyle: TravelStyle;
  spicyPreference: number; // 1-5
  sweetPreference: number; // 1-5
  savoryPreference: number; // 1-5
  appLocale?: string | null;
};

export type SubscriptionTier = 'free' | 'premium';

export type WanderUser = {
  id: string;
  clerkId: string;
  email: string;
  profile: PersonalizationProfile;
  subscriptionTier: SubscriptionTier;
};
