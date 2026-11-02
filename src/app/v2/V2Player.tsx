import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../Icons';
import { createV2WorldRenderer, type V2WorldController } from '../../game/v2';
import type { V2PublicLife } from '../../v2/public';
import type { Receipt, State } from '../../v2/types';
import { filmBeats, inspectDetail, quietInterlude, receiptNote, receiptTitle, type Inspection, type V2FilmPacket } from '../../v2/presentation';
import '../v2Playback.css';

interface Props { packet?: V2FilmPacket; life?: V2PublicLife; name?: string; onPrepare?: () => void; onHatch?: () => void; onPurse?: () => void; onExit?: () => void }
const NEED_ICONS: IconName[] = ['heart', 'food', 'water', 'energy', 'morale'];
const NEED_LABELS = ['Health', 'Food', 'Water', 'Energy', 'Mood'];
const NEED_COLORS = ['#ef6c65', '#e6b46a', '#5db6df', '#f3d45e', '#a0bd72'];

export default function V2Player({ packet, life, name, onPrepare, onHatch, onPurse, onExit }: Props) {
  const receipts = packet?.result.receipts || [];
  const initial = receipts[0]?.before || packet?.result.state || life!.state;
  const savedHome = !packet;
  const [snapshot, setSnapshot] = useState<State>(initial);
  const [index, setIndex] = useState(-1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [inFlight, setInFlight] = useState<{ receipt: Receipt; impacted: boolean }>();
  const [inspect, setInspect] = useState<Inspection>();
  const [error, setError] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLElement>(null), bottom = useRef<HTMLElement>(null);
  const renderer = useRef<V2WorldController | undefined>(undefined);
  const generation = useRef(0), pausedRef = useRef(false);
  const running = useRef(false), activeEnd = useRef(-1);
  const roosterName = life?.name || name || 'NEARlyHuman';
  const targetDay = receipts[0]?.snapshot.day || packet?.result.state.day || life!.state.day;
  const beats = filmBeats(receipts);
  const current = receipts.slice(0, index + 1).reverse().find(r => !quietInterlude(r));
  const approaching = inFlight && !inFlight.impacted && !quietInterlude(inFlight.receipt) ? inFlight.receipt : undefined;
  const mainDone = receipts.slice(0, index + 1).some(r => r.role === 'main' && r.success);
  const detail = inspect ? inspectDetail(inspect, snapshot) : undefined;
  const title = savedHome ? snapshot.alive ? `${roosterName}, at home.` : 'A little life, remembered.' : !started ? `A day with ${roosterName}.` : complete ? snapshot.alive ? 'A little day, well lived.' : 'A little life, remembered.' : approaching ? receiptTitle(approaching) : current ? receiptTitle(current) : 'A new morning.';
  const note = complete ? snapshot.alive ? `Day ${targetDay} · Level ${packet?.result.state.level}` : '' : approaching ? '' : current ? receiptNote(current) : '';
  const prepareAction = (complete || savedHome) && !!onPrepare && snapshot.alive;
  const hatchAction = (complete || savedHome) && !prepareAction && !!onHatch;
  const primaryLabel = !ready ? 'Opening home…' : error ? 'Try again' : prepareAction ? 'Prepare tomorrow' : hatchAction ? 'Hatch your own' : savedHome ? 'Back home' : complete ? 'Watch again' : 'Watch day';

  function pause(value: boolean) { pausedRef.current = value; setPaused(value); renderer.current?.setPaused(value); }
  function inspectObject(target: Inspection) { pause(true); setInspect(target); }
  function closeInspect() { setInspect(undefined); }

  useEffect(() => {
    setReady(false); setError(false); setStarted(false); setComplete(false); setIndex(-1); setSnapshot(initial); setInFlight(undefined);
    const controller = createV2WorldRenderer(host.current!, { state: initial, onInspect: inspectObject, onMotion: ({ traveling }: { traveling: boolean }) => setTraveling(traveling) });
    renderer.current = controller;
    controller.ready.then(() => setReady(true)).catch(() => setError(true));
    return () => { generation.current++; controller.destroy(); renderer.current = undefined; };
  }, [packet, life?.id, savedHome ? life?.revision : undefined]);

  useLayoutEffect(() => {
    if (!ready || !host.current) return;
    const update = () => {
      const field = host.current!.getBoundingClientRect();
      renderer.current?.setViewportInsets(top.current ? top.current.getBoundingClientRect().bottom - field.top : 0, bottom.current ? field.bottom - bottom.current.getBoundingClientRect().top : 0);
      renderer.current?.resize();
    };
    const observer = new ResizeObserver(update);
    if (top.current) observer.observe(top.current);
    if (bottom.current) observer.observe(bottom.current);
    observer.observe(host.current); update();
    return () => observer.disconnect();
  }, [ready, started, complete, inspect]);

  async function run(from = 0) {
    if (!packet || !receipts.length) return;
    const id = ++generation.current;
    setInspect(undefined); setStarted(true); setComplete(false); pause(false);
    const start = Math.max(0, Math.min(receipts.length - 1, from));
    running.current = true;
    renderer.current?.setState(start ? receipts[start - 1]!.snapshot : initial, { history: receipts.slice(0, start), slot: start ? receipts[start - 1]!.slot : 0 });
    setSnapshot(start ? receipts[start - 1]!.snapshot : initial); setIndex(start - 1);
    try {
      for (const beat of beats) {
        if (beat.end < start) continue;
        while (pausedRef.current && generation.current === id) await new Promise(r => setTimeout(r, 80));
        if (generation.current !== id) return;
        activeEnd.current = beat.end;
        setInFlight({ receipt: beat.receipt, impacted: false });
        await renderer.current?.playReceipt(beat.receipt, { duration: beat.duration, onImpact: () => {
          if (generation.current !== id) return;
          setIndex(beat.end); setSnapshot(beat.receipt.snapshot); setInFlight({ receipt: beat.receipt, impacted: true });
        } });
        if (generation.current !== id) return;
      }
      running.current = false; setSnapshot(packet.result.state); setIndex(receipts.length - 1); setComplete(true); setInFlight(undefined); pause(false);
    } catch { if (generation.current === id) setError(true); }
  }
  function seek(value: number) {
    generation.current++; running.current = false; pause(true); setStarted(true); setComplete(false); setInspect(undefined); setInFlight(undefined);
    const at = Math.min(receipts.length - 1, Math.max(-1, value));
    const state = at < 0 ? initial : receipts[at]!.snapshot;
    renderer.current?.setState(state, { history: receipts.slice(0, at + 1), slot: at < 0 ? 0 : receipts[at]!.slot }); setSnapshot(state); setIndex(at);
  }
  function togglePlayback() {
    if (pausedRef.current) { if (running.current) pause(false); else void run(index + 1); } else pause(true);
  }
  function skipBeat() {
    const next = beats.find(b => b.start > Math.max(index, activeEnd.current) && b.receipt.role !== 'interlude');
    void run(next?.start ?? receipts.length - 1);
  }
  function primaryAction() {
    setError(false);
    if (prepareAction) onPrepare?.();
    else if (hatchAction) onHatch?.();
    else if (savedHome) onExit ? onExit() : location.assign('/');
    else void run(0);
  }

  return <main className="v2-stage" aria-label={`${roosterName}'s home`}>
    <div className="v2-world" ref={host}/>
    <header className="v2-hud v2-pixel-frame" ref={top}>
      <div className="v2-identity">
        <div className="v2-name">{onExit && <button className="v2-icon-button v2-back" onClick={onExit} aria-label="Back"><Icon name="back" size={13}/></button>}<strong>{roosterName}</strong><span>LV{String(snapshot.level).padStart(2, '0')}</span></div>
        <span className="v2-day">DAY {String(targetDay).padStart(2, '0')}</span>
      </div>
      <div className="v2-needs">{NEED_ICONS.map((icon, i) => <div className="v2-need" key={icon} role="meter" aria-label={NEED_LABELS[i]} aria-valuenow={Math.round(snapshot.needs[i]! / 100)} aria-valuemin={0} aria-valuemax={100} title={`${NEED_LABELS[i]} ${Math.round(snapshot.needs[i]! / 100)}%`}>
        <Icon name={icon} size={18} color={NEED_COLORS[i]}/><span className="v2-pips">{[0, 1, 2, 3, 4].map(p => <i key={p} style={{ backgroundColor: snapshot.needs[i]! > p * 2000 ? NEED_COLORS[i] : undefined }}/>)}</span>
      </div>)}</div>
      {packet?.dailyPlan?.mainLabel && !complete && <div className={`v2-intention${mainDone ? ' v2-intention-done' : ''}`}><Icon name={mainDone ? 'check' : 'leaf'} size={11}/><span>{packet.dailyPlan.mainLabel}</span></div>}
      {ready && started && !complete && !inspect && <button className="v2-follow v2-icon-button" onClick={() => renderer.current?.followActor()} aria-label="Follow rooster"><Icon name="house" size={16}/></button>}
    </header>

    <footer className={`v2-dock${inspect ? ' v2-dock-inspect' : ''}`} ref={bottom}>
      {detail ? <section className="v2-inspect v2-pixel-frame">
        <div className="v2-inspect-heading"><h2>{detail.title}</h2><button className="v2-icon-button" onClick={closeInspect} aria-label="Close inspection"><Icon name="close" size={13}/></button></div>
        <p>{detail.note}</p>
        {detail.progress !== undefined && <div className="v2-grow"><span style={{ width: `${Math.max(0, detail.progress) * 100}%` }}/></div>}
        {!!detail.stock?.length && <div className="v2-stock">{detail.stock.map(item => <span key={item.name}>{item.name}<b>×{item.count}</b></span>)}</div>}
      </section> : <section className="v2-story v2-pixel-frame" aria-live="polite">
        <div className="v2-caption"><p>{error ? 'A little pause. Try the day again.' : title}</p>{!error && note && <span>{note}</span>}{traveling && started && !complete && <i className="v2-travel-dots" aria-label="Walking">···</i>}</div>
        {(!started || complete || error) ? <div className="v2-start-actions">
          <button className="v2-primary" disabled={!ready} onClick={primaryAction}><Icon name={prepareAction ? 'mail' : hatchAction ? 'leaf' : savedHome ? 'back' : 'play'} size={15}/>{primaryLabel}</button>
          {complete && hatchAction && <button className="v2-icon-button" onClick={() => void run(0)} aria-label="Watch again"><Icon name="play"/></button>}
          {(complete || savedHome) && onPurse && <button className="v2-icon-button" onClick={onPurse} aria-label="Open purse"><Icon name="wallet"/></button>}
        </div> : <div className="v2-transport">
          <button className="v2-icon-button" onClick={togglePlayback} aria-label={paused ? 'Resume day' : 'Pause day'}><Icon name={paused ? 'play' : 'pause'} size={14}/></button>
          <input type="range" min={-1} max={Math.max(0, receipts.length - 1)} value={index} onChange={e => seek(Number(e.target.value))} aria-label="Time of day" aria-valuetext={index < 0 ? 'Morning' : index >= 59 ? 'Night' : index < 20 ? 'Morning' : index < 40 ? 'Afternoon' : 'Evening'}/>
          <button className="v2-icon-button" onClick={skipBeat} aria-label="Next moment"><Icon name="skip" size={15}/></button>
        </div>}
      </section>}
    </footer>
  </main>;
}
