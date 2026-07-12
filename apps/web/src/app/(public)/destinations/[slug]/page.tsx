import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, Sun, Utensils, ArrowLeft, ArrowRight } from 'lucide-react';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Travel Guide`,
    description: `Discover ${name}: travel tips, best times to visit, local food, and more.`,
  };
}

export default async function DestinationDetailPage({ params }: Props) {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="container py-16 md:py-24">
      <Link href="/destinations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Destinations
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{name}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore everything {name} has to offer — from local cuisine to must-see attractions.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <Calendar className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Best Time to Visit</h3>
              <p className="text-sm text-muted-foreground">
                Check local weather patterns and plan your visit during the best season for your activities.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Sun className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Climate</h3>
              <p className="text-sm text-muted-foreground">
                Use the weather tool to check current conditions and forecast for {name}.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Utensils className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Local Cuisine</h3>
              <p className="text-sm text-muted-foreground">
                Discover the best local restaurants and food experiences through our AI-powered discovery.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <MapPin className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Top Attractions</h3>
              <p className="text-sm text-muted-foreground">
                Explore must-visit places and hidden gems recommended by our community.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/discover">
            <Button className="gap-2">
              Discover Places in {name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="outline" className="gap-2">
              Plan an Itinerary
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
