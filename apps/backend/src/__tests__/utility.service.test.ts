import './external-service-mocks.js';
jest.mock('../config/env.js', () => ({
  env: {
    TWILIO_ACCOUNT_SID: 'test_twilio_sid',
    TWILIO_AUTH_TOKEN: 'test_twilio_token',
    TWILIO_FROM_NUMBER: '+15551234567',
  }
}));
import { sendSOSAlert } from '../services/utility.service.js';
import { prisma } from '../services/prisma.service.js';
import twilio from 'twilio';

const mockCreateMessage = jest.fn();

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: (...args: any[]) => mockCreateMessage(...args),
    },
  }));
});

describe('utility.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMessage.mockReset();
  });

  describe('sendSOSAlert', () => {
    it('throws error if user not found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(
        sendSOSAlert({
          clerkUserId: 'nonexistent',
          lat: 10,
          lng: 10,
          message: 'Help',
        })
      ).rejects.toThrow('Create a Traveling profile before sending SOS.');
    });

    it('throws error if user has no emergency contacts', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user_1',
        emergencyContacts: [],
      } as never);

      await expect(
        sendSOSAlert({
          clerkUserId: 'user_1',
          lat: 10,
          lng: 10,
          message: 'Help',
        })
      ).rejects.toThrow('Add an emergency contact before sending SOS.');
    });

    it('sends SMS and returns success status for recipients', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user_1',
        emergencyContacts: [
          { id: '1', name: 'Alice', phone: '+123456', relationship: 'Friend' },
          { id: '2', name: 'Bob', phone: '+987654', relationship: 'Sibling' },
        ],
      } as never);

      mockCreateMessage.mockResolvedValue({}); // All succeed
      
      const result = await sendSOSAlert({
        clerkUserId: 'user_1',
        lat: 10.76,
        lng: 106.66,
        message: 'Help me',
      });

      expect(result.sent).toBe(true);
      const recipients = result.recipients as NonNullable<typeof result.recipients>;
      expect(recipients).toHaveLength(2);
      expect(recipients[0]!.status).toBe('success');
      expect(recipients[1]!.status).toBe('success');
      
    });
  });
});
