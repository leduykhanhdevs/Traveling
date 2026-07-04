import { z } from 'zod';
import {
  convertCurrency,
  createPersonalEmergencyContact,
  getCurrencyRates,
  getEmergencyNumbersForLocation,
  getWeather,
  listPersonalEmergencyContacts,
  registerDeviceToken,
  sendSOSAlert,
  sendPushNotification,
} from '../services/utility.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/http-response.js';

const deviceTokenSchema = z.object({
  token: z.string().trim().min(1),
  platform: z.enum(['ios', 'android']),
});

const pushNotificationSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(512),
});

const coordinatesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const currencyConvertSchema = z.object({
  from: z.string().trim().length(3),
  to: z.string().trim().length(3),
  amount: z.coerce.number().positive().max(1_000_000_000),
});

const sosSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  message: z.string().trim().min(1).max(300),
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(32),
  relationship: z.string().trim().min(1).max(80),
});

const requireUserId = (userId: string | undefined, message: string): string => {
  if (!userId) {
    throw new AppError('UNAUTHORIZED', message, 401);
  }

  return userId;
};

export const getCurrency = asyncHandler(async (req, res) => {
  const base = z.string().min(3).max(3).default('USD').parse(req.query.base);
  const data = await getCurrencyRates(base.toUpperCase());
  sendSuccess(res, data);
});

export const getCurrencyConversion = asyncHandler(async (req, res) => {
  const query = currencyConvertSchema.parse(req.query);
  const data = await convertCurrency(query.from.toUpperCase(), query.to.toUpperCase(), query.amount);
  sendSuccess(res, data);
});

export const getWeatherByCity = asyncHandler(async (req, res) => {
  const city = z.string().min(2).max(120).parse(req.query.city);
  const data = await getWeather(city);
  sendSuccess(res, data);
});

export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const query = coordinatesQuerySchema.parse(req.query);
  const data = await getEmergencyNumbersForLocation(query.lat, query.lng);
  sendSuccess(res, data);
});

export const getPersonalEmergencyContacts = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(
    req.auth?.userId,
    'Sign in to view personal emergency contacts.',
  );
  const contacts = await listPersonalEmergencyContacts(clerkUserId);
  sendSuccess(res, { contacts });
});

export const postPersonalEmergencyContact = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to add emergency contacts.');
  const body = emergencyContactSchema.parse(req.body);
  const contact = await createPersonalEmergencyContact({
    clerkUserId,
    name: body.name,
    phone: body.phone,
    relationship: body.relationship,
  });
  sendSuccess(res, contact, 201);
});

export const postSOS = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to send SOS alerts.');
  const body = sosSchema.parse(req.body);
  const data = await sendSOSAlert({
    clerkUserId,
    lat: body.lat,
    lng: body.lng,
    message: body.message,
  });
  sendSuccess(res, data);
});

export const postDeviceToken = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to register this device.');
  const body = deviceTokenSchema.parse(req.body);
  const data = await registerDeviceToken({
    clerkUserId,
    token: body.token,
    platform: body.platform,
  });
  sendSuccess(res, data);
});

export const postPushNotification = asyncHandler(async (req, res) => {
  requireUserId(req.auth?.userId, 'Sign in to send push notifications.');
  const body = pushNotificationSchema.parse(req.body);
  const data = await sendPushNotification(body.userId, body.title, body.body);
  sendSuccess(res, data);
});
