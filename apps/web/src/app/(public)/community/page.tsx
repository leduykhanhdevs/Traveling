import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MessageSquare, PenSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the Traveling community — share experiences, read reviews, and connect with fellow travelers.',
};

export default function CommunityPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Travel Community</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Share your travel experiences, discover hidden gems from fellow travelers, and connect with a community that loves exploring.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Join the Conversation</h3>
          <p className="text-muted-foreground mb-6">
            Sign in to view community posts, share your experiences, write reviews, and connect with travelers worldwide.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/sign-up">
              <Button>Join the Community</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
        <Card>
          <CardContent className="p-6 text-center">
            <PenSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Share Experiences</h3>
            <p className="text-sm text-muted-foreground">Post travel stories with photos and location context.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Real Reviews</h3>
            <p className="text-sm text-muted-foreground">Read and write honest reviews from real travelers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Connect</h3>
            <p className="text-sm text-muted-foreground">Follow travelers with similar interests and styles.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
