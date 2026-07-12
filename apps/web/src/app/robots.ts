import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/features', '/pricing', '/destinations', '/discover', '/help', '/privacy', '/terms'],
        disallow: ['/app/', '/admin/', '/api/', '/sign-in', '/sign-up', '/onboarding'],
      },
    ],
    sitemap: 'https://traveling.app/sitemap.xml',
  };
}
