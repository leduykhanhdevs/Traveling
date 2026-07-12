'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Map, Plus, Calendar, Loader2, Trash2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

type Itinerary = {
  id: string;
  destination: string;
  days: number;
  budgetRange: string;
  createdAt: string;
};

export default function ItinerariesPage() {
  const { getToken } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      const token = await getToken();
      const data = await apiClient<Itinerary[]>('/api/v1/itineraries', { token });
      setItineraries(data || []);
    } catch {
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      const token = await getToken();
      await apiClient(`/api/v1/itineraries/${id}`, { method: 'DELETE', token });
      setItineraries((prev) => prev.filter((i) => i.id !== id));
      toast({ title: 'Itinerary deleted' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete itinerary', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Itineraries</h1>
          <p className="text-muted-foreground">Plan and manage your travel itineraries.</p>
        </div>
        <Link href="/app/itineraries/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Itinerary
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      ) : itineraries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No itineraries yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI-powered travel itinerary.
            </p>
            <Link href="/app/itineraries/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Itinerary
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {itineraries.map((itin) => (
            <Card key={itin.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{itin.destination}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {itin.days} days
                      </span>
                      <span className="capitalize">{itin.budgetRange}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(itin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/app/itineraries/${itin.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(itin.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
