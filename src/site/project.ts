import { ACTIVE_ROBINHOOD as robinhood, ACTIVE_NEAR as near, ORIGINAL_ROBINHOOD as originalRobinhood } from '../chain/deployment-catalog';
import type { DiscoveryWorldId } from '../chain/discovery-types';

const rhParams = new URLSearchParams({ entry: 'app', chainId: String(robinhood.runtime.chainId), collection: robinhood.runtime.collection });
const nearParams = new URLSearchParams({ entry: 'app', networkId: near.runtime.networkId, collection: near.runtime.collection });
const sourceUrl = 'https://github.com/alphastack1/NEARlyHuman';
const originalRhParams = new URLSearchParams({ entry: 'app', chainId: String(originalRobinhood.runtime.chainId), collection: originalRobinhood.runtime.collection });

export interface ProjectWorld {
  id: DiscoveryWorldId; name: string; shortName: string; wallet: string; currency: string;
  collection: string; token: string; explorer: string; tokenExplorer: string; sourceHref: string; appHref: string;
  generation: number; archived: boolean;
}
const originalRhWorld: ProjectWorld = {
  id: 'robinhood-testnet', name: 'Robinhood Testnet', shortName: 'Robinhood', wallet: 'Rabby / EVM wallet', currency: 'test ETH',
  collection: originalRobinhood.runtime.collection, token: originalRobinhood.token,
  explorer: `https://explorer.testnet.chain.robinhood.com/address/${originalRobinhood.runtime.collection}`,
  tokenExplorer: `https://explorer.testnet.chain.robinhood.com/address/${originalRobinhood.token}`,
  sourceHref: '/source/files/contracts/v2/NEARlyHumanV2.sol.txt', appHref: `/app?${originalRhParams}`, generation: 2, archived: true,
};

const imageSet = (name: string, widths: readonly number[], format: 'avif' | 'webp') => widths.map(width => `/site/${name}-${width}.${format} ${width}w`).join(', ');
/** Shared by the rendered pictures and build-time early fetch hints. */
export const SITE_IMAGES = {
  hero: {
    avifDefault: '/site/hero-home-640.avif',
    avifSrcSet: imageSet('hero-home', [640, 960, 1448], 'avif'),
    webpSrcSet: imageSet('hero-home', [640, 960, 1448], 'webp'),
    fallback: '/site/hero-home-960.webp',
    sizes: '(max-width: 360px) calc(100vw - 64px), (max-width: 640px) calc(100vw - 78px), (max-width: 999px) calc(53.1vw - 82px), (max-height: 650px) 418px, (max-width: 1150px) and (max-height: 850px) min(578px, calc(57.6vw - 87px)), (max-height: 850px) min(578px, calc(57.6vw - 103px)), (max-width: 1150px) calc(57.6vw - 87px), (max-width: 1499px) calc(57.6vw - 103px), 730px',
    smallSizes: '(max-width: 640px) calc(100vw - 72px), (max-width: 999px) 50vw, 700px',
  },
  handbook: {
    avifSrcSet: imageSet('handbook', [320, 560, 768], 'avif'),
    webpSrcSet: imageSet('handbook', [320, 560, 768], 'webp'),
    fallback: '/site/handbook-560.webp',
    sizes: '(max-width: 850px) 205px, 280px',
  },
} as const;
export const PROJECT = {
  name: 'NEARlyHuman', siteUrl: 'https://nearlyhuman.netlify.app', sourceUrl,
  sourceArchive: '/source/nearlyhuman-contracts.zip',
  appHref: '/app?entry=app',
  exampleHref: `/app?${originalRhParams}&rooster=1`,
  exampleImage: `/api/evm/nft/1/image.svg?chainId=${originalRobinhood.runtime.chainId}&collection=${originalRobinhood.runtime.collection}`,
  worlds: [
    { id: 'near-testnet', name: 'NEAR Testnet', shortName: 'NEAR', wallet: 'Meteor', currency: 'test NEAR',
      collection: near.runtime.collection, token: near.runtime.collection,
      explorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}`,
      tokenExplorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}`,
      sourceHref: '/source/near/lib.rs.txt', appHref: `/app?${nearParams}`, generation: 3, archived: false },
    { id: 'robinhood-testnet', name: 'Robinhood Testnet', shortName: 'Robinhood', wallet: 'Rabby / EVM wallet', currency: 'test ETH',
      collection: robinhood.runtime.collection, token: robinhood.token,
      explorer: `https://explorer.testnet.chain.robinhood.com/address/${robinhood.runtime.collection}`,
      tokenExplorer: `https://explorer.testnet.chain.robinhood.com/address/${robinhood.token}`,
      sourceHref: '/source/evm/Game.sol.txt', appHref: `/app?${rhParams}`, generation: 3, archived: false },
  ] satisfies ProjectWorld[],
  archivedWorlds: [originalRhWorld] as readonly ProjectWorld[],
} as const;
