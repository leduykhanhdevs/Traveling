export const metersToDisplay = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

export const priceLevelToDisplay = (priceLevel?: number): string => {
  if (priceLevel === undefined || priceLevel === 0) {
    return 'Free';
  }
  return '$'.repeat(priceLevel);
};

export const compactNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
};
