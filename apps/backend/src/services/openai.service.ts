import type { ItineraryPlan, ItineraryRequest, QueryType, RankedPlace } from '@traveling/shared';
import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logUnknownError } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export type ParsedIntent = {
  queryType: QueryType;
  detectedLanguage: string;
  normalizedQuery: string;
  cuisineHints: readonly string[];
};

const intentSchema = z.object({
  queryType: z.union([z.literal('food'), z.literal('place'), z.literal('experience')]),
  detectedLanguage: z.string().min(2).default('en'),
  normalizedQuery: z.string().min(1),
  cuisineHints: z.array(z.string()).default([]),
});

const summarySchema = z.object({
  summaries: z.array(
    z.object({
      id: z.string(),
      aiSummary: z.string().min(1),
    }),
  ),
});

const itineraryPlanSchema = z.object({
  id: z.string(),
  destination: z.string(),
  days: z.array(
    z.object({
      day: z.number().int(),
      title: z.string(),
      totalEstimatedSpend: z.number(),
      slots: z.array(
        z.object({
          id: z.string(),
          day: z.number().int(),
          startTime: z.string(),
          endTime: z.string(),
          title: z.string(),
          description: z.string(),
          estimatedSpend: z.number(),
        }),
      ),
    }),
  ),
  budgetRange: z.union([z.literal('budget'), z.literal('midrange'), z.literal('premium')]),
  totalEstimatedSpend: z.number(),
});

const inferQueryType = (query: string): QueryType => {
  const normalized = query.toLowerCase();
  if (/(eat|food|restaurant|cafe|coffee|lẩu|phở|bún|sushi|pizza|taco)/i.test(normalized)) {
    return 'food';
  }
  if (/(do|experience|tour|class|show|nightlife|activity)/i.test(normalized)) {
    return 'experience';
  }
  return 'place';
};

const inferLanguage = (query: string): string => {
  if (/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(query)) {
    return 'vi';
  }
  return 'auto';
};

export const parseDiscoveryIntent = async (query: string): Promise<ParsedIntent> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Parse a tourist discovery query. Return JSON: queryType food/place/experience, detectedLanguage ISO code, normalizedQuery English search phrase, cuisineHints string array.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.1,
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error('OpenAI returned empty intent response.');
    }
    return intentSchema.parse(JSON.parse(content));
  } catch (error) {
    logUnknownError('OpenAI intent parsing failed; falling back to heuristic parsing', error, {
      query,
    });
    return {
      queryType: inferQueryType(query),
      detectedLanguage: inferLanguage(query),
      normalizedQuery: query,
      cuisineHints: [],
    };
  }
};

export const addPlaceSummaries = async (
  places: readonly RankedPlace[],
  userQuery: string,
): Promise<readonly RankedPlace[]> => {
  if (places.length === 0) {
    return places;
  }

  try {
    const payload = places.slice(0, 10).map((place) => ({
      id: place.id,
      name: place.name,
      score: place.score,
      topReviewSnippet: place.topReviewSnippet,
      tags: place.cuisineTags,
    }));
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Write concise traveler-facing recommendation summaries. Return JSON { "summaries": [{ "id": string, "aiSummary": string }] }.',
        },
        {
          role: 'user',
          content: JSON.stringify({ userQuery, places: payload }),
        },
      ],
      temperature: 0.4,
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      return places;
    }
    const parsed = summarySchema.parse(JSON.parse(content));
    const summaries = new Map(parsed.summaries.map((summary) => [summary.id, summary.aiSummary]));
    return places.map((place) => ({
      ...place,
      aiSummary: summaries.get(place.id) ?? place.aiSummary,
    }));
  } catch (error) {
    logUnknownError('OpenAI place summaries failed', error);
    return places;
  }
};

export const generateAiItinerary = async (
  request: ItineraryRequest,
): Promise<ItineraryPlan | null> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Generate a travel itinerary. Return JSON matching { id, destination, budgetRange, totalEstimatedSpend, days: [{ day, title, totalEstimatedSpend, slots: [{ id, day, startTime, endTime, title, description, estimatedSpend }] }] }.',
        },
        {
          role: 'user',
          content: JSON.stringify(request),
        },
      ],
      temperature: 0.5,
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      return null;
    }
    const parsed = itineraryPlanSchema.parse(JSON.parse(content));
    return parsed as ItineraryPlan;
  } catch (error) {
    logUnknownError('OpenAI itinerary generation failed', error, {
      destination: request.destination,
    });
    return null;
  }
};
