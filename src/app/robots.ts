import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Extend when you add authenticated driver app routes. */
const DISALLOW_PRIVATE = ['/api/', '/private/', '/_next/', '/dashboard', '/account'] as const;

const DISALLOW_FOR_SOCIAL_ONLY = ['/api/', '/private/', '/_next/'] as const;

const SOCIAL_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Pinterest',
  'Discordbot',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [...SOCIAL_USER_AGENTS],
        allow: '/',
        disallow: [...DISALLOW_FOR_SOCIAL_ONLY],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [...DISALLOW_PRIVATE],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
