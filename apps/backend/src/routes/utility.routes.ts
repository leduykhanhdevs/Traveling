import { Router } from 'express';
import {
  getCurrency,
  getCurrencyConversion,
  getEmergencyContacts,
  getPersonalEmergencyContacts,
  getWeatherByCity,
  postDeviceToken,
  postPersonalEmergencyContact,
  postPushNotification,
  postSOS,
} from '../controllers/utility.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const utilityRouter = Router();

utilityRouter.get('/currency', getCurrency);
utilityRouter.get('/currency/convert', getCurrencyConversion);
utilityRouter.get('/weather', getWeatherByCity);
utilityRouter.get('/emergency-contacts', getEmergencyContacts);
utilityRouter.get('/emergency-contacts/personal', requireAuth, getPersonalEmergencyContacts);
utilityRouter.post('/emergency-contacts/personal', requireAuth, postPersonalEmergencyContact);
utilityRouter.post('/sos', requireAuth, postSOS);
utilityRouter.post('/device-token', requireAuth, postDeviceToken);
utilityRouter.post('/push/send', requireAuth, postPushNotification);
