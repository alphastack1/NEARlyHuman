import { deployments } from '../chain/deployments';

/** The public website enters the current game explicitly; legacy NFT URLs
 * retain their original version selector and need no redirect or rewrite. */
export const OPEN_APP_HREF = '/app?v2=1';

export type EntrySurface = 'site' | 'game';

const GAME_QUERY_KEYS = new Set([
  'v2', 'legacy', 'rooster', 'id', 'day', 'collection', 'chainId', 'networkId',
  'pending', 'requestId', 'recovery', 'resume',
]);

// Preserve wallet returns even when the callback has no explicit NFT/world.
// These are only routing markers: no value is trusted, stored or consumed here.
const WALLET_RETURN_KEYS = new Set([
  'account_id', 'accountId', 'public_key', 'publicKey', 'all_keys',
  'transactionHashes', 'errorCode', 'errorMessage', 'signature',
]);

const hasAny = (params: URLSearchParams, names: ReadonlySet<string>) => {
  for (const name of names) if (params.has(name)) return true;
  return false;
};

export function normalisePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/** Public articles remain articles even with tracking/filter query parameters.
 * Existing root links are deliberately interpreted before any public homepage. */
export function selectEntrySurface(pathname: string, query: URLSearchParams, hash = ''): EntrySurface {
  const path = normalisePath(pathname);
  if (path === '/app') return 'game';
  if (path !== '/') return 'site';
  if (hasAny(query, GAME_QUERY_KEYS) || hasAny(query, WALLET_RETURN_KEYS)) return 'game';
  const fragment = hash.replace(/^#\??/, '');
  const hashQuery = new URLSearchParams(fragment.includes('?') ? fragment.slice(fragment.indexOf('?') + 1) : fragment);
  return hasAny(hashQuery, WALLET_RETURN_KEYS) || hasAny(hashQuery, GAME_QUERY_KEYS) ? 'game' : 'site';
}

/** Keep the shipped version-selection behavior for historical NFT metadata. */
export function selectV2Entry(query: URLSearchParams, defaultV2: boolean): boolean {
  if (query.get('v2') === '1') return true;
  // Even malformed native-world links go to the current world's validator.
  if (query.has('networkId')) return true;
  const collection = query.get('collection'), chainId = query.get('chainId');
  const legacy = collection && chainId && deployments[Number(chainId)]?.address.toLowerCase() === collection.toLowerCase();
  // Bare token numbers emitted by earlier metadata still refer to that world.
  if (legacy || query.has('rooster') && !collection && !chainId) return false;
  return defaultV2 || query.has('collection');
}
