export const APP_NAME = 'Traveling';

export const APP_COLORS = {
  primary: '#6C63FF',
  accent: '#FF6584',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  success: '#2DD4BF',
  warning: '#FBBF24',
  danger: '#FB7185',
  text: '#F8FAFC',
  muted: '#A1A1AA',
} as const;

export const QUERY_TIERS = {
  freeAiQueriesPerDay: 20,
  freeTranslationsPerDay: 50,
} as const;

export const CACHE_TTL_SECONDS = {
  googlePlaces: 60 * 60 * 6,
  compositeScores: 60 * 60 * 2,
  translations: 60 * 60 * 24,
} as const;
