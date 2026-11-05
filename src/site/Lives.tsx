import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../app/Icons';
import { v2ItemImage } from '../art/v2-items';
import { bedArt } from '../game/v2/art';
import { ITEMS, type Plot } from '../v2/types';
import { PLANTS } from '../v2/catalog';
import type { GamePublicLife } from '../chain/game-types';
import type { PublicLifeDirectory, PublicLifeSummary } from '../chain/discovery-types';
import { PROJECT } from './project';
import { exploreControls, exploreHref, exploreMemoryFresh, exploreQuery, lifeExplorer, lifeImage, loadExploreMemory, nhcAmount, ownerExplorer, publicLifeHref, publicLifeWorld, PublicReadError, readDays, readDirectory, readLife, refreshedDirectory, returnToExplore, saveExploreMemory, shortOwner, validLifeId, visitHref, worldById, type ExploreControls, type PublicWorld } from './public-lives';
import './lives.css';

function Section({ title, icon, children, className = '' }: { title: string; icon: IconName; children: ReactNode; className?: string }) {
  return <section className={`life-section ${className}`}><div className="site-titlebar"><span><Icon name={icon} size={17}/><h2>{title}</h2></span></div><div className="life-section-body">{children}</div></section>;
}
function LifeStatus({ alive }: { alive: boolean }) { return <span className={`life-status ${alive ? 'is-alive' : 'is-remembered'}`}><i aria-hidden="true"/>{alive ? 'Living' : 'Remembered'}</span>; }
function Arrow() { return <span aria-hidden="true">↗</span>; }
function CopyIcon() { return <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 1h12v3H5v11H2zM7 6h11v13H7zm2 2v9h7V8z"/></svg>; }
function FilterIcon() { return <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true"><path d="M0 3h16v2H0zM0 11h16v2H0zM4 1h2v6H4zM10 9h2v6h-2z"/></svg>; }
function Item({ index, className = '' }: { index: number; className?: string }) { return <img className={`life-item-art ${className}`} src={v2ItemImage(index)} alt="" width="40" height="40"/>; }
const plotImages = new Map<string, string>();
function plotImage(plot: Plot): string {
  const key = [plot.kind, plot.ticks, plot.moisture, plot.dry, Number(plot.soilBlocked)].join(':');
  let value = plotImages.get(key);
  if (!value) { value = bedArt(plot).toDataURL(); if (plotImages.size >= 128) plotImages.delete(plotImages.keys().next().value!); plotImages.set(key, value); }
  return value;
}
const itemLabel = (index: number) => (ITEMS[index] || 'Item').replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Could not reach these lives. Try again.';
function lifeMetadata(world: PublicWorld, life: GamePublicLife) {
  const title = `${life.name} #${life.id} · NEARlyHuman`, url = new URL(publicLifeHref(world, life.id), PROJECT.siteUrl).href;
  const description = `${life.name} #${life.id} on ${world.name}. Visit its home, garden, belongings and saved days.`;
  document.title = title;
  for (const [attribute, name, content] of [['name', 'description', description], ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:url', url], ['name', 'twitter:title', title], ['name', 'twitter:description', description]] as const) {
    let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`); if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, name); document.head.append(meta); } meta.content = content;
  }
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); } canonical.href = url;
}
function LifeActions({ world, id, latest }: { world: PublicWorld; id: string; latest?: number }) {
  const inline = useRef<HTMLAnchorElement>(null), [dock, setDock] = useState(false);
  useEffect(() => {
    const node = inline.current; if (!node) return;
    const update = () => setDock(node.getBoundingClientRect().bottom <= 0);
    const observer = new IntersectionObserver(([entry]) => setDock(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0))); observer.observe(node);
    window.addEventListener('scroll', update, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', update); };
  }, []);
  return <><div className="life-actions"><a ref={inline} className="site-button site-primary life-visit" href={visitHref(world, id)}><Icon name="house" size={19}/>Visit home <Arrow/></a>{latest !== undefined && <a className="life-watch" href={visitHref(world, id, latest)}><Icon name="play" size={15}/>Watch day {latest}<span aria-hidden="true">→</span></a>}</div>{dock && <div className="life-visit-dock"><a className="site-button site-primary life-visit" href={visitHref(world, id)}><Icon name="house" size={18}/>Visit home <Arrow/></a></div>}</>;
}

function DirectoryCard({ life, world, ranked, index, from, onVisit }: { life: PublicLifeSummary; world: PublicWorld; ranked: boolean; index: number; from: string; onVisit: () => void }) {
  return <a className="lives-card" href={publicLifeHref(world, life.id, from)} onClick={onVisit} aria-label={`Visit ${life.name}, rooster ${life.id}`}>
    <div className="lives-card-art"><img src={lifeImage(world, life.id)} width="640" height="640" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" alt={`${life.name} and its saved home`}/>{ranked && <span className="lives-rank" aria-label={`Rank ${life.rank}`}>#{life.rank}</span>}</div>
    <div className="lives-card-copy"><div className="lives-card-name"><h2>{life.name}</h2><span>#{life.id}</span></div><div className="lives-card-facts"><span>{life.level.toLocaleString()} {life.level === 1 ? 'day' : 'days'} lived</span><LifeStatus alive={life.alive}/></div><div className="lives-card-visit"><span>{life.plantedBeds ? <><Icon name="leaf" size={14}/>{life.plantedBeds} of 4 beds planted</> : <><Icon name="house" size={14}/>A home of its own</>}</span><strong>Visit <span aria-hidden="true">→</span></strong></div></div>
  </a>;
}

export function ExplorePage() {
  const initial = useMemo(() => exploreControls(), []), initialKey = exploreQuery(initial);
  const initialMemory = useMemo(() => loadExploreMemory(initial), [initial]);
  const [controls, setControls] = useState<ExploreControls>(initial), [search, setSearch] = useState(initial.query);
  const [directory, setDirectory] = useState<PublicLifeDirectory | undefined>(initialMemory?.directory), [dataKey, setDataKey] = useState(initialMemory ? initialKey : '');
  const [loading, setLoading] = useState(!initialMemory), [more, setMore] = useState(false), [error, setError] = useState(''), [moreError, setMoreError] = useState(''), [attempt, setAttempt] = useState(0);
  const searchInput = useRef<HTMLInputElement>(null), filter = useRef<HTMLDetailsElement>(null), generation = useRef(0), moreAbort = useRef<AbortController | undefined>(undefined), restored = useRef(false), checkedAt = useRef(initialMemory?.checkedAt || 0);
  const key = exploreQuery(controls), world = worldById(controls.world, controls.collection)!;
  useEffect(() => { const timer = setTimeout(() => setControls(value => value.query === search ? value : { ...value, query: search }), 280); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const pop = () => { const value = exploreControls(); setControls(value); setSearch(value.query); };
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (filter.current?.open && event.target instanceof Node && !filter.current.contains(event.target)) filter.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && filter.current?.open) { event.preventDefault(); filter.current.open = false; filter.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  useEffect(() => {
    document.title = 'Explore lives · NEARlyHuman';
    const url = new URL(location.href); url.search = key; history.replaceState(history.state, '', url.pathname + url.search);
    const current = ++generation.current, controller = new AbortController(); moreAbort.current?.abort(); setMore(false); setMoreError(''); setError('');
    const cached = loadExploreMemory(controls);
    if (cached) { setDirectory(cached.directory); setDataKey(key); checkedAt.current = cached.checkedAt; if (attempt === 0 && exploreMemoryFresh(cached)) { setLoading(false); return () => controller.abort(); } }
    setLoading(true);
    void readDirectory(controls, undefined, controller.signal).then(value => {
      if (generation.current !== current) return; const refreshed = refreshedDirectory(value, cached?.directory); checkedAt.current = Date.now(); setDirectory(refreshed); setDataKey(key); saveExploreMemory(controls, refreshed, checkedAt.current, cached?.scroll || 0);
    }).catch(reason => { if (!controller.signal.aborted && generation.current === current) setError(errorMessage(reason)); }).finally(() => { if (generation.current === current) setLoading(false); });
    return () => controller.abort();
  }, [key, attempt]);
  useLayoutEffect(() => {
    if (!restored.current && initialMemory && directory && key === initialKey) { restored.current = true; const frame = requestAnimationFrame(() => window.scrollTo(0, initialMemory.scroll)); return () => cancelAnimationFrame(frame); }
  }, [directory, key, initialKey, initialMemory]);
  useEffect(() => {
    const remember = () => { if (directory && dataKey === key) saveExploreMemory(controls, directory, checkedAt.current); };
    window.addEventListener('pagehide', remember); return () => window.removeEventListener('pagehide', remember);
  }, [controls, directory, dataKey, key]);
  useEffect(() => () => moreAbort.current?.abort(), []);
  async function loadMore() {
    if (!directory?.nextCursor || more || loading || dataKey !== key) return;
    const current = generation.current, controller = new AbortController(); moreAbort.current = controller; setMore(true); setMoreError('');
    try {
      const next = await readDirectory(controls, directory.nextCursor, controller.signal); if (current !== generation.current) return;
      if (next.snapshot.id !== directory.snapshot.id) throw new PublicReadError('These lives have changed. Refresh the list.', 409);
      const merged = { ...next, items: [...new Map([...directory.items, ...next.items].map(life => [life.id, life])).values()] };
      setDirectory(merged); saveExploreMemory(controls, merged, checkedAt.current);
    } catch (reason) { if (!controller.signal.aborted && current === generation.current) setMoreError(errorMessage(reason)); }
    finally { if (current === generation.current) setMore(false); }
  }
  const matching = dataKey === key ? directory : undefined;
  const resetFilters = () => { setSearch(''); setControls(value => ({ ...value, query: '', status: 'all' })); };
  const remember = () => { if (matching) saveExploreMemory(controls, matching, checkedAt.current); };
  return <div className="lives-page">
    <div className="lives-intro"><div><span className="site-eyebrow">Lives of their own</span><h1>Meet the roosters.</h1><p>Homes, habits and days of their own.</p></div><label className="lives-world"><span>World</span><select aria-label="Choose world to explore" value={controls.world} onChange={event => { setControls(value => ({ ...value, world: event.target.value as ExploreControls['world'], collection: undefined })); setAttempt(0); }}>{PROJECT.worlds.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label></div>
    <div className="lives-browser">
      <div className="lives-browser-bar"><div className="lives-view-tabs" role="group" aria-label="Browse lives"><button type="button" aria-pressed={controls.sort === 'newest'} onClick={() => setControls(value => ({ ...value, sort: 'newest' }))}>Discover</button><button type="button" aria-pressed={controls.sort === 'longest'} onClick={() => setControls(value => ({ ...value, sort: 'longest' }))}>Longest lives</button></div><div className="lives-find"><div className="lives-search"><label><span className="site-search-glass"/><input ref={searchInput} type="search" maxLength={40} value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or #number" aria-label="Find a rooster"/></label>{search && <button type="button" className="lives-clear" aria-label="Clear rooster search" onClick={() => { setSearch(''); searchInput.current?.focus(); }}><Icon name="close" size={14}/></button>}</div><details ref={filter} className="lives-filter"><summary aria-label="Filter lives"><FilterIcon/><span>{controls.status === 'all' ? 'Filter' : controls.status === 'alive' ? 'Living' : 'Remembered'}</span></summary><div role="group" aria-label="Life status">{([['all', 'All lives'], ['alive', 'Living'], ['remembered', 'Remembered']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={controls.status === value} onClick={() => { setControls(c => ({ ...c, status: value })); if (filter.current) { filter.current.open = false; filter.current.querySelector('summary')?.focus(); } }}>{label}</button>)}</div></details></div></div>
      <div className="lives-results-heading"><span>{controls.sort === 'longest' ? 'Completed game days · equal days share a rank' : 'Newest lives first'}</span><span aria-live="polite">{loading ? 'Opening lives…' : matching ? `${matching.total.toLocaleString()} ${matching.total === 1 ? 'life' : 'lives'}` : ''}</span></div>
      {error && <div className="lives-read-error" role="status"><span>{error}</span><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
      {loading && !matching ? <div className="lives-grid lives-skeleton" aria-label="Loading roosters" role="status">{[0, 1, 2, 3].map(index => <div key={index}><span/><i/></div>)}</div>
        : matching?.items.length ? <div className={`lives-grid${matching.collectionTotal === 1 && !controls.query.trim() && controls.status === 'all' ? ' lives-singleton' : ''}`} aria-busy={loading}>{matching.items.map((life, index) => <DirectoryCard key={`${world.collection}:${life.id}`} life={life} world={world} index={index} ranked={controls.sort === 'longest'} from={exploreHref(controls)} onVisit={remember}/>)}</div>
          : matching && <div className="lives-empty"><Icon name={matching.collectionTotal ? 'leaf' : 'house'} size={38}/><h2>{matching.collectionTotal ? 'No matching roosters.' : 'No lives here yet.'}</h2>{matching.collectionTotal ? <button type="button" className="site-button site-secondary" onClick={resetFilters}>Show all lives <span aria-hidden="true">→</span></button> : <a className="site-button site-primary" href={`${world.appHref}&entry=hatch`}>Hatch a rooster <Arrow/></a>}</div>}
      {matching?.nextCursor && <div className="lives-more"><button type="button" className="site-button site-secondary" disabled={more || loading} onClick={() => void loadMore()}>{more ? 'Opening more…' : 'More roosters'}<span aria-hidden="true">↓</span></button></div>}
      {moreError && <div className="lives-read-error" role="status"><span>{moreError}</span><button type="button" onClick={() => setAttempt(value => value + 1)}>Refresh list</button></div>}
      {matching && <div className="lives-snapshot-note">{matching.snapshot.stale ? 'Last saved view' : 'Saved onchain'}<span aria-hidden="true"> · </span>{new Date(matching.snapshot.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
    </div>
  </div>;
}

function MissingLife({ retry, missing, back }: { retry?: () => void; missing: boolean; back: string }) {
  return <div className="life-not-found"><Icon name="house" size={48}/><h1>{missing ? 'This life could not be found.' : 'This home could not be opened.'}</h1><p>{missing ? 'Choose another rooster to visit.' : 'Give it another try.'}</p><div>{retry && !missing && <button type="button" className="site-button site-primary" onClick={retry}>Try again</button>}<a className="site-text-link" href={back}>Explore lives <span aria-hidden="true">→</span></a></div></div>;
}
export function PublicLifePage({ worldId, id, collection }: { worldId: string; id: string; collection?: string }) {
  const world = publicLifeWorld(worldId, collection);
  return world && validLifeId(id) ? <LifeDetail key={`${world.collection}:${id}`} world={world} id={id}/> : <MissingLife missing back="/explore"/>;
}
function LifeDetail({ world, id }: { world: PublicWorld; id: string }) {
  const [life, setLife] = useState<GamePublicLife>(), [error, setError] = useState<PublicReadError>(), [attempt, setAttempt] = useState(0);
  const [days, setDays] = useState<{ day: number; rewardMicro: string }[]>([]), [nextBefore, setNextBefore] = useState<number>(), [daysBusy, setDaysBusy] = useState(true), [daysError, setDaysError] = useState('');
  const [copied, setCopied] = useState<'link' | 'owner'>(), [manualCopy, setManualCopy] = useState<string>(), manualInput = useRef<HTMLInputElement>(null), daysGeneration = useRef(0), daysAbort = useRef<AbortController | undefined>(undefined);
  const back = useMemo(() => returnToExplore(world), [world]);
  useEffect(() => {
    const controller = new AbortController(); setError(undefined);
    const portrait = new Image(); portrait.fetchPriority = 'high'; portrait.src = lifeImage(world, id);
    void readLife(world, id, controller.signal).then(value => { setLife(value); lifeMetadata(world, value); }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof PublicReadError ? reason : new PublicReadError(errorMessage(reason))); });
    return () => controller.abort();
  }, [world, id, attempt]);
  useEffect(() => { void loadDays(); return () => { daysGeneration.current++; daysAbort.current?.abort(); }; }, [world, id]);
  async function loadDays(before?: number) {
    const current = ++daysGeneration.current, controller = new AbortController(); daysAbort.current?.abort(); daysAbort.current = controller; setDaysBusy(true); setDaysError('');
    try { const value = await readDays(world, id, before, controller.signal); if (current !== daysGeneration.current) return; setDays(previous => before === undefined ? value.days : [...new Map([...previous, ...value.days].map(day => [day.day, day])).values()]); setNextBefore(value.nextBefore); }
    catch (reason) { if (!controller.signal.aborted && current === daysGeneration.current) setDaysError(errorMessage(reason)); }
    finally { if (current === daysGeneration.current) setDaysBusy(false); }
  }
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(undefined), 2200); return () => clearTimeout(timer); }, [copied]);
  useEffect(() => { if (manualCopy) { manualInput.current?.focus(); manualInput.current?.select(); } }, [manualCopy]);
  async function copy(value: string, kind: 'owner' | 'link') {
    try { await navigator.clipboard.writeText(value); setCopied(kind); setManualCopy(undefined); }
    catch { setManualCopy(value); }
  }
  if (error && !life) return <MissingLife missing={error.status === 404} retry={() => setAttempt(value => value + 1)} back={back}/>;
  if (!life) return <div className="life-page"><a href={back} className="life-back"><Icon name="back" size={15}/>Explore lives</a><div className="life-loading" role="status"><div/><span>Opening this home…</span></div></div>;
  const latest = days[0]?.day;
  const stock = life.state.inventory.flatMap((amount, index) => amount > 0 ? [{ amount, index }] : []);
  const planted = life.state.plots.filter(plot => plot.kind > 0).length;
  return <div className="life-page">
    <nav className="life-breadcrumb" aria-label="Life navigation"><a href={back}><Icon name="back" size={14}/>Explore lives</a><span aria-hidden="true">/</span><span>{world.shortName}</span><span aria-hidden="true">/</span><span>#{id}</span></nav>
    {error && <div className="lives-read-error" role="status"><span>{error.message}</span><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    <div className="life-hero"><div className="life-portrait-window"><div className="site-titlebar"><span><Icon name="house" size={17}/>{world.name}</span></div><img src={lifeImage(world, id)} width="640" height="640" fetchPriority="high" alt={`${life.name} and its saved home`}/></div>
      <div className="life-identity"><div className="life-name-row"><div><span className="site-eyebrow">NEARlyHuman NFT</span><h1>{life.name}<small>#{id}</small></h1></div><button type="button" className="life-share" aria-label={copied === 'link' ? 'Life link copied' : 'Copy life link'} onClick={() => void copy(new URL(publicLifeHref(world, id), location.origin).href, 'link')}>{copied === 'link' ? <Icon name="check" size={18}/> : <CopyIcon/>}<span>{copied === 'link' ? 'Copied' : 'Copy link'}</span></button></div>
        <div className="life-summary"><LifeStatus alive={life.state.alive}/><span>Day {life.state.day.toLocaleString()}</span>{life.pendingRequest && <span className="life-day-pending">Day in progress</span>}</div>
        <LifeActions world={world} id={id} latest={latest}/>
        <div className="life-owner"><span>Owned by</span><a href={ownerExplorer(world, life.owner)} target="_blank" rel="noopener noreferrer">{shortOwner(life.owner)} <Arrow/></a><button type="button" onClick={() => void copy(life.owner, 'owner')} aria-label={copied === 'owner' ? 'Owner copied' : 'Copy owner'}>{copied === 'owner' ? <Icon name="check" size={17}/> : <CopyIcon/>}</button></div>
        {manualCopy && <label className="life-copy-field">Copy link or address<input ref={manualInput} value={manualCopy} readOnly aria-label="Link or address to copy" onClick={event => event.currentTarget.select()}/></label>}
        <div className="life-strengths"><div><span>Strengths</span><a href="/docs/strengths-personality" aria-label="About strengths"><Icon name="info" size={13}/></a></div><dl>{(['Body', 'Wits', 'Spirit'] as const).map((name, index) => <div key={name}><dt>{name}</dt><dd>{life.state.stats[index]}</dd></div>)}</dl></div>
        <div className="life-quiet-links"><a href={lifeExplorer(world, id)} target="_blank" rel="noopener noreferrer">View NFT on explorer <Arrow/></a><a href="/docs/nft-purse">About this NFT <span aria-hidden="true">→</span></a></div>
      </div>
    </div>
    <div className="life-facts-grid">
      <Section title="Garden" icon="leaf" className="life-garden"><div className="life-section-caption"><span>{planted} of 4 beds planted</span><a href="/docs/garden">Garden guide <span aria-hidden="true">→</span></a></div><div className="life-plots">{life.state.plots.map((plot, index) => <div key={index} className={`life-plot ${plot.kind ? 'is-planted' : ''}`}><div className="life-plot-soil"><img className="life-plot-art" src={plotImage(plot)} width="64" height="88" alt=""/></div><strong>{plot.kind ? PLANTS[plot.kind]?.name || 'Plant' : 'Unplanted'}</strong>{plot.kind > 0 && <small>{plot.soilBlocked ? 'Needs care' : plot.ticks === 0 ? 'Ready to harvest' : `${plot.ticks} wet ${plot.ticks === 1 ? 'night' : 'nights'} to grow`}</small>}</div>)}</div></Section>
      <Section title="NHC purse" icon="wallet" className="life-purse"><div className="life-purse-balance"><Icon name="wallet" size={31}/><strong>{nhcAmount(life.purseMicro)}<span>NHC</span></strong></div><p>Earned from shipments.</p><a href="/docs/nhc" className="site-text-link">How NHC works <span aria-hidden="true">→</span></a></Section>
      <Section title="Belongings" icon="house" className="life-belongings">{stock.length ? <div className="life-stock">{stock.map(({ index, amount }) => <div key={index}><Item index={index}/><span>{itemLabel(index)}</span><b>×{amount.toLocaleString()}</b></div>)}</div> : <div className="life-empty-stock"><Icon name="house" size={29}/><span>Room for what comes next.</span></div>}</Section>
      <Section title="Saved days" icon="book" className="life-days"><div className="life-days-list">{days.map(day => <a href={visitHref(world, id, day.day)} key={day.day}><span className="life-film-icon"><Icon name="play" size={17}/></span><strong>Day {day.day}</strong><span>Watch <span aria-hidden="true">→</span></span></a>)}</div>{daysBusy && <p className="life-days-status" role="status">Opening saved days…</p>}{daysError && <div className="lives-read-error" role="status"><span>{daysError}</span><button type="button" onClick={() => void loadDays()}>Try days again</button></div>}{!daysBusy && !daysError && !days.length && <div className="life-empty-stock"><Icon name="book" size={29}/><span>The first day is still ahead.</span></div>}{nextBefore && <button type="button" className="life-earlier-days" disabled={daysBusy} onClick={() => void loadDays(nextBefore)}>Earlier days <span aria-hidden="true">↓</span></button>}</Section>
    </div>
    <details className="life-onchain"><summary><Icon name="info" size={16}/>Onchain details<span aria-hidden="true">⌄</span></summary><dl><div><dt>Network</dt><dd>{world.name}</dd></div><div><dt>Standard</dt><dd>{world.id === 'near-testnet' ? 'NEP-171' : 'ERC-721'}</dd></div><div><dt>Collection</dt><dd><a href={world.explorer} target="_blank" rel="noopener noreferrer">{world.collection} <Arrow/></a></dd></div><div><dt>Token</dt><dd>#{id}</dd></div><div><dt>Owner</dt><dd><a href={ownerExplorer(world, life.owner)} target="_blank" rel="noopener noreferrer">{life.owner} <Arrow/></a></dd></div><div><dt>Saved block</dt><dd>{life.observedBlock}</dd></div></dl><a className="site-text-link" href={world.sourceHref} target="_blank" rel="noopener noreferrer">Contract source <Arrow/></a></details>
  </div>;
}
