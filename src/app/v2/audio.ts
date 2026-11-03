export type LifeSound = 'select' | 'back' | 'confirm' | 'parcel' | 'project' | 'day';
export interface LifeAudio {
  readonly enabled: boolean;
  unlock(): Promise<void>;
  setEnabled(enabled: boolean): void;
  setPlaying(playing: boolean): void;
  cue(sound: LifeSound): void;
  dispose(): void;
}

export interface LifeNote { at: number; frequency: number; duration: number; gain: number }
const KEY = 'nh:v2:audio-enabled';
export const LIFE_AUDIO_GAIN = .16;
export const LIFE_PHRASE_SECONDS = 12.8;
const note = (at: number, frequency: number, duration: number, gain: number): LifeNote => ({ at, frequency, duration, gain });

/** Original, sparse pentatonic phrase: six small notes and two soft bass answers. */
export const LIFE_MELODY: readonly LifeNote[] = [
  note(0, 220, .85, .035), note(.1, 440, .6, .06), note(1.3, 523.25, .45, .052),
  note(2.5, 587.33, .75, .05), note(5.1, 659.25, .7, .045),
  note(6.4, 174.61, .85, .03), note(7.3, 523.25, .6, .05), note(9.8, 440, .85, .045),
];
export function lifeSoundNotes(sound: LifeSound): readonly LifeNote[] {
  switch (sound) {
    case 'select': return [note(0, 880, .055, .16)];
    case 'back': return [note(0, 587.33, .07, .13)];
    case 'confirm': return [note(0, 659.25, .075, .13), note(.07, 880, .1, .12)];
    case 'parcel': return [note(0, 523.25, .09, .13), note(.08, 659.25, .12, .11)];
    case 'project': return [note(0, 587.33, .12, .11), note(.105, 783.99, .18, .1)];
    case 'day': return [note(0, 440, .14, .105), note(.12, 523.25, .16, .1), note(.25, 659.25, .28, .09)];
  }
}

/** Shared by live synthesis and offline listening/level checks; no downloaded audio. */
export function scheduleLifeNote(context: BaseAudioContext, destination: AudioNode, spec: LifeNote, start: number): { stop(): void; oscillator: OscillatorNode } {
  const oscillator = context.createOscillator(), envelope = context.createGain();
  const at = Math.max(context.currentTime, start + spec.at), end = at + spec.duration;
  oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(spec.frequency, at);
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(spec.gain, at + Math.min(.008, spec.duration / 4));
  envelope.gain.exponentialRampToValueAtTime(.00001, end);
  oscillator.connect(envelope); envelope.connect(destination); oscillator.start(at); oscillator.stop(end + .015);
  let ended = false;
  oscillator.addEventListener('ended', () => { ended = true; oscillator.disconnect(); envelope.disconnect(); }, { once: true });
  return { oscillator, stop() { if (ended) return; ended = true; try { oscillator.stop(); } catch { /* Already ended. */ } oscillator.disconnect(); envelope.disconnect(); } };
}

export function readLifeAudioPreference(): boolean {
  try {
    const value = localStorage.getItem(KEY);
    if (value === 'true' || value === 'false') return value === 'true';
    const legacy = localStorage.getItem('nh:sound');
    if (legacy === 'true' || legacy === 'false') return legacy !== 'true';
  } catch { /* A private browser can keep the setting for this visit. */ }
  return true;
}

let activeScope: LifeAudio | undefined;

