jest.mock('../services/utility.service.js', () => ({
  createPersonalEmergencyContact: jest.fn(),
  getCurrencyRates: jest.fn(),
  getEmergencyNumbersForLocation: jest.fn(),
  getWeather: jest.fn(),
  listPersonalEmergencyContacts: jest.fn(),
  registerDeviceToken: jest.fn(),
  sendPushNotification: jest.fn(),
  sendSOSAlert: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import {
  getCurrency,
  getEmergencyContacts,
  getPersonalEmergencyContacts,
  getWeatherByCity,
  postDeviceToken,
  postPersonalEmergencyContact,
  postPushNotification,
  postSOS,
} from '../controllers/utility.controller.js';
import {
  createPersonalEmergencyContact,
  getCurrencyRates,
  getEmergencyNumbersForLocation,
  getWeather,
  listPersonalEmergencyContacts,
  registerDeviceToken,
  sendPushNotification,
  sendSOSAlert,
} from '../services/utility.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

describe('utility.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns uppercase currency rates', async () => {
      const rates = {
        base: 'USD',
        rates: {
          VND: 25000,
        },
      };
      const getCurrencyRatesMock = jest.mocked(getCurrencyRates);
      getCurrencyRatesMock.mockResolvedValue(rates);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/currency',
          handlers: [authenticated('clerk_user_1'), getCurrency],
        },
      ]);

      const response = await request(app).get('/currency').query({ base: 'usd' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: rates });
      expect(getCurrencyRatesMock).toHaveBeenCalledWith('USD');
    });

    it('returns emergency numbers for coordinates', async () => {
      const emergencyNumbers = {
        police: '113',
        ambulance: '115',
        fire: '114',
        country: 'Vietnam',
      };
      const getEmergencyNumbersForLocationMock = jest.mocked(getEmergencyNumbersForLocation);
      getEmergencyNumbersForLocationMock.mockResolvedValue(emergencyNumbers);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/emergency-contacts',
          handlers: [getEmergencyContacts],
        },
      ]);

      const response = await request(app)
        .get('/emergency-contacts')
        .query({ lat: '10.76', lng: '106.66' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: emergencyNumbers });
      expect(getEmergencyNumbersForLocationMock).toHaveBeenCalledWith(10.76, 106.66);
    });

    it('lists personal emergency contacts for the authenticated user', async () => {
      const contacts = [
        {
          id: 'contact_1',
          name: 'Test Contact',
          phone: '+15551234567',
          relationship: 'Friend',
        },
      ];
      const listPersonalEmergencyContactsMock = jest.mocked(listPersonalEmergencyContacts);
      listPersonalEmergencyContactsMock.mockResolvedValue(contacts);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/emergency-contacts/personal',
          handlers: [authenticated('clerk_user_1'), getPersonalEmergencyContacts],
        },
      ]);

      const response = await request(app).get('/emergency-contacts/personal');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { contacts } });
      expect(listPersonalEmergencyContactsMock).toHaveBeenCalledWith('clerk_user_1');
    });

    it('creates a personal emergency contact', async () => {
      const contact = {
        id: 'contact_1',
        name: 'Test Contact',
        phone: '+15551234567',
        relationship: 'Friend',
      };
      const createPersonalEmergencyContactMock = jest.mocked(createPersonalEmergencyContact);
      createPersonalEmergencyContactMock.mockResolvedValue(contact);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/emergency-contacts/personal',
          handlers: [authenticated('clerk_user_1'), postPersonalEmergencyContact],
        },
      ]);

      const response = await request(app).post('/emergency-contacts/personal').send({
        name: 'Test Contact',
        phone: '+15551234567',
        relationship: 'Friend',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, data: contact });
      expect(createPersonalEmergencyContactMock).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_1',
        name: 'Test Contact',
        phone: '+15551234567',
        relationship: 'Friend',
      });
    });

    it('sends an SOS alert for the authenticated user', async () => {
      const confirmation = {
        sent: true,
        recipients: [
          {
            id: 'contact_1',
            name: 'Test Contact',
            phone: '+15551234567',
            relationship: 'Friend',
          },
        ],
        message: '[WIRE_UP_TWILIO_LATER] SOS logged.',
        location: {
          lat: 10.76,
          lng: 106.66,
        },
        dispatchedAt: '2026-05-30T00:00:00.000Z',
      };
      const sendSOSAlertMock = jest.mocked(sendSOSAlert);
      sendSOSAlertMock.mockResolvedValue(confirmation);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/sos',
          handlers: [authenticated('clerk_user_1'), postSOS],
        },
      ]);

      const response = await request(app).post('/sos').send({
        lat: 10.76,
        lng: 106.66,
        message: 'Need help',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: confirmation });
      expect(sendSOSAlertMock).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_1',
        lat: 10.76,
        lng: 106.66,
        message: 'Need help',
      });
    });

    it('registers a device token for push notifications', async () => {
      const registration = {
        id: 'device_1',
        token: 'ExponentPushToken[test]',
        platform: 'ios',
      };
      const registerDeviceTokenMock = jest.mocked(registerDeviceToken);
      registerDeviceTokenMock.mockResolvedValue(registration);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/device-token',
          handlers: [authenticated('clerk_user_1'), postDeviceToken],
        },
      ]);

      const response = await request(app).post('/device-token').send({
        token: 'ExponentPushToken[test]',
        platform: 'ios',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: registration });
      expect(registerDeviceTokenMock).toHaveBeenCalledWith({
        clerkUserId: 'clerk_user_1',
        token: 'ExponentPushToken[test]',
        platform: 'ios',
      });
    });

    it('sends a push notification to a target user', async () => {
      const result = {
        sent: 1,
        tickets: [{ status: 'ok' as const, id: 'ticket_1' }],
      };
      const sendPushNotificationMock = jest.mocked(sendPushNotification);
      sendPushNotificationMock.mockResolvedValue(result);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/push/send',
          handlers: [authenticated('admin_user'), postPushNotification],
        },
      ]);

      const response = await request(app).post('/push/send').send({
        userId: 'clerk_user_2',
        title: 'Trip reminder',
        body: 'Leave for the museum soon.',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: result });
      expect(sendPushNotificationMock).toHaveBeenCalledWith(
        'clerk_user_2',
        'Trip reminder',
        'Leave for the museum soon.',
      );
    });
  });

  describe('4xx error', () => {
    it('returns validation error for invalid weather city', async () => {
      const getWeatherMock = jest.mocked(getWeather);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/weather',
          handlers: [authenticated('clerk_user_1'), getWeatherByCity],
        },
      ]);

      const response = await request(app).get('/weather').query({ city: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(getWeatherMock).not.toHaveBeenCalled();
    });

    it('returns validation error for invalid emergency coordinates', async () => {
      const getEmergencyNumbersForLocationMock = jest.mocked(getEmergencyNumbersForLocation);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/emergency-contacts',
          handlers: [getEmergencyContacts],
        },
      ]);

      const response = await request(app)
        .get('/emergency-contacts')
        .query({ lat: '999', lng: '106.66' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(getEmergencyNumbersForLocationMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected utility route has no user', async () => {
      const getCurrencyRatesMock = jest.mocked(getCurrencyRates);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/currency',
          handlers: [requireAuthForTest, getCurrency],
        },
      ]);

      const response = await request(app).get('/currency').query({ base: 'USD' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(getCurrencyRatesMock).not.toHaveBeenCalled();
    });

    it('rejects SOS alerts without auth context', async () => {
      const sendSOSAlertMock = jest.mocked(sendSOSAlert);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/sos',
          handlers: [postSOS],
        },
      ]);

      const response = await request(app).post('/sos').send({
        lat: 10.76,
        lng: 106.66,
        message: 'Need help',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(sendSOSAlertMock).not.toHaveBeenCalled();
    });
  });
});
