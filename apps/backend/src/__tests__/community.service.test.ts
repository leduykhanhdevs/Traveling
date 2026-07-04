import './jest.setup.js';
import './external-service-mocks.js';
import {
  createCommunityReview,
  followTraveler,
  listCommunityReviews,
} from '../services/community.service.js';
import { prisma } from '../services/prisma.service.js';

type UserRecord = {
  id: string;
  clerkId: string;
  email: string;
};

type ReviewRecord = {
  id: string;
  placeId: string;
  userId: string;
  nationality: string;
  rating: number;
  text: string;
  photos: string[];
  tags: string[];
  createdAt: Date;
  user?: UserRecord;
};

const userFindUniqueMock = prisma.user.findUnique as unknown as jest.MockedFunction<
  (args: unknown) => Promise<UserRecord | null>
>;
const reviewFindManyMock = prisma.review.findMany as unknown as jest.MockedFunction<
  (args: unknown) => Promise<ReviewRecord[]>
>;
const reviewCreateMock = prisma.review.create as unknown as jest.MockedFunction<
  (args: unknown) => Promise<ReviewRecord>
>;
const followUpsertMock = prisma.follow.upsert as unknown as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>;

const user: UserRecord = {
  id: 'user_1',
  clerkId: 'clerk_user_1',
  email: 'test1@traveling.dev',
};

const review: ReviewRecord = {
  id: 'review_1',
  placeId: 'hcmc-pho',
  userId: 'user_1',
  nationality: 'Vietnamese',
  rating: 5,
  text: 'Excellent broth.',
  photos: ['https://example.com/pho.jpg'],
  tags: ['pho'],
  createdAt: new Date('2026-05-30T00:00:00.000Z'),
  user,
};

describe('community.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('lists reviews and maps traveler names from reviewer emails', async () => {
      reviewFindManyMock.mockResolvedValue([review]);

      const result = await listCommunityReviews({
        nationality: 'Vietnamese',
        foodCategory: 'pho',
        city: 'hcmc',
      });

      expect(result).toEqual([
        {
          id: 'review_1',
          placeId: 'hcmc-pho',
          userId: 'user_1',
          userName: 'test1',
          nationality: 'Vietnamese',
          rating: 5,
          text: 'Excellent broth.',
          photos: ['https://example.com/pho.jpg'],
          tags: ['pho'],
          createdAt: '2026-05-30T00:00:00.000Z',
        },
      ]);
      expect(reviewFindManyMock).toHaveBeenCalledWith({
        where: {
          nationality: 'Vietnamese',
          tags: { has: 'pho' },
          placeId: { contains: 'hcmc', mode: 'insensitive' },
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('creates a review for an existing Traveling user', async () => {
      userFindUniqueMock.mockResolvedValue(user);
      reviewCreateMock.mockResolvedValue(review);

      const result = await createCommunityReview({
        userId: 'clerk_user_1',
        placeId: 'hcmc-pho',
        rating: 5,
        text: 'Excellent broth.',
        photos: ['https://example.com/pho.jpg'],
        tags: ['pho'],
        nationality: 'Vietnamese',
      });

      expect(result.userName).toBe('test1');
      expect(reviewCreateMock).toHaveBeenCalledWith({
        data: {
          userId: 'user_1',
          placeId: 'hcmc-pho',
          rating: 5,
          text: 'Excellent broth.',
          photos: ['https://example.com/pho.jpg'],
          tags: ['pho'],
          nationality: 'Vietnamese',
        },
      });
    });

    it('upserts a follow relationship', async () => {
      userFindUniqueMock.mockResolvedValue(user);
      followUpsertMock.mockResolvedValue({ id: 'follow_1' });

      await expect(followTraveler('clerk_user_1', 'user_2')).resolves.toEqual({
        followed: true,
      });
      expect(followUpsertMock).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 'user_1',
            followingId: 'user_2',
          },
        },
        update: {},
        create: {
          followerId: 'user_1',
          followingId: 'user_2',
        },
      });
    });
  });

  describe('error path', () => {
    it('throws USER_NOT_FOUND before creating a review when the Clerk user is unknown', async () => {
      userFindUniqueMock.mockResolvedValue(null);

      await expect(
        createCommunityReview({
          userId: 'missing_clerk_user',
          placeId: 'hcmc-pho',
          rating: 4,
          text: 'Good.',
          photos: [],
          tags: [],
          nationality: 'Vietnamese',
        }),
      ).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
      expect(reviewCreateMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure case', () => {
    it('throws USER_NOT_FOUND before following when the follower profile is missing', async () => {
      userFindUniqueMock.mockResolvedValue(null);

      await expect(followTraveler('missing_clerk_user', 'user_2')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
      expect(followUpsertMock).not.toHaveBeenCalled();
    });
  });
});
