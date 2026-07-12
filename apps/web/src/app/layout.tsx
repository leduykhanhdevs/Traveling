import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Traveling — Discover, Plan & Explore the World',
    template: '%s | Traveling',
  },
  description:
    'Traveling helps you discover places, plan better trips, overcome language barriers, manage travel budgets, and share authentic experiences in one connected platform.',
  keywords: [
    'travel',
    'travel planning',
    'itinerary',
    'translation',
    'budget',
    'discover',
    'travel app',
    'du lịch',
  ],
  authors: [{ name: 'Traveling' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://traveling.app',
    siteName: 'Traveling',
    title: 'Traveling — Discover, Plan & Explore the World',
    description:
      'Discover places, plan trips, translate languages, and manage budgets with Traveling.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traveling — Discover, Plan & Explore the World',
    description:
      'Discover places, plan trips, translate languages, and manage budgets with Traveling.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
