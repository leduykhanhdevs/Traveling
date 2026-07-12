import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://traveling.app';

  const publicPages = [
    '', '/about', '/features', '/pricing',
    '/destinations', '/destinations/ho-chi-minh-city', '/destinations/hanoi', '/destinations/da-nang',
    '/destinations/bangkok', '/destinations/tokyo', '/destinations/seoul', '/destinations/singapore',
    '/destinations/bali', '/destinations/paris',
    '/discover', '/community',
    '/help/getting-started', '/help/account', '/help/discovery', '/help/itineraries',
    '/help/translation', '/help/budget', '/help/community', '/help/billing', '/help/privacy-security',
    '/contact', '/faq', '/privacy', '/terms', '/cookies',
    '/community-guidelines', '/accessibility', '/security',
  ];

  return publicPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1.0 : 0.8,
  }));
}
