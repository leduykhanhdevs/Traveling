import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Search, MapPin, Languages, Wallet, BookmarkPlus, Users,
  Cloud, Shield, Camera, Mic, Globe, Sparkles, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore all the features that make Traveling your complete travel companion.',
};

const featureDetails = [
  {
    icon: Search, title: 'Smart Discovery',
    description: 'Find restaurants, attractions, and hidden gems with AI-powered recommendations.',
    details: [
      'AI-ranked results using Google Places, community reviews, and social signals',
      'Filter by cuisine, dietary restrictions, budget, and distance',
      'Open-now filter for immediate needs',
      'Surprise Me mode for adventurous travelers',
      'Results enhanced with TikTok and Facebook popularity signals',
    ],
    badge: 'AI-Powered',
  },
  {
    icon: MapPin, title: 'AI Itinerary Planning',
    description: 'Generate personalized travel itineraries with real places and smart scheduling.',
    details: [
      'Day-by-day plans based on your destination and travel dates',
      'Budget-aware suggestions (budget, midrange, premium)',
      'Travel style customization (local, adventure, family, luxury)',
      'Real places from Google Places API',
      'Weather-based replanning',
      'Export and share with travel companions',
    ],
    badge: 'AI-Powered',
  },
  {
    icon: Languages, title: 'Real-time Translation',
    description: 'Break language barriers with text translation supporting 50+ languages.',
    details: [
      'DeepL primary translation with Google Cloud fallback',
      'Auto-detection of source language',
      '50+ supported languages',
      'Translation caching for instant repeat translations',
      'Free tier: 50 translations/day',
    ],
    badge: 'Core Feature',
  },
  {
    icon: Camera, title: 'Camera Translation (OCR)',
    description: 'Point your camera at menus, signs, and documents to translate text instantly.',
    details: [
      'Google Cloud Vision OCR for text extraction',
      'Supports multiple text blocks per image',
      'Great for menus, street signs, and documents',
      'Premium feature',
    ],
    badge: 'Premium',
  },
  {
    icon: Mic, title: 'Voice Translation',
    description: 'Speak and get real-time transcription and translation.',
    details: [
      'Speech-to-text transcription',
      'Supports multiple speech language codes',
      'Useful for conversations and pronunciation help',
      'Premium feature',
    ],
    badge: 'Premium',
  },
  {
    icon: Wallet, title: 'Budget Management',
    description: 'Track expenses, split costs, and stay on budget across currencies.',
    details: [
      'Create budgets for each trip',
      'Categorize expenses (food, transport, accommodation, etc.)',
      'Shared budgets with travel companions',
      'Settlement calculations for group expenses',
      'Currency support',
      'Budget invitation system',
    ],
    badge: 'Core Feature',
  },
  {
    icon: BookmarkPlus, title: 'Saved Places',
    description: 'Bookmark your favorite discoveries for easy access.',
    details: [
      'Save any discovered place with one tap',
      'View saved places on a map',
      'Add saved places to itineraries',
      'Free tier: 10 saved places',
      'Premium: unlimited saved places',
    ],
    badge: 'Core Feature',
  },
  {
    icon: Users, title: 'Travel Community',
    description: 'Share experiences, read reviews, and connect with fellow travelers.',
    details: [
      'Post travel experiences with photos',
      'Write and read place reviews',
      'Comment and like community posts',
      'Follow other travelers',
      'Community-sourced destination insights',
    ],
    badge: 'Core Feature',
  },
  {
    icon: Cloud, title: 'Weather & Currency',
    description: 'Check destination weather and convert currencies instantly.',
    details: [
      'Current weather and forecasts via OpenWeather',
      'Real-time exchange rates',
      'Currency conversion calculator',
      'Helpful for budget planning and packing',
    ],
    badge: 'Utility',
  },
  {
    icon: Shield, title: 'Safety & Emergency',
    description: 'Emergency contacts, SOS features, and safety information.',
    details: [
      'Country-specific emergency numbers',
      'Personal emergency contacts storage',
      'SOS alert system',
      'Safety information for destinations',
    ],
    badge: 'Safety',
    note: 'SOS features require Twilio credentials to be configured. They are convenience tools and not a substitute for contacting local emergency services directly.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">All Features</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to discover, plan, translate, budget, and share — in one platform.
        </p>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto">
        {featureDetails.map((feature) => (
          <Card key={feature.title} className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{feature.title}</h2>
                    <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  {feature.note && (
                    <p className="text-xs text-muted-foreground mt-4 italic border-l-2 border-warning pl-3">
                      {feature.note}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link href="/sign-up">
          <Button size="xl" className="gap-2">
            Start Exploring Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
