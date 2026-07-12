# Web Application Guide

## Getting Started

```bash
npm run dev --workspace=@traveling/web
```

The app runs at http://localhost:3000

## Route Structure

```text
/                           Home (public)
/about                      About page
/features                   Features overview
/pricing                    Pricing plans
/destinations               Destination listing
/destinations/[slug]        Destination detail
/discover                   Discovery page
/community                  Community feed
/help/*                     Help center pages
/contact, /faq, /privacy, /terms, etc.

/sign-in                    Sign in (Clerk)
/sign-up                    Sign up (Clerk)
/onboarding                 Post-signup welcome

/app/dashboard              User dashboard
/app/discover               Authenticated discovery
/app/saved                  Saved places
/app/itineraries            Itinerary list
/app/itineraries/new        Create itinerary
/app/itineraries/[id]       View itinerary
/app/translator             Translation center
/app/budgets                Budget list
/app/budgets/[id]           Budget detail
/app/community              Community feed
/app/profile                User profile
/app/settings               Settings

/admin                      Admin dashboard
/admin/users                User management
/admin/destinations         Destination management
/admin/content              Content management
/admin/reports              Reports moderation
/admin/subscriptions        Subscription management
/admin/settings             Admin settings
```

## Key Components

- `Navbar` — Public site navigation with auth state
- `Footer` — Public site footer
- `Button`, `Card`, `Input`, `Badge`, etc. — UI components (shadcn/ui style)

## API Integration

The web app calls the Express backend at `NEXT_PUBLIC_API_URL`. All authenticated requests include the Clerk JWT token.

```typescript
import { apiClient } from '@/lib/api-client';

const data = await apiClient('/api/v1/discover', {
  method: 'POST',
  token: await getToken(),
  body: JSON.stringify({ query: 'restaurants', lat: 10.7, lng: 106.7 }),
});
```

## Authentication Flow

1. User visits `/sign-up` or `/sign-in`
2. Clerk handles authentication
3. On success, redirects to `/onboarding` (new users) or `/app/dashboard`
4. Protected routes use Clerk middleware
5. API calls include JWT from `getToken()`

## Styling

- Tailwind CSS with custom theme
- CSS variables for colors (light/dark mode)
- Components in `src/components/ui/`

## Internationalization

- `next-intl` for i18n (Vietnamese + English)
- Language switcher in navbar
- Locale-aware routing

## Adding New Pages

1. Create page file in appropriate route group
2. Add metadata export for SEO
3. Use existing UI components
4. For authenticated pages, use `/app/` route group
5. For admin pages, use `/admin/` route group
