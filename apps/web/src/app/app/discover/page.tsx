'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, SlidersHorizontal, Star, BookmarkPlus, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

export default function AppDiscoverPage() {
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const token = await getToken();
      const data = await apiClient<any>('/api/v1/discover', {
        method: 'POST',
        token,
        body: JSON.stringify({
          query: query.trim(),
          lat: 10.7769,
          lng: 106.7009,
          filters: { radiusMeters: 2000, priceRange: [], dietaryRestrictions: [], openNow: false },
        }),
      });
      setResults(data.results || data.places || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed. Please try again.';
      toast({ title: 'Search Error', description: msg, variant: 'destructive' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlace = async (place: any) => {
    try {
      const token = await getToken();
      await apiClient('/api/v1/places/save', {
        method: 'POST',
        token,
        body: JSON.stringify({
          placeId: place.placeId || place.id,
          name: place.name,
          address: place.address || place.vicinity || '',
          lat: place.lat || place.location?.lat || 0,
          lng: place.lng || place.location?.lng || 0,
        }),
      });
      toast({ title: 'Place saved!' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not save place.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Discover Places</h1>
        <p className="text-muted-foreground">
          Find restaurants, attractions, and hidden gems with AI-powered search.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for places... e.g. 'best phở near me'"
            className="pl-10 h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading} className="h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {['Restaurants', 'Cafés', 'Attractions', 'Shopping', 'Hotels', 'Nature'].map((cat) => (
          <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-muted">
            {cat}
          </Badge>
        ))}
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try a different search term or adjust your filters.</p>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((place: any, i: number) => (
            <Card key={place.placeId || place.id || i} className="hover:border-primary/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{place.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {place.address || place.vicinity || 'Address unavailable'}
                    </p>
                    {place.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        <span className="text-sm font-medium">{place.rating}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSavePlace(place)}
                    aria-label="Save place"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searched && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Explore?</h3>
            <p className="text-muted-foreground">
              Enter a search term above to discover places near you. Try "best coffee" or "hidden gems".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
