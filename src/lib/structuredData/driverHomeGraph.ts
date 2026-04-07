import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  PROJECT_DESCRIPTION,
  LOGO_URL,
  DEFAULT_OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '@/lib/site';
import { getOrganizationSameAs } from '@/lib/social';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const DRIVER_FAQ = [
  {
    question: 'Who can drive with Liftngo?',
    answer:
      'Verified driver-partners with valid documents and a vehicle class that matches our goods lanes (2W cargo, 3W, 4W mini truck, walk-assisted handoffs where offered). Corridors include Khatu Shyam Ji hyperlocal and Delhi NCR B2B-focused routes.',
  },
  {
    question: 'How do payouts work?',
    answer:
      'Payout rules are shown in the partner app or hub: trips are goods-first and incentives emphasise completed deliveries. Exact settlement timing and methods depend on your lane and agreement.',
  },
  {
    question: 'Is Liftngo a passenger taxi app?',
    answer:
      'No. Liftngo is built for cargo and goods movement—handoffs, fares, and incentives are designed around completed deliveries, not commuter-style ratings.',
  },
] as const;

/**
 * Driver hub JSON-LD @graph: WebSite + Organization (+ FAQPage for this landing).
 */
export function buildDriverHomeGraph() {
  const sameAs = getOrganizationSameAs();

  const sharedImage = {
    '@type': 'ImageObject' as const,
    url: DEFAULT_OG_IMAGE,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
  };

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: 'Liftngo',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    description: PROJECT_DESCRIPTION,
    image: sharedImage,
  };

  if (sameAs.length > 0) organization.sameAs = sameAs;

  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en-IN',
    description: SITE_DESCRIPTION,
    publisher: { '@id': ORGANIZATION_ID },
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: DRIVER_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [website, organization, faq],
  };
}
