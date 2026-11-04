/** Public collection discovery carries saved facts only, never wallet/session data. */
export type DiscoveryWorldId = 'near-testnet' | 'robinhood-testnet';
export type DiscoverySort = 'newest' | 'longest';
export type DiscoveryStatus = 'all' | 'alive' | 'remembered';
export interface DiscoveryWorld {
  id: DiscoveryWorldId;
  label: string;
  collection: string;
  chainId?: number;
}
export interface PublicLifeSummary {
  id: string;
  owner: string;
  name: string;
  day: number;
  level: number;
  alive: boolean;
  pending: boolean;
  purseMicro: string;
  /** Rank within the full saved world, with equal levels sharing a rank. */
  rank: number;
  plantedBeds: number;
  readyBeds: number;
}
export interface PublicLifeDirectory {
  world: DiscoveryWorld;
  snapshot: {
    id: string;
    at: string;
    height: string;
    hash: string;
    complete: true;
    stale: boolean;
  };
  sort: DiscoverySort;
  status: DiscoveryStatus;
  query: string;
  total: number;
  collectionTotal: number;
  items: PublicLifeSummary[];
  nextCursor?: string;
}
