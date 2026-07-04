import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/controllers/community.controller.ts',
    'src/controllers/discover.controller.ts',
    'src/controllers/itinerary.controller.ts',
    'src/controllers/places.controller.ts',
    'src/controllers/profile.controller.ts',
    'src/controllers/speech.controller.ts',
    'src/controllers/translate.controller.ts',
    'src/controllers/utility.controller.ts',
    'src/services/community.service.ts',
    'src/services/google-places.service.ts',
    'src/services/itinerary.service.ts',
    'src/services/recommendation.service.ts',
    'src/services/translation.service.ts',
  ],
  coverageReporters: ['text', 'text-summary'],
  moduleNameMapper: {
    '^@traveling/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          types: ['node', 'jest'],
          esModuleInterop: true,
        },
      },
    ],
  },
};

export default config;
