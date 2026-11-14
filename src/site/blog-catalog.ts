export const BLOG_PATH = '/blog';
export const BLOG_DESCRIPTION = 'Notes on how we build NEARlyHuman, with interactive examples from the game.';

export const JEV_POST = {
  pathname: '/blog/how-nearlyhuman-uses-jev',
  title: 'How NEARlyHuman uses Jev',
  description: 'Follow one action ID from a real Jev request to the result in Fern’s garden, then explore all five calls from her day on NEAR Testnet.',
  image: {
    href: '/site/blog/jev/fern-order-journal.webp',
    width: 1200,
    height: 675,
    alt: 'A pixel art journal with a pantry tray, an order slip and a stamped receipt',
  },
  socialImage: '/site/blog/jev/social-card.jpg',
} as const;

export function isBlogPath(pathname: string): boolean {
  return pathname === BLOG_PATH || pathname.startsWith(`${BLOG_PATH}/`);
}
