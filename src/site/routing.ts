
/** Public entry links open the current game. Historical world scope stays exact. */
export const OPEN_APP_HREF = '/app?entry=app';

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

/** A number alone cannot identify a life across collections. Wallet returns
 * keep their exact pending context; old bare NFT links open the public chooser. */
export function needsLifeScope(query: URLSearchParams, hash = ''): boolean {
  const fragment = hash.replace(/^#\??/, '');
  const hashQuery = new URLSearchParams(fragment.includes('?') ? fragment.slice(fragment.indexOf('?') + 1) : fragment);
  return (query.has('rooster') || query.has('id') || hashQuery.has('rooster') || hashQuery.has('id'))
    && !['collection', 'chainId', 'networkId'].some(key => query.has(key) || hashQuery.has(key))
    && !['pending', 'requestId', 'recovery', 'resume'].some(key => query.has(key) || hashQuery.has(key))
    && !hasAny(query, WALLET_RETURN_KEYS) && !hasAny(hashQuery, WALLET_RETURN_KEYS);
}
