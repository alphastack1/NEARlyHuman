import { lazy, Suspense } from 'react';
import { deployments } from '../chain/deployments';

const LegacyApp = lazy(() => import('./App'));
const LifeApp = lazy(() => import('./v2/V2App'));

export function selectV2Entry(query: URLSearchParams, defaultV2: boolean) {
  if (query.get('v2') === '1') return true;
  // An explicit native-world link must reach the V2 world validator, including
  // malformed links. Never reinterpret its token number as a legacy EVM NFT.
  if (query.has('networkId')) return true;
  const collection = query.get('collection'), chainId = query.get('chainId');
  const legacy = collection && chainId && deployments[Number(chainId)]?.address.toLowerCase() === collection.toLowerCase();
  // Earlier NFT metadata emitted bare token numbers. Those links must retain
  // their original world rather than opening an unrelated new collection ID.
  if (legacy || query.has('rooster') && !collection && !chainId) return false;
  return defaultV2 || query.has('collection');
}

export default function Entry() {
  const query = new URLSearchParams(location.search);
  const v2 = selectV2Entry(query, import.meta.env.VITE_NEARLYHUMAN_V2 === '1');
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#182e3d' }} />}>
    {v2 ? <LifeApp /> : <LegacyApp />}
  </Suspense>;
}
