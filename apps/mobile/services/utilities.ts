import { apiRequest } from './api';

export const getCurrencyRates = (
  base: string,
  token?: string | null,
): Promise<{ base: string; rates: Record<string, number> }> =>
  apiRequest(`/api/v1/utilities/currency?base=${encodeURIComponent(base)}`, { token });

export const getWeather = (
  city: string,
  token?: string | null,
): Promise<{
  city: string;
  description: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
}> => apiRequest(`/api/v1/utilities/weather?city=${encodeURIComponent(city)}`, { token });

export const convertCurrency = (
  params: { from: string; to: string; amount: number },
  token?: string | null,
): Promise<{
  from: string;
  to: string;
  amount: number;
  rate: number;
  convertedAmount: number;
}> => {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    amount: String(params.amount),
  });
  return apiRequest(`/api/v1/utilities/currency/convert?${query.toString()}`, { token });
};
