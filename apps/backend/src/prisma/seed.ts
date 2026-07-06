import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedUser = {
  clerkId: string;
  email: string;
  preferredLanguage: string;
  dietaryRestrictions: string[];
  travelStyle: string;
  spicyPreference: number;
  sweetPreference: number;
  savoryPreference: number;
  subscriptionTier: string;
  nationality: string;
};

type SeedPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const users: [SeedUser, SeedUser] = [
  {
    clerkId: 'user_test_traveling_1',
    email: 'test1@traveling.dev',
    preferredLanguage: 'en',
    dietaryRestrictions: ['vegan'],
    travelStyle: 'local',
    spicyPreference: 4,
    sweetPreference: 2,
    savoryPreference: 5,
    subscriptionTier: 'premium',
    nationality: 'Vietnamese',
  },
  {
    clerkId: 'user_test_traveling_2',
    email: 'test2@traveling.dev',
    preferredLanguage: 'vi',
    dietaryRestrictions: ['halal'],
    travelStyle: 'comfort',
    spicyPreference: 2,
    sweetPreference: 4,
    savoryPreference: 3,
    subscriptionTier: 'free',
    nationality: 'American',
  },
];

const samplePlaces: SeedPlace[] = [
  {
    placeId: 'seed_ben_thanh_market',
    name: 'Ben Thanh Market',
    address: 'Le Loi, District 1, Ho Chi Minh City, Vietnam',
    lat: 10.7721,
    lng: 106.6983,
  },
  {
    placeId: 'seed_war_remnants_museum',
    name: 'War Remnants Museum',
    address: '28 Vo Van Tan, District 3, Ho Chi Minh City, Vietnam',
    lat: 10.7795,
    lng: 106.692,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itineraryContent = (itineraryId: string): any => ({
  id: itineraryId,
  destination: 'Ho Chi Minh City',
  budgetRange: 'midrange',
  totalEstimatedSpend: 65,
  days: [
    {
      day: 1,
      title: 'Day 1',
      totalEstimatedSpend: 65,
      slots: [
        {
          id: `${itineraryId}_slot_1`,
          day: 1,
          startTime: '09:00',
          endTime: '11:00',
          title: 'Morning market walk',
          description: 'Browse local stalls and try a light breakfast near Ben Thanh Market.',
          estimatedSpend: 20,
          place: {
            id: 'seed_ben_thanh_market',
            googlePlaceId: 'seed_ben_thanh_market',
            name: 'Ben Thanh Market',
            address: 'Le Loi, District 1, Ho Chi Minh City, Vietnam',
            coordinates: {
              lat: 10.7721,
              lng: 106.6983,
            },
            distanceMeters: 450,
            cuisineTags: ['market', 'local_food'],
            score: {
              googleRatingScore: 88,
              reviewVolumeScore: 80,
              socialProofScore: 70,
              compositeScore: 81,
            },
            reviewSignals: [],
            aiSummary: 'A central market stop with strong local food options.',
          },
        },
        {
          id: `${itineraryId}_slot_2`,
          day: 1,
          startTime: '13:00',
          endTime: '15:00',
          title: 'Museum visit',
          description: 'Visit a major cultural history museum and leave time for reflection.',
          estimatedSpend: 45,
          place: {
            id: 'seed_war_remnants_museum',
            googlePlaceId: 'seed_war_remnants_museum',
            name: 'War Remnants Museum',
            address: '28 Vo Van Tan, District 3, Ho Chi Minh City, Vietnam',
            coordinates: {
              lat: 10.7795,
              lng: 106.692,
            },
            distanceMeters: 1200,
            cuisineTags: ['museum', 'history'],
            score: {
              googleRatingScore: 90,
              reviewVolumeScore: 84,
              socialProofScore: 68,
              compositeScore: 83,
            },
            reviewSignals: [],
            aiSummary: 'A high-signal cultural stop for first-time visitors.',
          },
        },
      ],
    },
  ],
});

const seed = async (): Promise<void> => {
  const testUserOne = await prisma.user.upsert({
    where: {
      clerkId: users[0].clerkId,
    },
    update: users[0],
    create: users[0],
  });

  const testUserTwo = await prisma.user.upsert({
    where: {
      clerkId: users[1].clerkId,
    },
    update: users[1],
    create: users[1],
  });

  for (const place of samplePlaces) {
    await prisma.savedPlace.upsert({
      where: {
        userId_placeId: {
          userId: testUserOne.id,
          placeId: place.placeId,
        },
      },
      update: {
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      },
      create: {
        userId: testUserOne.id,
        ...place,
      },
    });
  }

  await prisma.review.upsert({
    where: {
      id: 'seed_review_ben_thanh_market',
    },
    update: {
      rating: 4.6,
      text: 'Busy, easy to reach, and useful for a first local food stop.',
      photos: [],
      tags: ['market', 'local_food'],
      nationality: 'Vietnamese',
    },
    create: {
      id: 'seed_review_ben_thanh_market',
      userId: testUserTwo.id,
      placeId: 'seed_ben_thanh_market',
      rating: 4.6,
      text: 'Busy, easy to reach, and useful for a first local food stop.',
      photos: [],
      tags: ['market', 'local_food'],
      nationality: 'Vietnamese',
    },
  });

  const itineraryId = 'seed_itinerary_hcmc_midrange';
  await prisma.itinerary.upsert({
    where: {
      id: itineraryId,
    },
    update: {
      destination: 'Ho Chi Minh City',
      days: 1,
      budgetRange: 'midrange',
      content: itineraryContent(itineraryId),
    },
    create: {
      id: itineraryId,
      userId: testUserOne.id,
      destination: 'Ho Chi Minh City',
      days: 1,
      budgetRange: 'midrange',
      content: itineraryContent(itineraryId),
    },
  });

  const secondItineraryId = 'seed_itinerary_hcmc_history';
  await prisma.itinerary.upsert({
    where: {
      id: secondItineraryId,
    },
    update: {
      destination: 'Ho Chi Minh City',
      days: 1,
      budgetRange: 'budget',
      content: itineraryContent(secondItineraryId),
    },
    create: {
      id: secondItineraryId,
      userId: testUserTwo.id,
      destination: 'Ho Chi Minh City',
      days: 1,
      budgetRange: 'budget',
      content: itineraryContent(secondItineraryId),
    },
  });

  await prisma.searchHistory.upsert({
    where: {
      id: 'seed_search_hcmc_hotpot',
    },
    update: {
      query: 'What to eat: lau bo',
      lat: 10.7769,
      lng: 106.7009,
      results: {
        places: samplePlaces,
      },
    },
    create: {
      id: 'seed_search_hcmc_hotpot',
      userId: testUserOne.id,
      query: 'What to eat: lau bo',
      lat: 10.7769,
      lng: 106.7009,
      results: {
        places: samplePlaces,
      },
    },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.info('Development seed data is ready.');
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    console.error(error instanceof Error ? error.message : 'Seed failed.');
    process.exit(1);
  });
