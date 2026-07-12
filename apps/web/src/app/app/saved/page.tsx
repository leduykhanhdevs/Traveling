'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkPlus, MapPin, Trash2, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

type SavedPlace = {
  id: string;
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  savedAt: string;
};

export default function SavedPlacesPage() {
  const { getToken } = useAuth();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const token = await getToken();
      const data = await apiClient<SavedPlace[]>('/api/v1/places/saved', { token });
      setPlaces(data || []);
    } catch {
      // endpoint may not exist yet
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Saved Places</h1>
        <p className="text-muted-foreground">Your bookmarked restaurants, attractions, and hidden gems.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookmarkPlus className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved places yet</h3>
            <p className="text-muted-foreground mb-4">
              Discover places and bookmark your favorites to see them here.
            </p>
            <Button onClick={() => window.location.href = '/app/discover'}>
              Start Discovering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <Card key={place.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{place.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {place.address}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Saved {new Date(place.savedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
