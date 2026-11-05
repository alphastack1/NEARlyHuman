import { lazy, Suspense } from 'react';
import '@fontsource/press-start-2p/latin-400.css';
import './game.css';

const GameApp = lazy(() => import('./game/GameApp'));

/** Load the current game only after entering the app. */
export default function GameEntry() {
  return <Suspense fallback={<div role="status" aria-label="Opening NEARlyHuman" style={{ position: 'fixed', inset: 0, background: '#153f3f' }}/>}><GameApp/></Suspense>;
}
