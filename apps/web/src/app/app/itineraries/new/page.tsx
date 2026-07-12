'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toaster';

const budgetOptions = ['budget', 'midrange', 'premium'] as const;
const styleOptions = ['local', 'family', 'adventure', 'luxury', 'budget', 'culture'] as const;

export default function NewItineraryPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budgetRange, setBudgetRange] = useState<string>('midrange');
  const [travelStyle, setTravelStyle] = useState<string>('local');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiClient<any>('/api/v1/itineraries/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ destination: destination.trim(), days, budgetRange, travelStyle }),
      });
      toast({ title: 'Itinerary created!' });
      router.push(`/app/itineraries/${data.id || data.itinerary?.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to generate itinerary.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Create Itinerary</h1>
        <p className="text-muted-foreground">Let AI plan your perfect trip.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Destination</label>
              <Input
                placeholder="e.g. Ho Chi Minh City, Tokyo, Paris"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of Days</label>
              <Input
                type="number"
                min={1}
                max={21}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Budget Range</label>
              <div className="flex gap-2">
                {budgetOptions.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={budgetRange === opt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBudgetRange(opt)}
                    className="capitalize"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Travel Style</label>
              <div className="flex gap-2 flex-wrap">
                {styleOptions.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={travelStyle === opt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTravelStyle(opt)}
                    className="capitalize"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Itinerary
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
