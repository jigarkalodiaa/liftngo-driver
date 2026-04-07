import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { MARKETING_PATHS } from '@/data/marketingRoutes';

const SITE = SITE_URL.replace(/\/$/, '');

function entry(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'],
): MetadataRoute.Sitemap[0] {
  return {
    url: `${SITE}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

/** Same pattern as customer app — driven by `src/data/marketingRoutes.ts`. */
export default function sitemap(): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];

  for (const row of MARKETING_PATHS) {
    const normalized = row.path === '' ? '/' : row.path;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(entry(normalized === '/' ? '/' : normalized, row.priority, row.changeFrequency));
  }

  return out;
}
