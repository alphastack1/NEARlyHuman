import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type SavedDay, type SavedDaysPage } from './api';

export interface SavedDaysPanelProps {
  tokenId: string;
  cached?: SavedDaysPage;
  onData?: (page: SavedDaysPage) => void;
  onWatch: (day: SavedDay) => void;
  onActions: (day: SavedDay) => void;
}

interface ListState {
  tokenId: string;
  page?: SavedDaysPage;
  loading: boolean;
  error?: string;
  failedBefore?: number;
}

const matchingCache = (tokenId: string, cached?: SavedDaysPage) => cached?.rooster.id === tokenId ? cached : undefined;

/** Older-page reads keep the visible head; a head refresh may prepend new days. */
function mergePage(previous: SavedDaysPage | undefined, incoming: SavedDaysPage, appendOlder = false): SavedDaysPage {
  const byDay = new Map<number, SavedDay>();
  const sameToken = previous?.rooster.id === incoming.rooster.id;
  if (sameToken) {
    for (const day of previous.days) if (day.day <= incoming.rooster.latestDay) byDay.set(day.day, day);
  }
  for (const day of incoming.days) byDay.set(day.day, day);
  const days: SavedDay[] = [];
  const cachedHead = sameToken ? previous.days.find(day => day.day <= incoming.rooster.latestDay)?.day : undefined;
  const head = appendOlder ? cachedHead ?? incoming.days[0]?.day : incoming.days[0]?.day ?? cachedHead;
  for (let day = head ?? 0; byDay.has(day); day--) {
    const row = byDay.get(day)!;
    days.push({ ...row, protected: day === incoming.rooster.latestDay });
  }
  const last = days.at(-1)?.day;
  return { rooster: incoming.rooster, days, nextBefore: last && last > 1 ? last : undefined };
}

function dateLabel(value: number, milliseconds = false): string | undefined {
  const date = new Date(milliseconds ? value : value * 1000);
  if (!Number.isFinite(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SavedDaysPanel({ tokenId, cached, onData, onWatch, onActions }: SavedDaysPanelProps) {
  const [state, setState] = useState<ListState>(() => ({ tokenId, page: matchingCache(tokenId, cached), loading: true }));
  const stateRef = useRef(state);
  const handlers = useRef({ onData, onWatch, onActions });
  const cachedRef = useRef(cached);
  const generation = useRef(0);
  const busy = useRef(false);
  stateRef.current = state;
  cachedRef.current = cached;
  handlers.current = { onData, onWatch, onActions };

  async function load(before?: number, refresh = false) {
    if (busy.current && !refresh) return;
    busy.current = true;
    const ticket = ++generation.current;
    setState(previous => ({ ...previous, tokenId, loading: true, error: undefined, failedBefore: undefined }));
    try {
      const incoming = await api.days(tokenId, before);
      if (ticket !== generation.current || incoming.rooster.id !== tokenId) return;
      const previous = stateRef.current.tokenId === tokenId ? stateRef.current.page : matchingCache(tokenId, cachedRef.current);
      const page = mergePage(previous, incoming, before !== undefined);
      setState({ tokenId, page, loading: false });
      handlers.current.onData?.(page);
    } catch (error) {
      if (ticket !== generation.current) return;
      setState(previous => ({ ...previous, tokenId, loading: false, failedBefore: before,
        error: error instanceof ApiError ? error.message : 'Saved days are unavailable. Please try again.' }));
    } finally {
      if (ticket === generation.current) busy.current = false;
    }
  }

  useEffect(() => {
    busy.current = false;
    setState({ tokenId, page: matchingCache(tokenId, cachedRef.current), loading: true });
    void load(undefined, true);
    return () => { generation.current++; busy.current = false; };
  }, [tokenId]);

  const current: ListState = state.tokenId === tokenId ? state : { tokenId, loading: true };
  const page = current.page;
  return <div className="saved-days-list" aria-busy={current.loading}>
    {page && <p className="saved-days-context">{page.rooster.state.name} · #{page.rooster.id}</p>}
    {page?.days.map(day => {
      const saved = dateLabel(day.savedAt);
      const retention = !day.protected && day.retentionEnd !== undefined ? dateLabel(day.retentionEnd, true) : undefined;
      return <article className={'saved-days-row ' + (day.alive ? '' : 'saved-days-final')} key={day.day} data-saved-day={day.day}>
        <div className="saved-days-heading"><strong>Day {day.day}</strong><span>LV{String(day.level).padStart(2, '0')}</span><span className={'life-badge ' + (day.alive ? 'alive' : 'dead')}>{day.alive ? 'Alive' : 'Final day'}</span></div>
        {saved && <time className="saved-days-date" dateTime={new Date(day.savedAt * 1000).toISOString()}>{saved}</time>}
        <div className="saved-days-controls">
          {day.replayAvailable !== false ? <><button className="button secondary saved-days-watch" onClick={() => handlers.current.onWatch(day)}>Watch day {day.day}</button><button className="text-button saved-days-actions" aria-label={'Saved actions for day ' + day.day} onClick={() => handlers.current.onActions(day)}>Saved actions</button></> : <button className="button secondary saved-days-actions" aria-label={'Saved actions for day ' + day.day} onClick={() => handlers.current.onActions(day)}>Saved actions</button>}
        </div>
        {retention && <p className="saved-days-retention">Replay kept until {retention}</p>}
        {day.replayAvailable === false && <p className="saved-days-unavailable">Replay unavailable</p>}
      </article>;
    })}
    {!page?.days.length && !current.error && <p className="saved-days-empty">{current.loading ? 'Reading saved days…' : 'No saved days yet.'}</p>}
    {current.error && <div className="saved-days-error"><p className="error-message" role="alert">{current.error}</p><button className="button secondary" disabled={current.loading} onClick={() => void load(current.failedBefore)}>Try again</button></div>}
    {page?.nextBefore !== undefined && !current.error && <button className="button secondary saved-days-more" disabled={current.loading} onClick={() => void load(page.nextBefore)}>{current.loading ? 'Reading saved days…' : 'Older days'}</button>}
  </div>;
}
