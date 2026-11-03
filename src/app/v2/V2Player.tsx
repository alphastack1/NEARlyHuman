import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../Icons';
import { createV2WorldRenderer, type V2WorldController } from '../../game/v2';
import type { GamePublicLife as V2PublicLife } from '../../chain/game-types';
import { Op, type Receipt, type State } from '../../v2/types';
import { endingNote, filmBeats, inspectDetail, quietInterlude, receiptEventNote, receiptNote, receiptQuietTitle, receiptTitle, receiptTravelTitle, type Inspection, type V2FilmPacket } from '../../v2/presentation';
import { dayMemory } from '../../v2/day-memory';
import '../v2Playback.css';
import type { CartridgePhase } from '../CartridgeOpening';
import { LifeSoundButton, useLifeSound } from './LifeSound';
import { NeedFeedback, visibleNeedChanges } from './NeedFeedback';

interface Props { packet?: V2FilmPacket; life?: V2PublicLife; name?: string; onPrepare?: () => void; onHatch?: () => void; onPurse?: () => void; onExit?: () => void; onMenu?: () => void; onProfile?: () => void; onLatest?: () => void; suspended?: boolean; opening?: CartridgePhase; prepareLabel?: string; homeFirst?: boolean; example?: boolean; onEndExample?: () => void; hatchLabel?: string; autoPlay?: boolean }
const EXAMPLE_LENGTH = 28_000;
const NEED_ICONS: IconName[] = ['heart', 'food', 'water', 'energy', 'morale'];
const NEED_LABELS = ['Health', 'Food', 'Water', 'Energy', 'Mood'];
const NEED_COLORS = ['#ef6c65', '#e6b46a', '#5db6df', '#f3d45e', '#a0bd72'];

