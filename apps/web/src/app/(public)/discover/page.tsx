import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, SlidersHorizontal, List, Map as MapIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover restaurants, attractions, and hidden gems near you with AI-powered recommendations.',
};

export default function DiscoverPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Discover Places</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Find restaurants, attractions, and hidden gems powered by AI and community recommendations.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="What are you looking for? Try 'best phở near me'" className="pl-12 h-12" />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['Restaurants', 'Cafés', 'Attractions', 'Shopping', 'Nightlife', 'Nature'].map((cat) => (
            <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-muted">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Discovering</h3>
          <p className="text-muted-foreground mb-6">
            Sign in to search for places near you, save favorites, and get personalized AI recommendations.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/sign-up">
              <Button>Sign Up Free</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
