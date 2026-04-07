/**
 * Brand social URLs — same Liftngo profiles as customer app (JSON-LD sameAs / footer).
 */
const DEFAULTS = {
  youtube: 'https://www.youtube.com/@liftngo',
  facebook: 'https://www.facebook.com/profile.php?id=61578755032262',
  x: 'https://x.com/liftngo',
  linkedin: 'https://www.linkedin.com/company/liftngo-logistics',
  instagram: 'https://www.instagram.com/liftngo_goods_transfer/',
} as const;

function pick(envVal: string | undefined, fallback: string): string {
  return typeof envVal === 'string' && envVal.startsWith('http') ? envVal : fallback;
}

export function getOrganizationSameAs(): string[] {
  return [
    pick(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, DEFAULTS.youtube),
    pick(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, DEFAULTS.facebook),
    pick(process.env.NEXT_PUBLIC_SOCIAL_X ?? process.env.NEXT_PUBLIC_SOCIAL_TWITTER, DEFAULTS.x),
    pick(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, DEFAULTS.linkedin),
    pick(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, DEFAULTS.instagram),
  ].filter((url, i, a) => a.indexOf(url) === i);
}
