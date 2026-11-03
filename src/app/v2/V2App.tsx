import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { V2ApiError, v2Api } from '../v2-api';
import type { V2PublicLife, V2World } from '../../v2/public';
import { filmPacket, type V2FilmPacket } from '../../v2/presentation';
import V2Player from './V2Player';
import V2Journey from './V2Journey';
import { LifeSoundProvider } from './LifeSound';
import { Icon } from '../Icons';
import '../v2Playback.css';

export interface V2AppProps {
  initialPacket?: V2FilmPacket;
  initialLife?: V2PublicLife;
  name?: string;
  onPrepare?: () => void;
  onHatch?: () => void;
  onPurse?: () => void;
  onExit?: () => void;
}
declare global { interface Window { __NH_V2_PREVIEW?: { packet: unknown; life?: V2PublicLife; name?: string } } }

export default function V2App(props: V2AppProps) {
  const preview = import.meta.env.DEV ? window.__NH_V2_PREVIEW : undefined;
  return <LifeSoundProvider>{props.initialPacket !== undefined || props.initialLife !== undefined || preview ? <V2Diagnostic {...props}/> : <V2Journey/>}</LifeSoundProvider>;
}
function V2Diagnostic(props: V2AppProps) {
  // Browser diagnostics are deliberately excluded from production builds.
  const preview = import.meta.env.DEV ? window.__NH_V2_PREVIEW : undefined;
  const controlled = props.initialPacket !== undefined || props.initialLife !== undefined;
  const [packet, setPacket] = useState<V2FilmPacket | undefined>(filmPacket(preview?.packet));
  const [life, setLife] = useState<V2PublicLife | undefined>(preview?.life);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (controlled || packet) return;
    let active = true;
    const search = new URLSearchParams(location.search);
    const id = search.get('rooster') || search.get('id');
    if (!id) { setError('Which little life shall we visit?'); return; }
    const collection = search.get('collection'), chainId = Number(search.get('chainId'));
    const world: V2World | undefined = collection && /^0x[0-9a-fA-F]{40}$/.test(collection) && chainId > 0 ? { chainId, collection: collection as Address } : undefined;
    const day = Number(search.get('day')) || undefined;
    setError('');
    void v2Api.replay(id, day, world).then(data => {
      if (!active) return;
      const valid = filmPacket(data.packet);
      if (!valid) throw Error('This day is still finding its way home.');
      setLife(data.life); setPacket(valid);
    }).catch(async e => {
      // A new life, or a saved life without its film, is still a real home to visit.
      if (!day && e instanceof V2ApiError && (e.code === 'not_found' || e.code === 'replay_unavailable')) {
        try { const saved = await v2Api.life(id, world); if (active) { setLife(saved.life); setError(''); } return; } catch { /* Keep the original precise read failure. */ }
      }
      if (active) setError(e instanceof Error ? e.message : 'Could not reach this home.');
    });
    return () => { active = false; };
  }, [controlled, packet, retry]);
  const shownPacket = controlled ? props.initialPacket : packet;
  const shownLife = controlled ? props.initialLife : life;
  const filmIdentity = shownPacket?.requestId || (shownPacket ? `${shownPacket.result.state.seed}:${shownPacket.result.state.day}` : 'home');
  const identity = shownLife ? `${shownLife.chainId}:${shownLife.collection}:${shownLife.id}:${filmIdentity}` : filmIdentity;
  if (shownPacket || shownLife) return <V2Player key={identity} {...props} packet={shownPacket} life={shownLife} name={props.name || preview?.name}/>;
  return <main className="v2-stage v2-opening"><section className="v2-opening-card v2-pixel-frame"><Icon name="house" size={36}/><h1>NEARlyHuman</h1><p>{error || 'Opening a little home…'}</p>{error && <button className="v2-primary" onClick={() => props.onExit ? props.onExit() : setRetry(v => v + 1)}>{props.onExit ? 'Back home' : 'Try again'}</button>}</section></main>;
}
