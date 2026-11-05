import { lazy, Suspense } from 'react';
import { needsLifeScope, normalisePath, selectEntrySurface } from '../site/routing';
import '../ui-theme.css';

const GameEntry = lazy(() => import('./GameEntry'));
const Site = lazy(() => import('../site/Site'));


export default function Entry() {
  let query = new URLSearchParams(location.search);
  if (['/', '/app'].includes(normalisePath(location.pathname)) && needsLifeScope(query, location.hash)) { history.replaceState(history.state, '', '/explore'); query = new URLSearchParams(); }
  const surface = selectEntrySurface(location.pathname, query, location.hash);
  document.documentElement.dataset.surface = surface;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface === 'game' ? '#153f3f' : '#fff8e8');
  return <Suspense fallback={<div role="status" aria-label="Opening NEARlyHuman" style={{ minHeight: '100dvh', background: surface === 'game' ? 'var(--nh-teal)' : 'var(--nh-cream)' }} />}>
    {surface === 'game' ? <GameEntry /> : <Site />}
  </Suspense>;
}
