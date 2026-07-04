import './external-service-mocks.js';
import request from 'supertest';
import {
  deleteBudgetItemById,
  getBudgets,
  postBudget,
  postBudgetItem,
} from '../controllers/budget.controller.js';
import { prisma } from '../services/prisma.service.js';
import { authenticated, buildTestApp } from './controller-test-utils.js';

describe('budget.controller', () => {
  const userFindUniqueMock = prisma.user.findUnique as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const budgetFindManyMock = prisma.budget.findMany as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const budgetFindFirstMock = prisma.budget.findFirst as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const budgetCreateMock = prisma.budget.create as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const budgetItemCreateMock = prisma.budgetItem.create as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const budgetItemDeleteManyMock = prisma.budgetItem.deleteMany as unknown as jest.MockedFunction<
    (args: unknown) => Promise<{ count: number }>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('lists budgets with items for the authenticated user', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'user_1', clerkId: 'clerk_user_1' });
      const budgets = [
        {
          id: 'budget_1',
          userId: 'user_1',
          tripName: 'Hanoi food crawl',
          totalBudget: 500,
          currency: 'USD',
          createdAt: new Date('2026-06-23T00:00:00.000Z'),
          items: [
            {
              id: 'item_1',
              budgetId: 'budget_1',
              category: 'Food',
              amount: 25,
              description: 'Pho Gia Truyen',
              date: new Date('2026-06-23T00:00:00.000Z'),
            },
          ],
        },
      ];
      budgetFindManyMock.mockResolvedValue(budgets);

      const app = buildTestApp([
        {
          method: 'get',
          path: '/',
          handlers: [authenticated('clerk_user_1'), getBudgets],
        },
      ]);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.data.budgets).toEqual([
        {
          id: 'budget_1',
          userId: 'user_1',
          tripName: 'Hanoi food crawl',
          totalBudget: 500,
          currency: 'USD',
          createdAt: '2026-06-23T00:00:00.000Z',
          items: [
            {
              id: 'item_1',
              budgetId: 'budget_1',
              category: 'Food',
              amount: 25,
              description: 'Pho Gia Truyen',
              date: '2026-06-23T00:00:00.000Z',
            },
          ],
        },
      ]);
    });

    it('creates a new trip budget', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'user_1', clerkId: 'clerk_user_1' });
      const budget = {
        id: 'budget_1',
        userId: 'user_1',
        tripName: 'Hanoi tour',
        totalBudget: 600,
        currency: 'USD',
        createdAt: new Date('2026-06-23T00:00:00.000Z'),
        items: [],
      };
      budgetCreateMock.mockResolvedValue(budget);

      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postBudget],
        },
      ]);

      const response = await request(app)
        .post('/')
        .send({ tripName: 'Hanoi tour', totalBudget: 600, currency: 'USD' });

      expect(response.status).toBe(201);
      expect(response.body.data.tripName).toBe('Hanoi tour');
    });

    it('adds an expense to the budget', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'user_1', clerkId: 'clerk_user_1' });
      const budget = {
        id: 'budget_1',
        userId: 'user_1',
        tripName: 'Hanoi tour',
        totalBudget: 600,
        currency: 'USD',
        createdAt: new Date('2026-06-23T00:00:00.000Z'),
        items: [],
      };
      budgetFindFirstMock.mockResolvedValue(budget);
      budgetItemCreateMock.mockResolvedValue({
        id: 'item_1',
        budgetId: 'budget_1',
        category: 'Food',
        amount: 20,
        description: 'Banh mi',
        date: new Date('2026-06-23T08:00:00.000Z'),
      });

      const app = buildTestApp([
        {
          method: 'post',
          path: '/:id/items',
          handlers: [authenticated('clerk_user_1'), postBudgetItem],
        },
      ]);

      const response = await request(app)
        .post('/budget_1/items')
        .send({
          category: 'Food',
          amount: 20,
          description: 'Banh mi',
          date: '2026-06-23T08:00:00.000Z',
        });

      expect(response.status).toBe(201);
    });

    it('deletes an expense from the budget', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'user_1', clerkId: 'clerk_user_1' });
      const budget = {
        id: 'budget_1',
        userId: 'user_1',
        tripName: 'Hanoi tour',
        totalBudget: 600,
        currency: 'USD',
        createdAt: new Date('2026-06-23T00:00:00.000Z'),
        items: [],
      };
      budgetFindFirstMock.mockResolvedValue(budget);
      budgetItemDeleteManyMock.mockResolvedValue({ count: 1 });

      const app = buildTestApp([
        {
          method: 'delete',
          path: '/:id/items/:itemId',
          handlers: [authenticated('clerk_user_1'), deleteBudgetItemById],
        },
      ]);

      const response = await request(app).delete('/budget_1/items/item_1');

      expect(response.status).toBe(200);
      expect(budgetItemDeleteManyMock).toHaveBeenCalledWith({
        where: {
          id: 'item_1',
          budgetId: 'budget_1',
        },
      });
    });
  });

  describe('error case', () => {
    it('returns 404 error if user profile is missing', async () => {
      userFindUniqueMock.mockResolvedValue(null);

      const app = buildTestApp([
        {
          method: 'get',
          path: '/',
          handlers: [authenticated('clerk_user_1'), getBudgets],
        },
      ]);

      const response = await request(app).get('/');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('returns validation error if budget fields are invalid', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'user_1' });
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postBudget],
        },
      ]);

      const response = await request(app).post('/').send({ tripName: '', totalBudget: -50, currency: 'USD' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
