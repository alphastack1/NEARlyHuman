import { lazy, Suspense } from 'react';

const LegacyApp = lazy(() => import('./App'));
const LifeApp = lazy(() => import('./v2/V2App'));

export default function Entry() {
  const query = new URLSearchParams(location.search);
  const v2 = import.meta.env.VITE_NEARLYHUMAN_V2 === '1' || query.get('v2') === '1' || query.has('collection');
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#182e3d' }} />}>
    {v2 ? <LifeApp /> : <LegacyApp />}
  </Suspense>;
}