export default function V2Player({ packet, life, name, onPrepare, onHatch, onPurse, onExit, onMenu, onProfile, onLatest, suspended, opening = 'closed', prepareLabel, homeFirst, example, onEndExample, hatchLabel = 'Hatch your own', autoPlay }: Props) {
  const sound = useLifeSound();
  const receipts = packet?.result.receipts || [];
  const initial = receipts[0]?.before || packet?.result.state || life!.state;
  const savedHome = !packet;
  const homeState = life?.state || packet?.result.state || initial;
  const [snapshot, setSnapshot] = useState<State>(homeFirst ? homeState : initial);
  const [index, setIndex] = useState(-1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [motionPurpose, setMotionPurpose] = useState<'fetching' | 'storing' | 'watering'>();
  const [needFeedback, setNeedFeedback] = useState<{ serial: number; changes: number[] }>();
  const needFeedbackRemaining = useRef(0), needFeedbackSerial = useRef(0);
  const displayedNeeds = useRef([...snapshot.needs]);
  const [inFlight, setInFlight] = useState<{ receipt: Receipt; impacted: boolean }>();
  const [inspect, setInspect] = useState<Inspection>();
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState<string>();
  const noticeRemaining = useRef(0);
  const host = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLElement>(null), bottom = useRef<HTMLElement>(null);
  const renderer = useRef<V2WorldController | undefined>(undefined);
  const generation = useRef(0), pausedRef = useRef(false);
  const running = useRef(false);
  const suspension = useRef({ active: false, resume: false }), resumeInspection = useRef(false);
  const exampleRemaining = useRef(EXAMPLE_LENGTH), endExampleAction = useRef(onEndExample);
  endExampleAction.current = onEndExample;
  const roosterName = life?.name || name || 'NEARlyHuman';
  const targetDay = receipts[0]?.snapshot.day || packet?.result.state.day || life!.state.day;
  const beats = filmBeats(receipts);
  const current = receipts.slice(0, index + 1).reverse().find(r => !quietInterlude(r));
  const approaching = inFlight && !inFlight.impacted && !quietInterlude(inFlight.receipt) ? inFlight.receipt : undefined;
  const homeView = savedHome || (!!homeFirst && !started);
  const actualMain = receipts.slice(0, index + 1).find(r => r.role === 'main');
  const plannedFocus = packet?.dailyPlan?.focus as { op?: number; arg?: number; variant?: number } | undefined;
  const mainDone = packet?.dailyPlan?.status === 'completed' && (homeView || !!actualMain?.success && (!plannedFocus || (actualMain.op === plannedFocus.op && actualMain.arg === plannedFocus.arg && actualMain.variant === plannedFocus.variant)));
  const undertaking = packet?.dailyPlan?.status === 'unavailable' && actualMain ? receiptTitle(actualMain) : packet?.dailyPlan?.mainLabel;
  const detail = inspect ? inspectDetail(inspect, snapshot) : undefined;
  const earned = packet?.rewardMicro && BigInt(packet.rewardMicro) > 0n ? (Number(BigInt(packet.rewardMicro)) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '';
  const memory = packet ? dayMemory(packet) : undefined;
  const quietBeat = inFlight && quietInterlude(inFlight.receipt) ? inFlight.receipt : undefined;
  const bedtimeApproach = inFlight && !inFlight.impacted && (inFlight.receipt.op === Op.Rest || inFlight.receipt.events.some(e => e.kind === 'bedtime'));
  const physicalPurpose = motionPurpose && inFlight ? { fetching: 'Getting the supplies.', storing: 'Putting things away.', watering: 'Fetching garden water.' }[motionPurpose] : undefined;
  const title = homeView ? snapshot.alive ? snapshot.day === 0 ? `${roosterName} is home.` : `${roosterName}, at home.` : 'A little life, remembered.' : !started ? `A day with ${roosterName}.` : complete ? memory?.headline || 'A little day, well lived.' : physicalPurpose || (bedtimeApproach ? receiptTravelTitle(inFlight.receipt) : traveling && inFlight ? receiptTravelTitle(inFlight.receipt, inFlight.impacted && inFlight.receipt.op === Op.Pickup) : quietBeat ? receiptQuietTitle(quietBeat) : approaching ? receiptTitle(approaching) : current ? receiptTitle(current) : 'A new morning.');
  const note = !snapshot.alive && (homeView || complete) ? `${endingNote(snapshot)}${earned ? ` · +${earned} NHC kept in the purse` : ''}` : complete ? [memory?.hint, earned ? `+${earned} NHC` : ''].filter(Boolean).join(' · ') : notice || (quietBeat || approaching ? '' : current ? current.op === Op.Ship && current.success && earned ? `Sent with care · +${earned} NHC` : receiptNote(current) : '');
  const prepareAction = (complete || homeView) && !!onPrepare && snapshot.alive;
  const hatchAction = (complete || homeView) && !prepareAction && !!onHatch;
  const primaryLabel = !ready ? 'Opening home…' : error ? 'Try again' : onLatest && (complete || homeView) ? 'Latest home' : prepareAction ? prepareLabel || 'Prepare tomorrow' : hatchAction ? hatchLabel : homeView ? 'Back home' : complete ? 'Watch again' : 'Watch day';

  function pause(value: boolean) { pausedRef.current = value; setPaused(value); renderer.current?.setPaused(value); }
  function inspectObject(target: Inspection) { resumeInspection.current = !pausedRef.current; pause(true); setInspect(target); sound.cue('select'); }
  function closeInspect() { setInspect(undefined); if (resumeInspection.current && !suspended) pause(false); resumeInspection.current = false; }
  useEffect(() => {
    renderer.current?.setInputEnabled(!suspended);
    if (suspended && !suspension.current.active) { suspension.current = { active: true, resume: !pausedRef.current }; pause(true); }
    else if (!suspended && suspension.current.active) { const resume = suspension.current.resume; suspension.current = { active: false, resume: false }; if (resume) pause(false); }
  }, [suspended, ready]);
  useEffect(() => { renderer.current?.setOpening(opening); }, [opening, ready]);
  useEffect(() => {
    sound.playing(ready && started && snapshot.alive && !paused && !complete && !suspended && !inspect && opening === 'closed');
    return () => sound.playing(false);
  }, [sound.playing, ready, started, snapshot.alive, paused, complete, suspended, inspect, opening]);
  useEffect(() => {
    if (!notice) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), delta = now - previous; previous = now;
      if (!pausedRef.current && !suspended && !document.hidden) noticeRemaining.current -= delta;
      if (noticeRemaining.current <= 0) setNotice(undefined);
    }, 100);
    return () => clearInterval(timer);
  }, [notice, suspended]);
  useEffect(() => {
    if (!needFeedback) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), elapsed = now - previous; previous = now;
      if (!pausedRef.current && !suspended && !document.hidden) needFeedbackRemaining.current -= elapsed;
      if (needFeedbackRemaining.current <= 0) setNeedFeedback(undefined);
    }, 80);
    return () => clearInterval(timer);
  }, [needFeedback, suspended]);

  useEffect(() => {
    const state = homeFirst ? homeState : initial;
    setReady(false); setError(false); setStarted(false); setComplete(false); setIndex(-1); setSnapshot(state); setInFlight(undefined); setNotice(undefined); setNeedFeedback(undefined); setMotionPurpose(undefined); displayedNeeds.current = [...state.needs]; exampleRemaining.current = EXAMPLE_LENGTH;
    const controller = createV2WorldRenderer(host.current!, { state, onInspect: inspectObject, onMotion: ({ traveling, purpose }) => { setTraveling(traveling); setMotionPurpose(purpose); } });
    controller.setInputEnabled(!suspended);
    controller.setOpening(opening);
    controller.setDawn(state.alive ? 'waiting' : 'none');
    renderer.current = controller;
    controller.ready.then(() => setReady(true)).catch(() => setError(true));
    return () => { generation.current++; controller.destroy(); renderer.current = undefined; };
  }, [packet, life?.id, savedHome ? life?.revision : undefined, homeFirst]);

  useEffect(() => { renderer.current?.setPlaybackRate(example ? 2 : 1); }, [example, ready]);
  useEffect(() => { if (!started && !complete) renderer.current?.setDawn(snapshot.alive ? 'waiting' : 'none'); }, [ready, started, complete]);
  useEffect(() => { if ((example || autoPlay) && ready && !suspended && !started && !complete) { exampleRemaining.current = EXAMPLE_LENGTH; void run(0); } }, [example, autoPlay, ready, suspended]);
  useEffect(() => {
    if (!example || !started || complete) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), elapsed = now - previous; previous = now;
      if (!pausedRef.current && !document.hidden) exampleRemaining.current -= elapsed;
      if (exampleRemaining.current <= 0) endExample();
    }, 100);
    return () => clearInterval(timer);
  }, [example, started, complete]);

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
    setInspect(undefined); setNotice(undefined); setNeedFeedback(undefined); setMotionPurpose(undefined); setStarted(true); setComplete(false); pause(false);
    const start = Math.max(0, Math.min(receipts.length - 1, from));
    running.current = true;
    renderer.current?.setState(start ? receipts[start - 1]!.snapshot : initial, { history: receipts.slice(0, start), slot: start ? receipts[start - 1]!.slot : 0 });
    renderer.current?.setDawn(start === 0 ? 'rise' : 'none');
    displayedNeeds.current = [...(start ? receipts[start - 1]!.snapshot : initial).needs];
    setSnapshot(start ? receipts[start - 1]!.snapshot : initial); setIndex(start - 1);
    try {
      for (const beat of beats) {
        if (beat.end < start) continue;
        while (pausedRef.current && generation.current === id) await new Promise(r => setTimeout(r, 80));
        if (generation.current !== id) return;
        setInFlight({ receipt: beat.receipt, impacted: false });
        await renderer.current?.playReceipt(beat.receipt, { duration: beat.duration, onImpact: () => {
          if (generation.current !== id) return;
          const changes = visibleNeedChanges(beat.receipt, displayedNeeds.current);
          displayedNeeds.current = [...beat.receipt.snapshot.needs];
          if (changes.some(Boolean)) { needFeedbackRemaining.current = 950; setNeedFeedback({ serial: ++needFeedbackSerial.current, changes }); }
          setIndex(beat.end); setSnapshot(beat.receipt.snapshot); setInFlight({ receipt: beat.receipt, impacted: true });
          const incident = receiptEventNote(beat.receipt);
          if (incident) { noticeRemaining.current = 2600; setNotice(incident); }
          if (!beat.receipt.snapshot.alive && beat.receipt.before.alive) sound.cue('back');
          else if (incident) sound.cue('back');
          else if (beat.receipt.success && beat.receipt.op === Op.Pickup) sound.cue('parcel');
          else if (beat.receipt.success && beat.receipt.role === 'main' && beat.receipt.op !== Op.QuietMain) sound.cue('project');
        } });
        if (generation.current !== id) return;
        if (example && beat.receipt.role === 'main') { endExample(); return; }
      }
      if (example) { endExample(); return; }
      running.current = false; renderer.current?.setDawn('none'); setSnapshot(packet.result.state); setIndex(receipts.length - 1); setComplete(true); setInFlight(undefined); pause(false); sound.cue(packet.result.state.alive ? 'day' : 'back');
    } catch { if (generation.current === id) setError(true); }
  }
  function seek(value: number) {
    generation.current++; running.current = false; pause(true); setStarted(true); setComplete(false); setInspect(undefined); setInFlight(undefined); setNotice(undefined); setNeedFeedback(undefined); setMotionPurpose(undefined);
    const at = Math.min(receipts.length - 1, Math.max(-1, value));
    const state = at < 0 ? initial : receipts[at]!.snapshot;
    displayedNeeds.current = [...state.needs];
    renderer.current?.setDawn('none');
    renderer.current?.setState(state, { history: receipts.slice(0, at + 1), slot: at < 0 ? 0 : receipts[at]!.slot }); setSnapshot(state); setIndex(at);
  }
  function togglePlayback() {
    if (pausedRef.current) { if (running.current) pause(false); else void run(index + 1); } else pause(true);
  }
  function endExample() {
    generation.current++; running.current = false; setStarted(false); setComplete(false); setInFlight(undefined); setInspect(undefined); setNotice(undefined); setNeedFeedback(undefined); setMotionPurpose(undefined); pause(false);
    displayedNeeds.current = [...initial.needs];
    renderer.current?.setState(initial, { slot: 0 }); setSnapshot(initial); setIndex(-1);
    endExampleAction.current?.();
  }
  function finishDay() {
    if (!packet) return;
    renderer.current?.setDawn('none');
    generation.current++; running.current = false; setInspect(undefined); setInFlight(undefined); setNotice(undefined); setNeedFeedback(undefined); setMotionPurpose(undefined); setStarted(true); setComplete(true);
    displayedNeeds.current = [...packet.result.state.needs];
    renderer.current?.setState(packet.result.state, { history: receipts, slot: receipts.at(-1)?.slot || 60 });
    setSnapshot(packet.result.state); setIndex(receipts.length - 1); pause(false);
  }
  function primaryAction() {
    setError(false);
    if (onLatest && (complete || homeView)) onLatest();
    else if (prepareAction) onPrepare?.();
    else if (hatchAction) onHatch?.();
    else if (homeView) onExit ? onExit() : location.assign('/');
    else void run(0);
  }

  return <main className={`v2-stage${opening !== 'closed' ? ' v2-has-opening' : ''}`} aria-label={`${roosterName}'s home`} inert={!!suspended}>
    <div className="v2-world" ref={host}/>
    <header className="v2-hud v2-pixel-frame" ref={top}>
      <div className="v2-identity">
        <div className="v2-name">{onExit && <button className="v2-icon-button v2-back" onClick={onExit} aria-label="Back"><Icon name="back" size={16}/></button>}<strong role={onProfile ? 'button' : undefined} tabIndex={onProfile ? 0 : undefined} onClick={onProfile} onKeyDown={e => { if (onProfile && (e.key === 'Enter' || e.key === ' ')) onProfile(); }}>{roosterName}</strong><span>LV{String(snapshot.level).padStart(2, '0')}</span></div>
        <span className="v2-day">{example ? 'EXAMPLE' : `DAY ${String(targetDay).padStart(2, '0')}`}</span>{onMenu && <button className="v2-icon-button v2-menu-button" onClick={onMenu} aria-label="Open menu"><Icon name="menu" size={16}/></button>}
      </div>
      <div className="v2-needs">{NEED_ICONS.map((icon, i) => <div className="v2-need" key={icon} role="meter" aria-label={NEED_LABELS[i]} aria-valuenow={Math.round(snapshot.needs[i]! / 100)} aria-valuemin={0} aria-valuemax={100} title={`${NEED_LABELS[i]} ${Math.round(snapshot.needs[i]! / 100)}%`}>
        <Icon name={icon} size={16} color={NEED_COLORS[i]}/><span className="v2-pips">{[0, 1, 2, 3, 4].map(p => <i key={p} style={{ backgroundColor: snapshot.needs[i]! > p * 2000 ? NEED_COLORS[i] : undefined }}/>)}</span>
        {needFeedback && <NeedFeedback key={`${needFeedback.serial}:${i}`} delta={needFeedback.changes[i]!} color={NEED_COLORS[i]!} paused={paused || !!suspended || !!inspect}/>}
      </div>)}</div>
      {undertaking && !complete && <div className={`v2-intention${mainDone ? ' v2-intention-done' : ''}`}><Icon name={mainDone ? 'check' : 'leaf'} size={16}/><span>{undertaking}</span></div>}
      {ready && !inspect && <button className="v2-follow v2-icon-button" onClick={() => renderer.current?.followActor()} aria-label="Find rooster" title={`Find ${roosterName}`}><Icon name="focus" size={16}/></button>}
    </header>

    <footer className={`v2-dock${inspect ? ' v2-dock-inspect' : ''}`} ref={bottom}>
      {detail ? <section className="v2-inspect v2-pixel-frame">
        <div className="v2-inspect-heading"><h2>{detail.title}</h2><button className="v2-icon-button" onClick={closeInspect} aria-label="Close inspection"><Icon name="close" size={16}/></button></div>
        <p>{detail.note}</p>
        {detail.progress !== undefined && <div className="v2-grow"><span style={{ width: `${Math.max(0, detail.progress) * 100}%` }}/></div>}
        {!!detail.stock?.length && <div className="v2-stock">{detail.stock.map(item => <span key={item.name}>{item.name}<b>×{item.count}</b></span>)}</div>}
        {inspect?.kind === 'mailbox' && prepareAction && <button className="v2-inspect-post v2-primary" onClick={() => { closeInspect(); onPrepare?.(); }}><Icon name="mail" size={16}/>{life?.pendingRequest ? prepareLabel || 'Open day' : snapshot.day === 0 ? 'Pack first post' : "Pack tomorrow's post"}</button>}
      </section> : <section className="v2-story v2-pixel-frame" aria-live="polite">
        <div className="v2-caption"><p>{error ? 'A little pause. Try the day again.' : title}</p>{!error && note && <span className={notice && !complete ? 'v2-event-note' : undefined}>{note}</span>}{traveling && started && !complete && <i className="v2-travel-dots" aria-label="Walking">···</i>}</div>
        {example ? <div className="v2-example-actions"><button className="v2-primary" onClick={() => { endExample(); onHatch?.(); }}><Icon name="leaf" size={16}/>Hatch your own</button><button className="v2-example-back" onClick={endExample}>Back</button><LifeSoundButton/></div> : (!started || complete || error) ? <><div className="v2-start-actions">
          <button className="v2-primary" disabled={!ready} onClick={primaryAction}><Icon name={prepareAction ? 'mail' : hatchAction ? 'leaf' : savedHome ? 'back' : 'play'} size={16}/>{primaryLabel}</button>
          {complete && hatchAction && <button className="v2-icon-button" onClick={() => void run(0)} aria-label="Watch again"><Icon name="play"/></button>}
          {(complete || homeView) && onPurse && <button className="v2-icon-button" onClick={onPurse} aria-label="Open purse"><Icon name="wallet"/></button>}
        </div>{homeView && packet && <button className="v2-watch-previous" onClick={() => void run(0)}><Icon name="play" size={16}/>Watch day {targetDay}</button>}</> : <div className="v2-transport">
          <button className="v2-icon-button" onClick={togglePlayback} aria-label={paused ? 'Resume day' : 'Pause day'}><Icon name={paused ? 'play' : 'pause'} size={16}/></button>
          <input type="range" min={-1} max={Math.max(0, receipts.length - 1)} value={index} onChange={e => seek(Number(e.target.value))} aria-label="Time of day" aria-valuetext={index < 0 ? 'Morning' : index >= 59 ? 'Night' : index < 20 ? 'Morning' : index < 40 ? 'Afternoon' : 'Evening'}/>
          <button className="v2-finish-day" onClick={finishDay}>Finish day<Icon name="check" size={16}/></button>
        </div>}
      </section>}
    </footer>
  </main>;
}
