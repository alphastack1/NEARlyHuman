import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Icon } from '../app/Icons';
import { v2ItemImage } from '../art/v2-items';
import { PLANTS } from '../v2/catalog';
import { ITEMS, type State } from '../v2/types';
import { loadOpenHouseReplay, type HouseFocus, type HouseInspect, type HousePhase } from './open-house-data';
import type { OpenHouseWorld } from './open-house-world';
import './home-preview.css';

function detailFor(target: HouseInspect, state: State) {
  if (target.kind === 'bed') {
    const plot = state.plots[target.index || 0];
    return { title: `Garden bed ${(target.index || 0) + 1}`, line: plot?.kind ? `${PLANTS[plot.kind]?.name || 'A planting'} · ${plot.ticks ? 'growing' : 'ready to harvest'}` : 'Room for something new.', items: [] as number[] };
  }
  if (target.kind === 'well') return { title: 'The well', line: 'Water for the growing beds.', items: [] as number[] };
  if (target.kind === 'mailbox') return { title: 'The morning post', line: 'Daily supplies arrive here.', items: [] as number[] };
  const title = target.label || (target.kind === 'workshop' ? 'Workshop' : 'At home');
  const workshop = target.kind === 'workshop', pantry = /fridge|pantry|food/i.test(title);
  const items = state.inventory.flatMap((amount, index) => amount > 0 && (workshop ? index === 6 || index >= 30 : pantry ? [0, 1, 2, 3, 5, 26, 27, 28, 29].includes(index) : [4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(index)) ? [index] : []).slice(0, 4);
  return { title, line: workshop ? `${state.inventory[6] || 0} wood stored.` : items.length ? 'Supplies kept at home.' : 'A place in MAPLE’s home.', items };
}

/** A contained, read-only window onto an already saved life. */
export default function HomePreview({ className = '' }: { className?: string }) {
  const root = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), chrome = useRef<HTMLDivElement>(null), controls = useRef<HTMLDivElement>(null);
  const controller = useRef<OpenHouseWorld | undefined>(undefined), starting = useRef<Promise<OpenHouseWorld> | undefined>(undefined), lifetime = useRef(0);
  const phaseRef = useRef<HousePhase>('idle'), currentState = useRef<State | undefined>(undefined), interacted = useRef(false);
  const gesture = useRef<{ x: number; y: number } | undefined>(undefined), worldGesture = useRef<{ x: number; y: number } | undefined>(undefined), pendingPan = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false), [opening, setOpening] = useState(false), [phase, setPhase] = useState<HousePhase>('idle');
  const [focus, setFocus] = useState<HouseFocus | null>('home'), [selection, setSelection] = useState<{ target: HouseInspect; state: State }>(), [error, setError] = useState(false);
  const [holding, setHolding] = useState(false), [shift, setShift] = useState({ x: 0, y: 0 }), [caption, setCaption] = useState('MAPLE’s saved day.');

  function measure() {
    if (!host.current || !chrome.current || !controls.current) return;
    const box = host.current.getBoundingClientRect(), top = Math.max(0, chrome.current.getBoundingClientRect().bottom - box.top) + 7;
    const bottom = Math.max(0, box.bottom - controls.current.getBoundingClientRect().top) + 7;
    root.current?.style.setProperty('--hp-chrome-height', `${top}px`);
    controller.current?.insets(top, bottom);
  }
  async function enter(): Promise<OpenHouseWorld> {
    if (controller.current) return controller.current;
    if (!starting.current) {
      const generation = lifetime.current; setOpening(true); setError(false);
      starting.current = Promise.all([import('./open-house-world'), loadOpenHouseReplay()]).then(async ([module, replay]) => {
        if (generation !== lifetime.current || !host.current) throw Error('Preview closed.');
        const view = module.createOpenHouseWorld(host.current, replay, {
          onInspect(target, state) { if (generation === lifetime.current) { interacted.current = true; setSelection({ target, state }); } },
          onPhase(value) { if (generation === lifetime.current) { phaseRef.current = value; setPhase(value); } },
          onCaption(value) { if (generation === lifetime.current) setCaption(value); },
          onState(state) { if (generation === lifetime.current) currentState.current = state; },
        });
        controller.current = view; measure(); await view.ready;
        if (generation !== lifetime.current) { view.destroy(); throw Error('Preview closed.'); }
        measure(); setOpening(false); setActive(true);
        if (pendingPan.current.x || pendingPan.current.y) { view.panBy(pendingPan.current.x, pendingPan.current.y); pendingPan.current = { x: 0, y: 0 }; }
        return view;
      }).catch(reason => {
        if (generation === lifetime.current) { starting.current = undefined; setOpening(false); setError(true); }
        throw reason;
      });
    }
    return starting.current;
  }
  async function look(target: HouseFocus) {
    interacted.current = true; setFocus(target); setSelection(undefined);
    try {
      const view = await enter(); view.pauseForLook(); view.focus(target);
      if (target !== 'home' && currentState.current) setSelection({ target: target === 'garden' ? { kind: 'bed', index: 0 } : { kind: target }, state: currentState.current });
    } catch { /* The poster and website actions remain available. */ }
  }
  async function play(restart = false) {
    interacted.current = true; setSelection(undefined); setFocus('home');
    try {
      const view = await enter(); view.follow();
      if (restart) { view.end(); view.watch(true); }
      else if (phaseRef.current === 'playing' || phaseRef.current === 'paused') view.togglePause();
      else view.watch();
    } catch { /* A small retry stays inside the showcase. */ }
  }
  function startPan(event: ReactPointerEvent<HTMLButtonElement>) {
    interacted.current = true; gesture.current = { x: event.clientX, y: event.clientY }; pendingPan.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId); setHolding(true); void enter().catch(() => {});
  }
  function movePan(event: ReactPointerEvent<HTMLButtonElement>) {
    const previous = gesture.current; if (!previous) return;
    const x = event.clientX - previous.x, y = event.clientY - previous.y; gesture.current = { x: event.clientX, y: event.clientY };
    if (Math.abs(x) + Math.abs(y) > 1) setFocus(null);
    if (controller.current && active) controller.current.panBy(x, y);
    else {
      pendingPan.current.x += x; pendingPan.current.y += y;
      const width = root.current?.clientWidth || 300, height = root.current?.clientHeight || 300;
      setShift({ x: Math.max(-width * .02, Math.min(width * .02, pendingPan.current.x * .12)), y: Math.max(-height * .02, Math.min(height * .02, pendingPan.current.y * .12)) });
    }
  }
  function endPan() { gesture.current = undefined; setHolding(false); setShift({ x: 0, y: 0 }); }

  useEffect(() => {
    lifetime.current++; const observer = new ResizeObserver(measure);
    if (root.current) observer.observe(root.current); if (chrome.current) observer.observe(chrome.current); if (controls.current) observer.observe(controls.current);
    return () => { lifetime.current++; observer.disconnect(); controller.current?.destroy(); controller.current = undefined; starting.current = undefined; };
  }, []);
  useEffect(() => {
    let canceled = false, timer: ReturnType<typeof setTimeout> | undefined;
    const warm = () => {
      if (interacted.current || starting.current || document.visibilityState === 'hidden') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (interacted.current || document.visibilityState === 'hidden') return;
        void enter().then(view => { if (!canceled && !interacted.current) view.watch(true); }).catch(() => {});
      }, 650);
    };
    const frame = requestAnimationFrame(warm); document.addEventListener('visibilitychange', warm);
    return () => { canceled = true; cancelAnimationFrame(frame); if (timer) clearTimeout(timer); document.removeEventListener('visibilitychange', warm); };
  }, []);
  useEffect(() => {
    if (!selection) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelection(undefined); };
    const outside = (event: PointerEvent) => { if (event.target instanceof Element && !event.target.closest('.hp-inspect')) setSelection(undefined); };
    document.addEventListener('keydown', escape); document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [selection]);
  const detail = selection ? detailFor(selection.target, selection.state) : undefined;
  const playbackLabel = phase === 'playing' ? 'Pause' : phase === 'paused' ? 'Resume' : phase === 'ended' ? 'Watch again' : 'Play';
  return <section ref={root} className={`home-preview${active ? ' is-active' : ''}${opening ? ' is-opening' : ''} ${className}`} aria-label="Saved NEARlyHuman gameplay featuring MAPLE">
    <div className="hp-world" ref={host} onPointerDown={event => { interacted.current = true; worldGesture.current = { x: event.clientX, y: event.clientY }; setSelection(undefined); }} onPointerMove={event => { const origin = worldGesture.current; if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) { setFocus(null); controller.current?.pauseForLook(); } }} onPointerUp={() => { worldGesture.current = undefined; }} onPointerCancel={() => { worldGesture.current = undefined; }}/>
    {!active && <picture className="hp-poster" style={{ transform: `translate(${shift.x}px,${shift.y}px) scale(${shift.x || shift.y ? 1.05 : 1})` }}><source media="(max-width: 720px)" srcSet="/site/open-house-phone.webp"/><img src="/site/open-house-desktop.webp" alt="MAPLE’s saved pixel home" width="1440" height="900" fetchPriority="high"/></picture>}
    {(!active || holding) && <button type="button" className="hp-world-hit" aria-label="Look around the saved home" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onClick={() => { interacted.current = true; void enter().catch(() => {}); }}/>}
    <div className="hp-chrome" ref={chrome}><span className="hp-badge"><i aria-hidden="true"/>Saved gameplay <b aria-hidden="true">·</b> MAPLE</span><div className="hp-places" role="group" aria-label="Preview locations">{([['home', 'house', 'House'], ['garden', 'leaf', 'Garden'], ['workshop', 'gear', 'Workshop']] as const).map(([value, icon, label]) => <button type="button" key={value} aria-pressed={focus === value} onClick={() => void look(value)}><Icon name={icon} size={12}/><span>{label}</span></button>)}</div></div>
    {detail && <aside className="hp-inspect" aria-label={detail.title}><header><strong>{detail.title}</strong><button type="button" aria-label="Close preview details" onClick={() => setSelection(undefined)}><Icon name="close" size={12}/></button></header><p>{detail.line}</p>{detail.items.length > 0 && <div className="hp-items">{detail.items.map(index => <span key={index}><img src={v2ItemImage(index)} width="23" height="23" alt={(ITEMS[index] || '').replaceAll('_', ' ')}/><b>×{selection!.state.inventory[index]}</b></span>)}</div>}</aside>}
    <div className="hp-controls" ref={controls}><div className="hp-transport"><button type="button" onClick={() => void play()} aria-label={`${playbackLabel} saved gameplay`}><Icon name={phase === 'playing' ? 'pause' : 'play'} size={12}/>{playbackLabel}</button><button type="button" className="hp-restart" onClick={() => void play(true)} aria-label="Restart saved preview"><span aria-hidden="true">↻</span>Restart</button></div>{error ? <button type="button" className="hp-retry" onClick={() => void play(true)}>Try preview again</button> : <span className="hp-drag-hint">Drag to look around</span>}</div>
    <span className="hp-screen-reader" aria-live="off">{caption}</span>
  </section>;
}
