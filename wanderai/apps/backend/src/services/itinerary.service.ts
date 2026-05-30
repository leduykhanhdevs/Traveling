import type {
  ItineraryDay,
  ItineraryPlan,
  ItineraryRequest,
  ItinerarySlot,
} from '@wanderai/shared';
import PDFDocument from 'pdfkit';
import { v4 as uuid } from 'uuid';
import { AppError } from '../utils/errors.js';
import { logUnknownError } from '../utils/logger.js';
import { textSearchPlaceCandidates } from './google-places.service.js';
import { generateAiItinerary } from './openai.service.js';
import { prisma } from './prisma.service.js';

const fallbackPlan = (request: ItineraryRequest): ItineraryPlan => {
  const days: ItineraryDay[] = Array.from({ length: request.days }, (_, dayIndex) => {
    const day = dayIndex + 1;
    const slots: ItinerarySlot[] = [
      {
        id: uuid(),
        day,
        startTime: '09:00',
        endTime: '11:00',
        title: `${request.destination} neighborhood walk`,
        description: `Start with a low-pressure walk tuned for ${request.travelStyle} travelers.`,
        estimatedSpend:
          request.budgetRange === 'premium' ? 45 : request.budgetRange === 'midrange' ? 20 : 8,
      },
      {
        id: uuid(),
        day,
        startTime: '12:00',
        endTime: '14:00',
        title: 'Local lunch stop',
        description: 'Pick a busy local restaurant with strong recent reviews.',
        estimatedSpend:
          request.budgetRange === 'premium' ? 60 : request.budgetRange === 'midrange' ? 25 : 10,
      },
      {
        id: uuid(),
        day,
        startTime: '16:00',
        endTime: '18:30',
        title: 'Signature attraction',
        description: 'Anchor the afternoon around one iconic place plus nearby hidden streets.',
        estimatedSpend:
          request.budgetRange === 'premium' ? 80 : request.budgetRange === 'midrange' ? 35 : 12,
      },
    ];
    return {
      day,
      title: `Day ${day}`,
      slots,
      totalEstimatedSpend: slots.reduce((total, slot) => total + slot.estimatedSpend, 0),
    };
  });
  return {
    id: uuid(),
    destination: request.destination,
    days,
    budgetRange: request.budgetRange,
    totalEstimatedSpend: days.reduce((total, day) => total + day.totalEstimatedSpend, 0),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBudgetRange = (value: unknown): value is ItineraryPlan['budgetRange'] =>
  value === 'budget' || value === 'midrange' || value === 'premium';

const isItinerarySlot = (value: unknown): value is ItinerarySlot => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.day === 'number' &&
    typeof value.startTime === 'string' &&
    typeof value.endTime === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.estimatedSpend === 'number'
  );
};

const isItineraryDay = (value: unknown): value is ItineraryDay => {
  if (!isRecord(value) || !Array.isArray(value.slots)) {
    return false;
  }

  return (
    typeof value.day === 'number' &&
    typeof value.title === 'string' &&
    typeof value.totalEstimatedSpend === 'number' &&
    value.slots.every(isItinerarySlot)
  );
};

const isItineraryPlan = (value: unknown): value is ItineraryPlan => {
  if (!isRecord(value) || !Array.isArray(value.days)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.destination === 'string' &&
    isBudgetRange(value.budgetRange) &&
    typeof value.totalEstimatedSpend === 'number' &&
    value.days.every(isItineraryDay)
  );
};

const planFromPayload = (payload: unknown): ItineraryPlan | null => {
  if (isItineraryPlan(payload)) {
    return payload;
  }

  if (isRecord(payload) && isItineraryPlan(payload.plan)) {
    return payload.plan;
  }

  return null;
};

const placeNameForSlot = (slot: ItinerarySlot): string | null => {
  const place = slot.place;
  return place?.name ?? null;
};

const writeSectionTitle = (doc: PDFKit.PDFDocument, title: string): void => {
  if (doc.y > 700) {
    doc.addPage();
  }

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text(title);
  doc.moveTo(48, doc.y + 4).lineTo(547, doc.y + 4).strokeColor('#E5E7EB').stroke();
  doc.moveDown(0.8);
};

