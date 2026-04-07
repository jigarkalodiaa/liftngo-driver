/**
 * Driver journey site — same env pattern as customer app (`NEXT_PUBLIC_SITE_URL`).
 * Deploy on a subdomain (e.g. drivers.goliftngo.com) with its own metadata.
 */
function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

export const SITE_URL = stripTrailingSlashes(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://drivers.goliftngo.com',
);

/** Display name for driver-facing product (differs from customer “Liftngo” alone when useful). */
export const SITE_NAME = 'Liftngo Drivers';

export const FAVICON_PATH = '/favicon.png';
export const LOGO_PATH = '/logo-liftngo.png';
export const LOGO_URL = `${SITE_URL}${LOGO_PATH}`;

export const META_TITLE = 'Liftngo Drivers | Partner for goods delivery & cargo trips';

export const SITE_DESCRIPTION =
  'Drive with Liftngo: transparent payouts, goods-first trips, and partner support in Khatu Shyam Ji and Delhi NCR. Apply or sign in to the driver hub.';

export const SHORT_DESCRIPTION =
  'Driver partner hub for Liftngo — cargo and hyperlocal goods trips with clear fares and completion-based incentives.';

export const OG_TITLE = 'Liftngo Drivers — partner hub for delivery & cargo';

export const OG_DESCRIPTION =
  'Join Liftngo’s driver network for goods transport. Hyperlocal and B2B lanes with upfront trip context and partner support.';

export const TWITTER_TITLE = OG_TITLE;
export const TWITTER_DESCRIPTION = OG_DESCRIPTION;

export const SITE_TAGLINE = 'Drive goods. Earn with clarity.';

export const PROJECT_DESCRIPTION =
  'Liftngo Drivers is the partner-facing surface for verified driver-partners delivering goods for Liftngo—focused on Khatu Shyam Ji hyperlocal lanes and Delhi NCR B2B corridors. The product emphasises transparent payouts, completion-based incentives, and cargo-first workflows rather than passenger ride-hailing patterns.';

export const SEO_KEYWORDS = [
  'liftngo driver',
  'goods delivery driver partner',
  'cargo driver india',
  'hyperlocal driver khatu',
  'delivery partner noida',
  'three wheeler cargo driver',
  'mini truck partner delhi ncr',
  'driver app logistics',
];

export const OG_IMAGE_PATH = '/og-image.jpg';
export const OG_IMAGE_CACHE_VERSION = '1';
export const OG_IMAGE_WIDTH = 1024;
export const OG_IMAGE_HEIGHT = 682;

export const OG_IMAGE_ALT =
  'Liftngo Drivers — partner logistics and goods delivery in India';

export const DEFAULT_OG_IMAGE = `${SITE_URL}${OG_IMAGE_PATH}?v=${OG_IMAGE_CACHE_VERSION}`;

export function absoluteShareImageUrl(imagePathOrUrl: string): string {
  if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
    return /[?&]v=/.test(imagePathOrUrl)
      ? imagePathOrUrl
      : `${imagePathOrUrl}${imagePathOrUrl.includes('?') ? '&' : '?'}v=${OG_IMAGE_CACHE_VERSION}`;
  }
  const path = imagePathOrUrl.startsWith('/') ? imagePathOrUrl : `/${imagePathOrUrl}`;
  const base = `${SITE_URL}${path}`;
  return /[?&]v=/.test(base) ? base : `${base}${base.includes('?') ? '&' : '?'}v=${OG_IMAGE_CACHE_VERSION}`;
}
