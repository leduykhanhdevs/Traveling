jest.mock('../services/openai.service.js', () => ({
  generateAiItinerary: jest.fn(),
}));

jest.mock('../services/google-places.service.js', () => ({
  textSearchPlaceCandidates: jest.fn(),
}));

import './jest.setup.js';
import './external-service-mocks.js';
import type { ItineraryPlan, ItineraryRequest } from '@traveling/shared';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { textSearchPlaceCandidates } from '../services/google-places.service.js';
import { generateAiItinerary } from '../services/openai.service.js';
import { prisma } from '../services/prisma.service.js';

type UserRecord = {
  id: string;
  clerkId: string;
  email: string;
};

type ItineraryRecord = {
  id: string;
  content: unknown;
};

const userFindUniqueMock = prisma.user.findUnique as unknown as jest.MockedFunction<
  (args: unknown) => Promise<UserRecord | null>
>;
const itineraryCreateMock = prisma.itinerary.create as unknown as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>;
const itineraryFindUniqueMock = prisma.itinerary.findUnique as unknown as jest.MockedFunction<
  (args: unknown) => Promise<ItineraryRecord | null>
>;

const request: ItineraryRequest = {
  destination: 'Ho Chi Minh City',
  days: 1,
  budgetRange: 'midrange',
  travelStyle: 'local food',
  userId: 'clerk_user_1',
};

const plan: ItineraryPlan = {
  id: 'plan_1',
  destination: 'Ho Chi Minh City',
  budgetRange: 'midrange',
  totalEstimatedSpend: 25,
  days: [
    {
      day: 1,
      title: 'Day 1',
      totalEstimatedSpend: 25,
      slots: [
        {
          id: 'slot_1',
          day: 1,
          startTime: '09:00',
          endTime: '10:30',
          title: 'Ben Thanh breakfast',
          description: 'Try local breakfast near the market.',
          estimatedSpend: 25,
        },
      ],
    },
  ],
};

describe('itinerary.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('generates, enriches, and persists an itinerary for an authenticated user', async () => {
      jest.mocked(generateAiItinerary).mockResolvedValue(plan);
      jest.mocked(textSearchPlaceCandidates).mockResolvedValue([
        {
          googlePlaceId: 'place_1',
          name: 'Ben Thanh Market',
          address: 'District 1',
          coordinates: { lat: 10.772, lng: 106.698 },
          distanceMeters: 120,
          rating: 4.6,
          reviewCount: 1000,
          priceLevel: 1,
          types: ['restaurant'],
          openNow: true,
        },
      ]);
      userFindUniqueMock.mockResolvedValue({
        id: 'user_1',
        clerkId: 'clerk_user_1',
        email: 'test1@traveling.dev',
      });
      itineraryCreateMock.mockResolvedValue({ id: 'itinerary_1' });

      const result = await generateItinerary(request);

      expect(result.days[0]?.slots[0]?.place?.name).toBe('Ben Thanh Market');
      expect(textSearchPlaceCandidates).toHaveBeenCalledWith(
        'Ben Thanh breakfast Ho Chi Minh City',
      );
      expect(itineraryCreateMock).toHaveBeenCalledWith({
        data: {
          userId: 'user_1',
          destination: 'Ho Chi Minh City',
          days: 1,
          budgetRange: 'midrange',
          content: result,
        },
      });
    });

    it('exports a valid PDF buffer from a provided itinerary payload', async () => {
      const pdf = await exportItineraryPdf('plan_1', { plan });

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
      expect(itineraryFindUniqueMock).not.toHaveBeenCalled();
    });
  });

  describe('error path', () => {
    it('throws ITINERARY_NOT_FOUND when exporting a missing persisted itinerary', async () => {
      itineraryFindUniqueMock.mockResolvedValue(null);

      await expect(exportItineraryPdf('missing_itinerary', {})).rejects.toMatchObject({
        code: 'ITINERARY_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('auth failure case', () => {
    it('does not attempt user lookup or persistence when no userId is provided', async () => {
      jest.mocked(generateAiItinerary).mockResolvedValue(plan);
      jest.mocked(textSearchPlaceCandidates).mockResolvedValue([]);

      const result = await generateItinerary({
        ...request,
        userId: undefined,
      });

      expect(result.destination).toBe('Ho Chi Minh City');
      expect(userFindUniqueMock).not.toHaveBeenCalled();
      expect(itineraryCreateMock).not.toHaveBeenCalled();
    });
  });
});
