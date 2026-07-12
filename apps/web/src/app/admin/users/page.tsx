import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manage Users',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">User List</h3>
          <p className="text-muted-foreground">
            Connect the backend and configure database to view and manage users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
