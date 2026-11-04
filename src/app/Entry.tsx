import { lazy, Suspense } from 'react';
import { selectEntrySurface } from '../site/routing';

const GameEntry = lazy(() => import('./GameEntry'));
const Site = lazy(() => import('../site/Site'));

export { selectV2Entry } from '../site/routing';

export default function Entry() {
  const query = new URLSearchParams(location.search);
  const surface = selectEntrySurface(location.pathname, query, location.hash);
  document.documentElement.dataset.surface = surface;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface === 'game' ? '#172c3d' : '#fff6df');
  return <Suspense fallback={<div role="status" aria-label="Opening NEARlyHuman" style={{ minHeight: '100dvh', background: surface === 'game' ? '#182e3d' : '#fff6df' }} />}>
    {surface === 'game' ? <GameEntry /> : <Site />}
  </Suspense>;
}
