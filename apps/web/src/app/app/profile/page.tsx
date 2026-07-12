'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Globe, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Avatar" className="h-16 w-16 rounded-full" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input value={user?.firstName || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input value={user?.lastName || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={user?.primaryEmailAddress?.emailAddress || ''} readOnly />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Profile information is managed through Clerk. Update your name, email, or avatar in your Clerk account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
