import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { fetchJson } from './http-client.js';
import { prisma } from './prisma.service.js';

type ExchangeRateResponse = {
  conversion_rates?: Record<string, number>;
};

type WeatherResponse = {
  name?: string;
  weather?: readonly {
    description?: string;
    icon?: string;
  }[];
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
};

type GoogleGeocodeAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: readonly string[];
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: readonly {
    address_components?: readonly GoogleGeocodeAddressComponent[];
  }[];
};

export type CurrencyRates = {
  base: string;
  rates: Record<string, number>;
};

export type CurrencyConversion = {
  from: string;
  to: string;
  amount: number;
  rate: number;
  convertedAmount: number;
};

export type WeatherSummary = {
  city: string;
  description: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
};

export type RegisterDeviceTokenInput = {
  clerkUserId: string;
  token: string;
  platform: string;
};

export type DeviceTokenRegistration = {
  id: string;
  token: string;
  platform: string;
};

export type EmergencyNumbers = {
  police: string;
  ambulance: string;
  fire: string;
  country: string;
};

export type EmergencyContactSummary = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
};

export type CreateEmergencyContactInput = {
  clerkUserId: string;
  name: string;
  phone: string;
  relationship: string;
};

export type SOSAlertInput = {
  clerkUserId: string;
  lat: number;
  lng: number;
  message: string;
};

export type SOSAlertConfirmation = {
  sent: boolean;
  recipients: Array<EmergencyContactSummary & { status?: 'success' | 'failed' }>;
  message: string;
  location: {
    lat: number;
    lng: number;
  };
  dispatchedAt: string;
};

type ExpoPushTicket =
  | {
      status: 'ok';
      id?: string;
    }
  | {
      status: 'error';
      message: string;
      details?: Record<string, unknown>;
    };

type ExpoPushResponse = {
  data?: readonly ExpoPushTicket[];
};

export type PushNotificationResult = {
  sent: number;
  tickets: readonly ExpoPushTicket[];
};

type CountryMatch = {
  code: string;
  name: string;
};

const euCountryCodes = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

const emergencyNumbersByRegion = {
  VN: {
    police: '113',
    fire: '114',
    ambulance: '115',
  },
  US: {
    police: '911',
    fire: '911',
    ambulance: '911',
  },
  EU: {
    police: '112',
    fire: '112',
    ambulance: '112',
  },
} as const;

const toEmergencyContactSummary = (contact: {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}): EmergencyContactSummary => ({
  id: contact.id,
  name: contact.name,
  phone: contact.phone,
  relationship: contact.relationship,
});

const findUserIdByClerkId = async (clerkUserId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: clerkUserId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before using SOS.', 404);
  }

  return user.id;
};

const inferCountryFromCoordinates = (lat: number, lng: number): CountryMatch | null => {
  if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) {
    return {
      code: 'VN',
      name: 'Vietnam',
    };
  }

  if (lat >= 18 && lat <= 72 && lng >= -170 && lng <= -50) {
    return {
      code: 'US',
      name: 'USA',
    };
  }

  if (lat >= 34 && lat <= 72 && lng >= -25 && lng <= 45) {
    return {
      code: 'EU',
      name: 'European Union',
    };
  }

  return null;
};

const reverseGeocodeCountry = async (lat: number, lng: number): Promise<CountryMatch | null> => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('result_type', 'country');
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
  const data = await fetchJson<GoogleGeocodeResponse>(url, undefined, 'Google Reverse Geocode');

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new AppError('GOOGLE_REVERSE_GEOCODE_ERROR', data.error_message ?? data.status, 502);
  }

  const country = data.results
    ?.flatMap((result) => result.address_components ?? [])
    .find((component) => component.types?.includes('country'));

  if (!country?.short_name) {
    return null;
  }

  return {
    code: country.short_name.toUpperCase(),
    name: country.long_name ?? country.short_name,
  };
};

const numbersForCountry = (country: CountryMatch | null): EmergencyNumbers => {
  if (country?.code === 'VN') {
    return {
      ...emergencyNumbersByRegion.VN,
      country: country.name,
    };
  }

  if (country?.code === 'US') {
    return {
      ...emergencyNumbersByRegion.US,
      country: country.name,
    };
  }

  if (country && euCountryCodes.has(country.code)) {
    return {
      ...emergencyNumbersByRegion.EU,
      country: country.name,
    };
  }

  if (country?.code === 'EU') {
    return {
      ...emergencyNumbersByRegion.EU,
      country: country.name,
    };
  }

  return {
    ...emergencyNumbersByRegion.EU,
    country: country?.name ?? 'Unknown',
  };
};

export const getCurrencyRates = async (base = 'USD'): Promise<CurrencyRates> => {
  const url = `https://v6.exchangerate-api.com/v6/${env.EXCHANGERATE_API_KEY}/latest/${base}`;
  const data = await fetchJson<ExchangeRateResponse>(url, undefined, 'ExchangeRate API');
  return {
    base,
    rates: data.conversion_rates ?? {},
  };
};

