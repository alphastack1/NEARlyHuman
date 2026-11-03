import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icons';

export function DayFlow({ stage, complete = false }: { stage: 0 | 1 | 2; complete?: boolean }) {
  return <div className="v2-day-flow" aria-label={complete ? 'Day ready' : ['Pack supplies', 'Confirm with your wallet', 'AI is preparing the day'][stage]}>
    {(['Pack', 'Wallet', 'AI'] as const).map((label, i) => <span key={label} data-state={complete || i < stage ? 'done' : i === stage ? 'current' : 'next'}><Icon name={complete || i < stage ? 'check' : i === 0 ? 'mail' : i === 1 ? 'wallet' : 'brain'} size={16}/>{label}</span>)}
  </div>;
}

export function ProcessGraphic({ stage }: { stage: 'mint' | 'wallet' | 'chain' | 'ai' | 'saving' | 'ready' | 'failed' }) {
  const icon = stage === 'ai' ? 'brain' : stage === 'ready' ? 'check' : stage === 'failed' ? 'info' : stage === 'wallet' ? 'wallet' : stage === 'mint' ? 'leaf' : 'book';
  return <div className="v2-process-graphic" data-stage={stage} aria-hidden="true">
    <div className="v2-process-orbit"><i/><i/><i/><i/></div><div className="v2-process-core">{stage === 'chain' || stage === 'saving' ? <svg width="40" height="32" viewBox="0 0 20 16" shapeRendering="crispEdges"><path fill="currentColor" d="M0 1h8v8H0zm2 2v4h4V3zm10 4h8v8h-8zm2 2v4h4V9zM6 6h2v2h3v2h3v2h-3v-2H8V8H6z" fillRule="evenodd"/></svg> : <Icon name={icon} size={32}/>}</div>
    <div className="v2-process-packets"><i/><i/><i/></div>
  </div>;
}

/** Only completed, validated replies enter this log. Polling never fabricates
 * progress, and stable reply IDs keep an old choice from animating twice. */
export function ChoiceStream({ choices, saving }: { choices: readonly { id: string; stage: 'plan' | 'routine' | 'acute' | 'focus'; label: string; slot?: number }[]; saving: boolean }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [choices.length]);
  useEffect(() => {
    const element = list.current; if (!element) return;
    const observer = new ResizeObserver(() => { element.scrollTop = element.scrollHeight; });
    observer.observe(element); return () => observer.disconnect();
  }, [!!choices.length]);
  if (!choices.length) return null;
  return <ol ref={list} className="v2-choice-stream" role="log" aria-label="Jev’s completed choices" aria-live="polite" aria-relevant="additions">
    {choices.map((choice, index) => <li key={choice.id} data-latest={!saving && index === choices.length - 1}>
      <span className="v2-choice-mark"><Icon name={choice.stage === 'plan' ? 'brain' : 'check'} size={16}/></span>
      <span><small>{choice.stage === 'plan' ? 'Day plan' : choice.stage === 'acute' ? 'Care' : choice.stage === 'focus' ? 'A little focus' : 'Routine'}</small><strong>{choice.label}</strong></span>
    </li>)}
  </ol>;
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
  return <div className="v2-birth-reveal" data-phase={phase}>
    <div className="v2-birth-stage">
      <svg className="v2-birth-sunburst" viewBox="0 0 120 120" aria-hidden="true"><path fill="currentColor" d="M54 0h12v30H54zM54 90h12v30H54zM0 54h30v12H0zM90 54h30v12H90zM14 22l8-8 23 23-8 8zm61 61 8-8 23 23-8 8zM14 98l23-23 8 8-23 23zm61-61 23-23 8 8-23 23z"/></svg>
      <img className="v2-birth-egg" src={egg} alt=""/>
      {rooster && <img className="v2-birth-rooster" src={rooster} alt={`${name}, your rooster NFT`}/>}
      <i className="v2-birth-spark one"/><i className="v2-birth-spark two"/><i className="v2-birth-spark three"/>
    </div>
    <span className="v2-nft-badge">NFT #{id}</span>
    <p className="v2-birth-caption">{rooster ? phase === 'revealed' ? `${name} is yours.` : 'A little life is hatching…' : 'Opening your new NFT…'}</p>
    {rooster ? <button className="v2-primary" onClick={phase === 'revealed' ? onHome : () => setPhase('revealed')}><Icon name="house" size={16}/>{phase === 'revealed' ? `Meet ${name}` : 'Open the egg'}</button> : <button className="v2-primary" disabled={busy} onClick={onRetry}>{busy ? 'Opening…' : 'Open my NFT'}</button>}
    {explorer && <a className="v2-text-button" href={explorer} target="_blank" rel="noreferrer">View NFT on explorer</a>}
    {!explorer && transaction && <a className="v2-text-button" href={transaction} target="_blank" rel="noreferrer">View mint transaction</a>}
  </div>;
}