/** One active scope per tab. Creating this service is silent; only a gesture unlocks it. */
export function createLifeAudio(): LifeAudio {
  activeScope?.dispose();
  let enabled = readLifeAudioPreference(), disposed = false, playing = false, unlocked = false;
  let context: AudioContext | undefined, master: GainNode | undefined, filter: BiquadFilterNode | undefined;
  let resume: Promise<void> | undefined, resumeEpoch = 0, epoch = 0, timer: ReturnType<typeof setInterval> | undefined;
  let phraseAt = 0, next = 0, lastCue = -Infinity;
  const voices = new Set<{ music: boolean; stop(): void }>();
  const visible = () => typeof document !== 'undefined' && !document.hidden;
  const allowed = () => !disposed && enabled && unlocked && visible() && activeScope === scope && context?.state === 'running';
  function stopVoices(musicOnly = false) {
    for (const voice of voices) if (!musicOnly || voice.music) { voice.stop(); voices.delete(voice); }
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = undefined; stopVoices(true); }
  function silence() {
    epoch++; unlocked = false; stopMusic(); stopVoices();
    if (context && master) { master.gain.cancelScheduledValues(0); master.gain.value = 0; }
    if (context?.state === 'running') void context.suspend().catch(() => {});
  }
  function schedule(spec: LifeNote, at: number, music: boolean) {
    if (!allowed() || !context || !master || voices.size >= 6) return;
    const scheduled = scheduleLifeNote(context, master, spec, at);
    const voice = { music, stop: scheduled.stop }; voices.add(voice);
    scheduled.oscillator.addEventListener('ended', () => voices.delete(voice), { once: true });
  }
  function startMusic() {
    if (timer || !playing || !allowed() || !context) return;
    phraseAt = context.currentTime + .15; next = 0;
    const tick = () => {
      if (!allowed() || !playing || !context) { stopMusic(); return; }
      while (phraseAt + LIFE_MELODY[next]!.at < context.currentTime + .2) {
        schedule(LIFE_MELODY[next]!, phraseAt, true); next++;
        if (next === LIFE_MELODY.length) { next = 0; phraseAt += LIFE_PHRASE_SECONDS; }
      }
    };
    tick(); timer = setInterval(tick, 120);
  }
  const hide = () => { if (!visible()) silence(); };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', hide);
  const scope: LifeAudio = {
    get enabled() { return enabled; },
    unlock() {
      if (disposed || !enabled || !visible() || activeScope !== scope) return Promise.resolve();
      if (context?.state === 'running' && unlocked) { startMusic(); return Promise.resolve(); }
      if (resume) {
        const previousEpoch = resumeEpoch, requestedEpoch = epoch;
        return resume.then(() => {
          if (requestedEpoch !== previousEpoch && requestedEpoch === epoch && !disposed && enabled && visible() && activeScope === scope && !unlocked) return scope.unlock();
        });
      }
      try {
        if (!context) {
          const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!Constructor) return Promise.resolve();
          context = new Constructor(); master = context.createGain(); filter = context.createBiquadFilter();
          master.gain.value = 0; filter.type = 'lowpass'; filter.frequency.value = 2300; filter.Q.value = .3;
          master.connect(filter); filter.connect(context.destination);
        }
        const currentEpoch = epoch, audioContext = context;
        const operation = audioContext.resume().then(() => {
          if (disposed || currentEpoch !== epoch || !enabled || !visible() || activeScope !== scope) {
            if (audioContext.state === 'running') return audioContext.suspend().catch(() => {});
            return;
          }
          unlocked = true; master!.gain.value = LIFE_AUDIO_GAIN; startMusic();
        }).catch(() => {}).finally(() => { if (resume === operation) resume = undefined; });
        resumeEpoch = currentEpoch; resume = operation; return operation;
      } catch { return Promise.resolve(); }
    },
    setEnabled(value) {
      if (disposed) return;
      enabled = value;
      try { localStorage.setItem(KEY, String(value)); } catch { /* Keep the visit's in-memory setting. */ }
      if (!value) silence();
    },
    setPlaying(value) { playing = value; if (value) startMusic(); else stopMusic(); },
    cue(sound) {
      if (!allowed() || !context || context.currentTime - lastCue < .065) return;
      lastCue = context.currentTime;
      for (const spec of lifeSoundNotes(sound)) schedule(spec, context.currentTime + .005, false);
    },
    dispose() {
      if (disposed) return;
      silence(); disposed = true; document.removeEventListener('visibilitychange', hide);
      if (context) void context.close().catch(() => {});
      filter?.disconnect(); master?.disconnect(); if (activeScope === scope) activeScope = undefined;
    },
  };
  activeScope = scope;
  return scope;
}