export const convertCurrency = async (
  from: string,
  to: string,
  amount: number,
): Promise<CurrencyConversion> => {
  const { rates } = await getCurrencyRates(from);
  const rate = rates[to];
  if (rate === undefined) {
    throw new AppError(
      'CURRENCY_NOT_SUPPORTED',
      `Conversion rate from ${from} to ${to} is unavailable.`,
      404,
    );
  }

  return {
    from,
    to,
    amount,
    rate,
    convertedAmount: Math.round(amount * rate * 100) / 100,
  };
};

export const getWeather = async (city: string): Promise<WeatherSummary> => {
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('q', city);
  url.searchParams.set('appid', env.OPENWEATHER_API_KEY);
  url.searchParams.set('units', 'metric');
  const data = await fetchJson<WeatherResponse>(url, undefined, 'OpenWeatherMap');

  return {
    city: data.name ?? city,
    description: data.weather?.[0]?.description ?? 'Weather unavailable',
    temperatureCelsius: data.main?.temp ?? 0,
    feelsLikeCelsius: data.main?.feels_like ?? 0,
    humidity: data.main?.humidity ?? 0,
  };
};

export const getEmergencyNumbersForLocation = async (
  lat: number,
  lng: number,
): Promise<EmergencyNumbers> => {
  const fallbackCountry = inferCountryFromCoordinates(lat, lng);

  try {
    return numbersForCountry((await reverseGeocodeCountry(lat, lng)) ?? fallbackCountry);
  } catch {
    return numbersForCountry(fallbackCountry);
  }
};

export const listPersonalEmergencyContacts = async (
  clerkUserId: string,
): Promise<readonly EmergencyContactSummary[]> => {
  const userId = await findUserIdByClerkId(clerkUserId);
  const contacts = await prisma.emergencyContact.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return contacts.map(toEmergencyContactSummary);
};

export const createPersonalEmergencyContact = async (
  input: CreateEmergencyContactInput,
): Promise<EmergencyContactSummary> => {
  const userId = await findUserIdByClerkId(input.clerkUserId);
  const contact = await prisma.emergencyContact.create({
    data: {
      userId,
      name: input.name,
      phone: input.phone,
      relationship: input.relationship,
    },
  });

  return toEmergencyContactSummary(contact);
};

import twilio from 'twilio';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendSOSAlert = async (input: SOSAlertInput): Promise<SOSAlertConfirmation> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: input.clerkUserId,
    },
    include: {
      emergencyContacts: true,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before sending SOS.', 404);
  }

  const recipients = user.emergencyContacts.map(toEmergencyContactSummary);
  if (recipients.length === 0) {
    throw new AppError('NO_EMERGENCY_CONTACTS', 'Add an emergency contact before sending SOS.', 404);
  }

  const message = `${input.message} Location: https://maps.google.com/?q=${input.lat},${input.lng}`;
  const dispatchedAt = new Date().toISOString();
  
  const results = await Promise.all(
    recipients.map(async (contact: EmergencyContactSummary) => {
      try {
        await twilioClient.messages.create({
          body: message,
          from: env.TWILIO_FROM_NUMBER,
          to: contact.phone,
        });
        return { ...contact, status: 'success' as const };
      } catch (error) {
        logger.error(`Failed to send SOS SMS to ${contact.phone}`, { error });
        return { ...contact, status: 'failed' as const };
      }
    })
  );

  return {
    sent: true,
    recipients: results,
    message,
    location: {
      lat: input.lat,
      lng: input.lng,
    },
    dispatchedAt,
  };
};

export const registerDeviceToken = async (
  input: RegisterDeviceTokenInput,
): Promise<DeviceTokenRegistration> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: input.clerkUserId,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a Traveling profile before registering devices.', 404);
  }

  const deviceToken = await prisma.deviceToken.upsert({
    where: {
      userId_token: {
        userId: user.id,
        token: input.token,
      },
    },
    update: {
      platform: input.platform,
    },
    create: {
      userId: user.id,
      token: input.token,
      platform: input.platform,
    },
  });

  return {
    id: deviceToken.id,
    token: deviceToken.token,
    platform: deviceToken.platform,
  };
};

export const sendPushNotification = async (
  clerkUserId: string,
  title: string,
  body: string,
): Promise<PushNotificationResult> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: clerkUserId,
    },
    include: {
      deviceTokens: true,
    },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Push notification recipient was not found.', 404);
  }

  if (user.deviceTokens.length === 0) {
    return {
      sent: 0,
      tickets: [],
    };
  }

  const response = await fetchJson<ExpoPushResponse>(
    'https://exp.host/--/api/v2/push/send',
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        user.deviceTokens.map((deviceToken: { token: string }) => ({
          to: deviceToken.token,
          sound: 'default',
          title,
          body,
          data: {
            userId: clerkUserId,
          },
        })),
      ),
    },
    'Expo Push API',
  );
  const tickets = response.data ?? [];

  return {
    sent: tickets.filter((ticket) => ticket.status === 'ok').length,
    tickets,
  };
};
