import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'Learn how to get started with Traveling.',
};

export default function GettingStartedHelpPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Getting Started with Traveling</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Create Your Account</h2>
            <p className="text-muted-foreground mb-4">
              Sign up for a free account using your email, Google, or Apple ID. Your account gives you access to all free features including:
            </p>
            <ul className="space-y-2">
              {['20 AI discovery queries per day', '50 translations per day', '10 saved places', 'Basic itinerary planning', 'Budget tracking', 'Community access'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Complete Your Profile</h2>
            <p className="text-muted-foreground mb-4">
              After signing up, you can customize your travel preferences:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Preferred language for translations and content</li>
              <li>Dietary restrictions for restaurant recommendations</li>
              <li>Travel style (local, adventure, family, luxury)</li>
              <li>Food preferences (spicy, sweet, savory)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Discover Places</h2>
            <p className="text-muted-foreground mb-4">
              Use the Discover feature to find restaurants, attractions, and hidden gems:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Enter what you're looking for (e.g., "best phở near me")</li>
              <li>Allow location access for nearby results</li>
              <li>Use filters for cuisine, budget, and dietary needs</li>
              <li>Save places you want to visit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Plan Your Trip</h2>
            <p className="text-muted-foreground mb-4">
              Generate AI-powered itineraries for your next adventure:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Enter your destination</li>
              <li>Specify the number of days</li>
              <li>Choose your budget range and travel style</li>
              <li>Get a personalized day-by-day plan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Use Translation</h2>
            <p className="text-muted-foreground mb-4">
              Break language barriers with real-time translation:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Text translation in 50+ languages</li>
              <li>Auto-detect source language</li>
              <li>OCR camera translation (Premium)</li>
              <li>Voice translation (Premium)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Need More?</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Premium for unlimited access to all features, including unlimited AI queries, translations, and saved places.
                </p>
                <Link href="/pricing">
                  <Button className="gap-2">
                    View Pricing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
