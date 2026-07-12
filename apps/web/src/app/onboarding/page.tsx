import { auth, currentUser, redirectToSignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Traveling! 🎉</h1>
          <p className="text-muted-foreground mb-8">
            Your account is ready. Start exploring destinations, planning itineraries, and connecting with the travel community.
          </p>
          <div className="space-y-3">
            <Link href="/app/dashboard" className="block">
              <Button className="w-full gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/discover" className="block">
              <Button variant="outline" className="w-full">
                Start Discovering
              </Button>
            </Link>
            <Link href="/app/itineraries/new" className="block">
              <Button variant="outline" className="w-full">
                Plan Your First Trip
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
