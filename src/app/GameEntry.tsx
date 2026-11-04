import { lazy, Suspense } from 'react';
import '@fontsource/press-start-2p/latin-400.css';
import '../styles.css';
import '../viewport.css';
import { selectV2Entry } from '../site/routing';

const LegacyApp = lazy(() => import('./App'));
const LifeApp = lazy(() => import('./v2/V2App'));

/** Game styles and dependencies are loaded only after entering the app. */
export default function GameEntry() {
  const query = new URLSearchParams(location.search);
  const v2 = selectV2Entry(query, import.meta.env.VITE_NEARLYHUMAN_V2 === '1');
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#182e3d' }} />}>
    {v2 ? <LifeApp /> : <LegacyApp />}
  </Suspense>;
}