const writeSlot = (doc: PDFKit.PDFDocument, slot: ItinerarySlot): void => {
  if (doc.y > 660) {
    doc.addPage();
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
  doc.text(`${slot.startTime} - ${slot.endTime}  ${slot.title}`);

  const placeName = placeNameForSlot(slot);
  if (placeName) {
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`Place: ${placeName}`);
  }

  doc.font('Helvetica').fontSize(10).fillColor('#4B5563').text(`Notes: ${slot.description}`, {
    width: 500,
  });
  doc.fillColor('#6B7280').text(`Estimated spend: $${slot.estimatedSpend}`);
  doc.moveDown(0.8);
};

const renderItineraryPdf = (plan: ItineraryPlan): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      info: {
        Title: `${plan.destination} itinerary`,
        Subject: 'WanderAI itinerary export',
      },
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(24).fillColor('#111827').text(plan.destination);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#4B5563');
    doc.text(`Trip title: ${plan.destination}`);
    doc.text(`Trip dates: Day 1 to Day ${plan.days.length}`);
    doc.text(`Budget range: ${plan.budgetRange}`);
    doc.text(`Total estimated spend: $${plan.totalEstimatedSpend}`);
    doc.text(`Itinerary ID: ${plan.id}`);
    doc.text(`Exported: ${new Date().toISOString()}`);

    plan.days.forEach((day) => {
      writeSectionTitle(doc, day.title);
      doc.font('Helvetica').fontSize(10).fillColor('#6B7280');
      doc.text(`Day ${day.day} estimated spend: $${day.totalEstimatedSpend}`);
      doc.moveDown(0.8);
      day.slots.forEach((slot) => writeSlot(doc, slot));
    });

    doc.end();
  });

const loadPersistedItineraryPlan = async (itineraryId: string): Promise<ItineraryPlan> => {
  const itinerary = await prisma.itinerary.findUnique({
    where: {
      id: itineraryId,
    },
  });

  if (!itinerary) {
    throw new AppError('ITINERARY_NOT_FOUND', 'Itinerary could not be found.', 404);
  }

  if (!isItineraryPlan(itinerary.content)) {
    throw new AppError('INVALID_ITINERARY_CONTENT', 'Itinerary content cannot be exported.', 422);
  }

  return itinerary.content;
};

export const generateItinerary = async (request: ItineraryRequest): Promise<ItineraryPlan> => {
  const plan = (await generateAiItinerary(request)) ?? fallbackPlan(request);

  const enrichedDays = await Promise.all(
    plan.days.map(async (day) => {
      const slots = await Promise.all(
        day.slots.map(async (slot) => {
          const places = await textSearchPlaceCandidates(`${slot.title} ${request.destination}`);
          const place = places[0];
          return place
            ? {
                ...slot,
                place: {
                  id: place.googlePlaceId,
                  googlePlaceId: place.googlePlaceId,
                  name: place.name,
                  address: place.address,
                  coordinates: place.coordinates,
                  distanceMeters: place.distanceMeters,
                  priceLevel: place.priceLevel,
                  cuisineTags: place.types,
                  photoUrl: place.photoUrl,
                  openNow: place.openNow,
                  score: {
                    googleRatingScore: Math.round(((place.rating ?? 0) / 5) * 100),
                    reviewVolumeScore: 0,
                    socialProofScore: 0,
                    compositeScore: Math.round(((place.rating ?? 0) / 5) * 100),
                  },
                  reviewSignals: [],
                  aiSummary: slot.description,
                },
              }
            : slot;
        }),
      );

      return {
        ...day,
        slots,
      };
    }),
  );

  const enrichedPlan = {
    ...plan,
    days: enrichedDays,
  };

  if (request.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: request.userId },
      });
      if (user) {
        await prisma.itinerary.create({
          data: {
            userId: user.id,
            destination: request.destination,
            days: request.days,
            budgetRange: request.budgetRange,
            content: enrichedPlan,
          },
        });
      }
    } catch (error) {
      logUnknownError('Persisting itinerary failed', error, { userId: request.userId });
    }
  }

  return enrichedPlan;
};

export const exportItineraryPdf = async (
  itineraryId: string,
  payload: unknown,
): Promise<Buffer> => {
  const plan = planFromPayload(payload) ?? (await loadPersistedItineraryPlan(itineraryId));
  return renderItineraryPdf({
    ...plan,
    id: plan.id || itineraryId,
  });
};
