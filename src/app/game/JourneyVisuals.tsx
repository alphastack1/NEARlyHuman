import { useEffect, useState } from 'react';
import { Icon } from '../Icons';

export function DayFlow({ stage, complete = false }: { stage: 0 | 1 | 2; complete?: boolean }) {
  return <div className="life-day-flow" aria-label={complete ? 'Day ready' : ['Pack supplies', 'Confirm with your wallet', 'AI is preparing the day'][stage]}>
    {(['Pack', 'Wallet', 'AI'] as const).map((label, i) => <span key={label} data-state={complete || i < stage ? 'done' : i === stage ? 'current' : 'next'}><Icon name={complete || i < stage ? 'check' : i === 0 ? 'mail' : i === 1 ? 'wallet' : 'brain'} size={16}/>{label}</span>)}
  </div>;
}

export function ProcessGraphic({ stage }: { stage: 'mint' | 'wallet' | 'chain' | 'ai' | 'saving' | 'ready' | 'failed' }) {
  const icon = stage === 'ai' ? 'brain' : stage === 'ready' ? 'check' : stage === 'failed' ? 'info' : stage === 'wallet' ? 'wallet' : stage === 'mint' ? 'leaf' : 'book';
  return <div className="life-process-graphic" data-stage={stage} aria-hidden="true">
    <div className="life-process-orbit"><i/><i/><i/><i/></div><div className="life-process-core">{stage === 'chain' || stage === 'saving' ? <svg width="40" height="32" viewBox="0 0 20 16" shapeRendering="crispEdges"><path fill="currentColor" d="M0 1h8v8H0zm2 2v4h4V3zm10 4h8v8h-8zm2 2v4h4V9zM6 6h2v2h3v2h3v2h-3v-2H8V8H6z" fillRule="evenodd"/></svg> : <Icon name={icon} size={32}/>}</div>
    <div className="life-process-packets"><i/><i/><i/></div>
  </div>;
}

/** A response leaves a sealed thought, not an itinerary. The component accepts
 * only a completed count, so future choices never reach its text or ARIA. */
export function ThoughtActivity({ completed, saving }: { completed: number; saving: boolean }) {
  const count = Math.max(0, Math.min(8, Math.floor(completed)));
  if (!count) return null;
  return <div className="life-thought-activity" data-saving={saving} role="status" aria-live="polite" aria-label={`${count} ${count === 1 ? 'thought' : 'thoughts'} ready. The day is still a surprise.`}>
    <div className="life-sealed-thoughts" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} data-latest={!saving && index === count - 1} style={{ animationDelay: `${index % 2 * 80}ms` }}><svg width="22" height="24" viewBox="0 0 22 24" shapeRendering="crispEdges"><path fill="currentColor" d="M2 0h12v2h2v2h2v2h2v18H2z"/><path fill="#fff0c8" d="M4 2h9v6h5v14H4zM15 4v2h2z"/><path fill="#345d62" d="M7 11h8v2H7zM7 16h8v2H7z"/><path fill="#efbb64" d="M9 12h4v6H9z"/></svg></i>)}</div>
    <span aria-hidden="true">{saving ? 'Sealed and ready.' : 'A little mind at work.'}</span>
  </div>;
}

export function BirthReveal({ id, name, egg, rooster, explorer, transaction, onHome, onRetry, busy }: {
  id: string; name: string; egg: string; rooster?: string; explorer?: string; transaction?: string;
  onHome(): void; onRetry(): void; busy: boolean;
}) {
  const [phase, setPhase] = useState<'egg' | 'crack' | 'revealed'>('egg');
  useEffect(() => {
    if (!rooster) return;
    const crack = setTimeout(() => setPhase(current => current === 'revealed' ? current : 'crack'), 550), reveal = setTimeout(() => setPhase('revealed'), 1250);
    return () => { clearTimeout(crack); clearTimeout(reveal); };
  }, [rooster]);
  return <div className="life-birth-reveal" data-phase={phase}>
    <div className="life-birth-stage">
      <svg className="life-birth-sunburst" viewBox="0 0 120 120" aria-hidden="true"><path fill="currentColor" d="M54 0h12v30H54zM54 90h12v30H54zM0 54h30v12H0zM90 54h30v12H90zM14 22l8-8 23 23-8 8zm61 61 8-8 23 23-8 8zM14 98l23-23 8 8-23 23zm61-61 23-23 8 8-23 23z"/></svg>
      <img className="life-birth-egg" src={egg} alt=""/>
      {rooster && <img className="life-birth-rooster" src={rooster} alt={`${name}, your rooster NFT`}/>}
      <i className="life-birth-spark one"/><i className="life-birth-spark two"/><i className="life-birth-spark three"/>
    </div>
    <span className="life-nft-badge">NFT #{id}</span>
    <p className="life-birth-caption">{rooster ? phase === 'revealed' ? `${name} is yours.` : 'A little life is hatching…' : 'Opening your new NFT…'}</p>
    {rooster ? <button className="life-primary" onClick={phase === 'revealed' ? onHome : () => setPhase('revealed')}><Icon name="house" size={16}/>{phase === 'revealed' ? `Meet ${name}` : 'Open the egg'}</button> : <button className="life-primary" disabled={busy} onClick={onRetry}>{busy ? 'Opening…' : 'Open my NFT'}</button>}
    {explorer && <a className="life-text-button" href={explorer} target="_blank" rel="noreferrer">View NFT on explorer</a>}
    {!explorer && transaction && <a className="life-text-button" href={transaction} target="_blank" rel="noreferrer">View mint transaction</a>}
  </div>;
}
