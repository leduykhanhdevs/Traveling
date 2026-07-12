'use client';

import { RedirectToSignIn, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, MapPin, FileText, Flag, CreditCard,
  Settings, Shield, Globe,
} from 'lucide-react';

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/destinations', icon: MapPin, label: 'Destinations' },
  { href: '/admin/content', icon: FileText, label: 'Content' },
  { href: '/admin/reports', icon: Flag, label: 'Reports' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    // TODO: Check user role from backend
    // For now, allow access (role check should be done server-side)
    setIsAdmin(true);
    setChecking(false);
  }, [isLoaded, userId]);

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return <RedirectToSignIn />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <Globe className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <nav className="p-4 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
