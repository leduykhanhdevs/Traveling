import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Destinations',
  description: 'Explore popular travel destinations around the world with Traveling.',
};

const featuredDestinations = [
  { slug: 'ho-chi-minh-city', name: 'Ho Chi Minh City', country: 'Vietnam', region: 'Southeast Asia', description: 'A dynamic metropolis with incredible street food, French colonial architecture, and vibrant markets.', bestTime: 'Dec–Apr', emoji: '🇻🇳' },
  { slug: 'hanoi', name: 'Hanoi', country: 'Vietnam', region: 'Southeast Asia', description: 'Ancient capital with thousand-year history, lake-dotted charm, and legendary phở.', bestTime: 'Oct–Dec', emoji: '🇻🇳' },
  { slug: 'da-nang', name: 'Da Nang', country: 'Vietnam', region: 'Southeast Asia', description: 'Coastal city with stunning beaches, marble mountains, and world-class resorts.', bestTime: 'Feb–May', emoji: '🇻🇳' },
  { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'Southeast Asia', description: 'The city of temples, street food, rooftop bars, and unlimited night markets.', bestTime: 'Nov–Feb', emoji: '🇹🇭' },
  { slug: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'East Asia', description: 'Where ancient temples meet neon-lit streets, offering world-class cuisine and culture.', bestTime: 'Mar–May', emoji: '🇯🇵' },
  { slug: 'seoul', name: 'Seoul', country: 'South Korea', region: 'East Asia', description: 'K-culture capital with stunning palaces, trendy neighborhoods, and amazing food.', bestTime: 'Apr–Jun', emoji: '🇰🇷' },
  { slug: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Southeast Asia', description: 'A modern city-state blending Malay, Chinese, Indian, and global influences.', bestTime: 'Feb–Apr', emoji: '🇸🇬' },
  { slug: 'bali', name: 'Bali', country: 'Indonesia', region: 'Southeast Asia', description: 'Island paradise with rice terraces, temples, surf breaks, and spiritual retreats.', bestTime: 'Apr–Oct', emoji: '🇮🇩' },
  { slug: 'paris', name: 'Paris', country: 'France', region: 'Europe', description: 'The City of Light — art, fashion, cuisine, and timeless romance.', bestTime: 'Apr–Jun', emoji: '🇫🇷' },
];

const regions = ['All', 'Southeast Asia', 'East Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];

export default function DestinationsPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Explore Destinations</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Discover popular travel destinations and start planning your next adventure.
        </p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search destinations..." className="pl-12 h-12" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center mb-10">
        {regions.map((region) => (
          <Button key={region} variant={region === 'All' ? 'default' : 'outline'} size="sm">
            {region}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredDestinations.map((dest) => (
          <Link key={dest.slug} href={`/destinations/${dest.slug}`}>
            <Card className="group hover:border-primary/50 transition-all hover:shadow-md h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{dest.emoji}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {dest.region}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                  {dest.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{dest.country}</p>
                <p className="text-sm text-muted-foreground mb-4">{dest.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Best time: {dest.bestTime}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground mb-4">
          More destinations are added regularly from our database and community contributions.
        </p>
        <Link href="/discover">
          <Button className="gap-2">
            Discover Places Near You
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
