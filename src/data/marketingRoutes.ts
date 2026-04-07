import type { MetadataRoute } from 'next';

/** Public marketing paths for `sitemap.ts` — extend when you add driver marketing pages. */
export const MARKETING_PATHS: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
}[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
];
