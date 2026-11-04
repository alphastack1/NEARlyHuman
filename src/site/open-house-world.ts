import { createV2WorldRenderer } from '../game/v2/WorldRenderer';
import { receiptTitle, receiptTravelTitle } from '../v2/presentation';
import { Op } from '../v2/types';
import type { HouseFocus, HousePhase, OpenHouseEvents, OpenHouseReplay } from './open-house-data';

export interface OpenHouseWorld {
  ready: Promise<void>;
  focus(target: HouseFocus): void;
  follow(): void;
  watch(intro?: boolean): void;
  panBy(x: number, y: number): void;
  pauseForLook(): void;
  togglePause(): void;
  end(): void;
  insets(top: number, bottom: number): void;
  destroy(): void;
}

/** A read-only view using the game's own world, input and receipt renderer. */
export function createOpenHouseWorld(host: HTMLElement, replay: OpenHouseReplay, events: OpenHouseEvents): OpenHouseWorld {
  const receipts = replay.packet.result.receipts;
  let state = replay.packet.result.state, phase: HousePhase = 'idle', disposed = false, run = 0, currentIndex = -1, caption = 'A home with a mind of its own.', previewAutoStop = false;
  let boundaryWake: (() => void) | undefined;
  const scene = createV2WorldRenderer(host, {
    state,
    onInspect(target) { stopIntro(); if (phase === 'playing') { phase = 'paused'; scene.setPaused(true); events.onPhase(phase); } events.onInspect(target, state); },
    onMotion(motion) { if (phase === 'playing' && motion.traveling && currentIndex >= 0) events.onCaption(receiptTravelTitle(receipts[currentIndex]!, motion.purpose === 'storing'), (currentIndex + 1) / receipts.length); },
  });
  function setPhase(next: HousePhase) { phase = next; events.onPhase(next); }
  function stopIntro() { previewAutoStop = false; scene.setPlaybackRate(1); }
  const ready = scene.ready.then(() => {
    if (disposed) return;
    scene.setOpening('closed'); scene.setDawn('none');
    // This is the recorded final home, viewed beside its living-room chair.
    // Position history affects presentation only; every displayed fact is saved.
    const rest = receipts.findIndex(receipt => receipt.op === Op.Leisure);
    const history = receipts.slice(0, rest >= 0 ? rest + 1 : Math.min(2, receipts.length));
    scene.setState(state, { history, slot: 35 }); scene.setInputEnabled(true); events.onState(state);
  });
  async function play(intro = false) {
    await ready; if (disposed) return;
    const generation = ++run; state = receipts[0]!.before; currentIndex = -1; scene.setPlaybackRate(intro ? 2 : 1);
    scene.setState(state, { slot: 0, history: [] }); scene.followActor(); scene.setPaused(false); scene.setDawn('rise'); setPhase('playing'); events.onState(state);
    events.onCaption('The house wakes.', 0);
    const began = performance.now(); previewAutoStop = intro;
    for (let index = 0; index < receipts.length; index++) {
      if (disposed || run !== generation) return;
      currentIndex = index; const receipt = receipts[index]!; state = receipt.before;
      const quiet = receipt.op === Op.Quiet && receipt.role === 'interlude';
      await scene.playReceipt(receipt, { duration: quiet ? 280 : receipt.role === 'main' ? 2600 : 1300, onImpact() {
        if (disposed || run !== generation) return;
        state = receipt.snapshot; caption = receiptTitle(receipt) || 'The day carries on.';
        events.onState(state); events.onCaption(caption, (index + 1) / receipts.length);
      } });
      // Give a new visitor a short authentic moment, then leave the next step
      // to them. Pause at a completed receipt, never halfway through a delivery.
      if (previewAutoStop && phase === 'playing' && performance.now() - began >= 12000) {
        stopIntro(); scene.setPaused(true); setPhase('paused'); events.onCaption(caption, (index + 1) / receipts.length);
        await new Promise<void>(resolve => { boundaryWake = resolve; });
        boundaryWake = undefined;
        if (disposed || run !== generation) return;
      }
    }
    if (disposed || run !== generation) return;
    state = replay.packet.result.state; scene.setState(state, { slot: 60, history: receipts }); scene.setPaused(false); scene.setDawn('none'); events.onState(state);
    setPhase('ended'); events.onCaption('Goodnight, MAPLE.', 1);
  }
  function end() {
    run++; boundaryWake?.(); stopIntro(); state = replay.packet.result.state; scene.setState(state, { slot: 60, history: receipts }); scene.setPaused(false); scene.setDawn('none'); events.onState(state);
    setPhase('ended'); events.onCaption('MAPLE’s saved day.', 1);
  }
  return {
    ready,
    focus(target) {
      stopIntro();
      if (target === 'home') { scene.followActor(); return; }
      if (phase === 'playing') { scene.setPaused(true); setPhase('paused'); }
      scene.focus(target === 'garden' ? { kind: 'bed', index: 0 } : { kind: target });
    },
    follow: () => scene.followActor(),
    watch(intro = false) { if (!intro) stopIntro(); if (phase === 'playing') return; if (phase === 'paused') { scene.setPaused(false); setPhase('playing'); events.onCaption(caption, (currentIndex + 1) / receipts.length); boundaryWake?.(); } else void play(intro); },
    panBy(x, y) { stopIntro(); if (phase === 'playing') { scene.setPaused(true); setPhase('paused'); } scene.panBy(x, y); },
    pauseForLook() { stopIntro(); if (phase === 'playing') { scene.setPaused(true); setPhase('paused'); } },
    togglePause() { stopIntro(); if (phase === 'playing') { scene.setPaused(true); setPhase('paused'); } else if (phase === 'paused') { scene.followActor(); scene.setPaused(false); setPhase('playing'); boundaryWake?.(); } },
    end,
    insets: (top, bottom) => scene.setViewportInsets(top, bottom),
    destroy() { if (disposed) return; disposed = true; run++; boundaryWake?.(); scene.destroy(); },
  };
}
