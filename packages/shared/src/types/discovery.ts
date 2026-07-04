export type QueryType = 'food' | 'place' | 'experience';

export type PriceRange = 0 | 1 | 2 | 3 | 4;

export type DiscoveryFilters = {
  radiusMeters: number;
  priceRange: readonly PriceRange[];
  dietaryRestrictions: readonly string[];
  openNow: boolean;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type ScoreBreakdown = {
  googleRatingScore: number;
  reviewVolumeScore: number;
  socialProofScore: number;
  compositeScore: number;
};

export type ReviewSignal = {
  source: 'google' | 'facebook' | 'tiktok';
  rating?: number;
  reviewCount?: number;
  snippet?: string;
  engagementCount?: number;
  url?: string;
};

export type RankedPlace = {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  distanceMeters: number;
  priceLevel?: PriceRange;
  cuisineTags: readonly string[];
  photoUrl?: string;
  openNow?: boolean;
  topReviewSnippet?: string;
  score: ScoreBreakdown;
  reviewSignals: readonly ReviewSignal[];
  aiSummary: string;
};

export type DiscoverRequest = {
  query: string;
  lat: number;
  lng: number;
  filters: DiscoveryFilters;
  userId?: string;
  surpriseMe?: boolean;
};

export type DiscoverResponse = {
  queryType: QueryType;
  detectedLanguage: string;
  normalizedQuery: string;
  radiusUsedMeters: number;
  places: readonly RankedPlace[];
};
