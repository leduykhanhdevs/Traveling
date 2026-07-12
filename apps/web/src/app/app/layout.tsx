'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  Globe,
  LayoutDashboard,
  Search,
  BookmarkPlus,
  Map,
  Languages,
  Wallet,
  Users,
  User,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/discover', icon: Search, label: 'Discover' },
  { href: '/app/saved', icon: BookmarkPlus, label: 'Saved Places' },
  { href: '/app/itineraries', icon: Map, label: 'Itineraries' },
  { href: '/app/translator', icon: Languages, label: 'Translator' },
  { href: '/app/budgets', icon: Wallet, label: 'Budgets' },
  { href: '/app/community', icon: Users, label: 'Community' },
  { href: '/app/profile', icon: User, label: 'Profile' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Traveling</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <link.icon className="h-4.5 w-4.5" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
