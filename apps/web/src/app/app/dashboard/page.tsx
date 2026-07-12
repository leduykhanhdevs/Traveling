'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Map,
  Search,
  BookmarkPlus,
  Wallet,
  Languages,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const quickActions = [
  { icon: Search, label: 'Discover Places', href: '/app/discover', color: 'text-blue-500' },
  { icon: Map, label: 'Plan Itinerary', href: '/app/itineraries/new', color: 'text-green-500' },
  { icon: Languages, label: 'Translate', href: '/app/translator', color: 'text-purple-500' },
  { icon: Wallet, label: 'Track Budget', href: '/app/budgets', color: 'text-orange-500' },
  { icon: BookmarkPlus, label: 'Saved Places', href: '/app/saved', color: 'text-pink-500' },
  { icon: Users, label: 'Community', href: '/app/community', color: 'text-cyan-500' },
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {isLoaded ? (
            <>Welcome back, {user?.firstName || 'Traveler'} 👋</>
          ) : (
            <Skeleton className="h-9 w-64" />
          )}
        </h1>
        <p className="text-muted-foreground">
          Here's your travel dashboard. What would you like to do today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <action.icon className={`h-8 w-8 mx-auto mb-2 ${action.color}`} />
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Itineraries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              Upcoming Itineraries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Map className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No upcoming itineraries</p>
              <Link href="/app/itineraries/new">
                <Button size="sm" variant="outline" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Plan a Trip
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Searches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No recent searches</p>
              <Link href="/app/discover">
                <Button size="sm" variant="outline" className="gap-1">
                  Start Discovering
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Saved Places */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-primary" />
              Saved Places
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <BookmarkPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No saved places yet</p>
              <Link href="/app/discover">
                <Button size="sm" variant="outline" className="gap-1">
                  Discover & Save
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No active budgets</p>
              <Link href="/app/budgets">
                <Button size="sm" variant="outline" className="gap-1">
                  Create Budget
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Translations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              Translations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Languages className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No translations yet</p>
              <Link href="/app/translator">
                <Button size="sm" variant="outline" className="gap-1">
                  Translate Text
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Community */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Join the conversation</p>
              <Link href="/app/community">
                <Button size="sm" variant="outline" className="gap-1">
                  View Community
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
