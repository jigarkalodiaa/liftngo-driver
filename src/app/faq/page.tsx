import Link from 'next/link';
import { generatePageMetadata } from '@/lib/seo';
import { SEO_KEYWORDS, SITE_URL } from '@/lib/site';
import { buildDriverHomeGraph } from '@/lib/structuredData/driverHomeGraph';

const title = 'Driver FAQ';
const description =
  'Frequently asked questions for Liftngo driver partners: who can join, payouts, and how driver trips differ from passenger apps.';

export const metadata = generatePageMetadata({
  title,
  description,
  path: '/faq',
  keywords: [...SEO_KEYWORDS],
});

/** Re-use homepage FAQ entities on /faq for consistency (simpler than duplicating graph). */
function faqFragmentJsonLd() {
  const g = buildDriverHomeGraph() as { '@graph': unknown[] };
  const faq = g['@graph'].find((x) => (x as { '@type'?: string })['@type'] === 'FAQPage');
  if (!faq) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          ...(faq as object),
          '@id': `${SITE_URL}/faq#faq`,
          url: `${SITE_URL}/faq`,
        }),
      }}
    />
  );
}

const FAQ_ITEMS = [
  {
    q: 'Who can drive with Liftngo?',
    a: 'Verified partners with documents and a vehicle class that matches our goods lanes (2W cargo, 3W, 4W mini truck, walk-assisted handoffs where offered).',
  },
  {
    q: 'How do payouts work?',
    a: 'Rules appear in the partner app or hub: incentives emphasise completed goods trips. Settlement timing and methods depend on your lane and agreement.',
  },
  {
    q: 'Is this a taxi / passenger app?',
    a: 'No. Liftngo is for cargo and goods movement—pricing and incentives are built around deliveries, not commuter ratings.',
  },
];

export default function DriverFaqPage() {
  return (
    <>
      {faqFragmentJsonLd()}
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          ← Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-600">{description}</p>
        <ul className="mt-10 space-y-8">
          {FAQ_ITEMS.map((item) => (
            <li key={item.q}>
              <h2 className="text-lg font-semibold text-gray-900">{item.q}</h2>
              <p className="mt-2 text-gray-700">{item.a}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
