import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createLifeAudio, readLifeAudioPreference, type LifeAudio, type LifeSound } from './audio';
import { Icon } from '../Icons';

interface SoundControls { enabled: boolean; toggle(): void; cue(sound: LifeSound): void; playing(value: boolean): void }
const SoundContext = createContext<SoundControls>({ enabled: false, toggle() {}, cue() {}, playing() {} });
export const useLifeSound = () => useContext(SoundContext);

/** One quiet audio scope for the whole visit; changing sheets never restarts it. */
export function LifeSoundProvider({ children }: { children: ReactNode }) {
  const audio = useRef<LifeAudio | undefined>(undefined);
  const [enabled, setEnabled] = useState(readLifeAudioPreference);
  useEffect(() => {
    const scope = createLifeAudio(); audio.current = scope;
    const unlock = () => { void scope.unlock(); };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button, summary, a') : null;
      if (!target || target.closest('.v2-sound-toggle, .v2-sound-icon') || target.matches(':disabled, [aria-disabled="true"]')) return;
      const label = target.getAttribute('aria-label') || target.textContent || '';
      const sound: LifeSound = /^(back|close|cancel)/i.test(label.trim()) ? 'back' : 'select';
      void scope.unlock().then(() => scope.cue(sound));
    };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); document.removeEventListener('click', click, true);
      scope.dispose(); if (audio.current === scope) audio.current = undefined;
    };
  }, []);
  const toggle = useCallback(() => {
    const scope = audio.current; if (!scope) return;
    const next = !scope.enabled; scope.setEnabled(next); setEnabled(next);
    if (next) void scope.unlock().then(() => scope.cue('select'));
  }, []);
  const cue = useCallback((sound: LifeSound) => audio.current?.cue(sound), []);
  const playing = useCallback((value: boolean) => audio.current?.setPlaying(value), []);
  const value = useMemo(() => ({ enabled, toggle, cue, playing }), [enabled, toggle, cue, playing]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function LifeSoundToggle() {
  const sound = useLifeSound();
  return <button className="v2-sound-toggle" aria-pressed={sound.enabled} onClick={sound.toggle}>
    <Icon name={sound.enabled ? 'sound' : 'muted'} size={16}/><span>Sound {sound.enabled ? 'on' : 'off'}</span><i aria-hidden="true"/>
  </button>;
}

export function LifeSoundButton({ className = '' }: { className?: string }) {
  const sound = useLifeSound(), label = sound.enabled ? 'Mute sound' : 'Turn sound on';
  return <button className={`v2-icon-button v2-sound-icon ${className}`} aria-pressed={sound.enabled} aria-label={label} title={label} onClick={sound.toggle}><Icon name={sound.enabled ? 'sound' : 'muted'} size={16}/></button>;
}
