import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import '@fontsource/press-start-2p/latin-400.css';
import { roosterSvg } from '../art/rooster';
import { Icon, type IconName } from '../app/Icons';
import { ARTICLES, GUIDE_GROUPS, getArticle, type GuideArticle } from './content';
import { PROJECT, SITE_IMAGES } from './project';
import { searchArticles } from './search';
import { parsePublicLifePath } from './life-routes';
import './site.css';
import HomePreview from './HomePreview';
import './arrival.css';

const ExplorePage = lazy(() => import('./Lives').then(module => ({ default: module.ExplorePage })));
const PublicLifePage = lazy(() => import('./Lives').then(module => ({ default: module.PublicLifePage })));
const OpeningLives = () => <div className="site-lives-opening" role="status"><Icon name="leaf" size={24}/><span>Opening lives…</span></div>;

const bird = (seed: string, pose: 'idle' | 'breathe' | 'peek' = 'idle') => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(roosterSvg(seed, 96, pose))}`;
const BIRDS = ['BOK', 'FERN', 'SAGE', 'MISO'];
const GROUP_ICONS: Record<string, IconName> = { start: 'house', home: 'leaf', ownership: 'wallet', technical: 'gear' };

function Arrow() { return <span aria-hidden="true">↗</span>; }
function BrandMark() { return <svg viewBox="0 0 24 24" width="24" height="24" shapeRendering="crispEdges" aria-hidden="true"><path fill="#8fc9d4" d="M0 0h24v24H0z"/><path fill="#fdf4d5" d="M3 3h4v2h4v2H1V5h2z"/><path fill="#588345" d="M0 17h4v-3h5v3h6v-4h5v3h4v8H0z"/><path fill="#8fb65b" d="M0 20h24v4H0z"/><path fill="#694c36" d="M6 12h13v10H6zM4 12l8-8 9 8z"/><path fill="#d67b4d" d="M6 11l6-5 7 5z"/><path fill="#f7d596" d="M8 13h9v8H8z"/><path fill="#4d7d8b" d="M12 16h3v6h-3zM9 14h2v2H9z"/><path fill="#e8e9bb" d="M1 21h2v2H1zM21 20h2v2h-2z"/></svg>; }
function AppLink({ children = 'Open App', className = '', href = PROJECT.appHref }: { children?: ReactNode; className?: string; href?: string }) {
  return <a className={`site-button site-primary ${className}`} href={href}>{children}<Arrow/></a>;
}
function External({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={`site-external ${className || ''}`}><span className="site-link-label">{children}</span><Arrow/></a>;
}
function WindowBar({ title, icon = 'house', children }: { title: string; icon?: IconName; children?: ReactNode }) {
  return <div className="site-titlebar"><span><Icon name={icon} size={17}/>{title}</span>{children || <span className="site-chrome" aria-hidden="true"><i/><i/><i/></span>}</div>;
}
function Header({ path, onSearch }: { path: string; onSearch: () => void }) {
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null), menuPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuTrigger.current?.contains(event.target) && !menuPanel.current?.contains(event.target)) setMenu(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false); menuTrigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menu]);
  const openSearch = () => { setMenu(false); onSearch(); };
  return <header className="site-header">
    <div className="site-brandbar"><a href="/" className="site-brand" aria-label="NEARlyHuman home"><span className="site-brand-icon"><BrandMark/></span><span>NEARlyHuman</span></a>
      <a href="/docs/worlds-wallets" className="site-worlds"><span className="site-world-names">NEAR + Robinhood · </span>Testnet</a>
      <button ref={menuTrigger} className="site-more" type="button" aria-label="More pages" aria-expanded={menu} aria-controls="site-more-pages" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} size={18}/></button>
      <span className="site-brand-squares" aria-hidden="true"><i/><i/></span>
    </div>
    <div className="site-navrow"><nav aria-label="Main navigation">
      <a href="/" className={`site-tab site-home-tab ${path === '/' ? 'is-current' : ''}`} aria-current={path === '/' ? 'page' : undefined}>Home</a>
      <a href="/the-game" className={`site-tab ${path === '/the-game' ? 'is-current' : ''}`} aria-current={path === '/the-game' ? 'page' : undefined}>The game</a>
      <a href="/explore" className={`site-tab site-explore-tab ${path === '/explore' || path.startsWith('/life/') ? 'is-current' : ''}`} aria-current={path === '/explore' || path.startsWith('/life/') ? 'page' : undefined}>Explore</a>
      <a href="/docs" className={`site-tab ${path.startsWith('/docs') ? 'is-current' : ''}`} aria-current={path.startsWith('/docs') ? 'page' : undefined}>Guide</a>
      <a href="/project" className={`site-tab site-project-tab ${path === '/project' ? 'is-current' : ''}`} aria-current={path === '/project' ? 'page' : undefined}>Project</a>
    </nav><div className="site-nav-actions"><button type="button" className="site-search-toggle" onClick={openSearch} aria-label="Search the guide"><span className="site-search-glass"/><span className="site-search-label">Search</span><kbd>Ctrl K</kbd></button><AppLink/></div></div>
    {menu && <nav ref={menuPanel} id="site-more-pages" className="site-more-menu" aria-label="More pages"><a href="/explore" aria-current={path === '/explore' || path.startsWith('/life/') ? 'page' : undefined}>Explore lives<Arrow/></a><a href="/project" aria-current={path === '/project' ? 'page' : undefined}>About the project<Arrow/></a><a href="/docs/contracts" aria-current={path === '/docs/contracts' ? 'page' : undefined}>Contracts & source<Arrow/></a><button type="button" onClick={openSearch}>Search the guide<span className="site-search-glass"/></button></nav>}
  </header>;
}

function HeroScene({ small = false }: { small?: boolean }) {
  const [identity, setIdentity] = useState(0);
  const [peek, setPeek] = useState(false);
  return <div className={`site-scene ${small ? 'is-small' : ''}`}>
    <div className="site-scene-sun" aria-hidden="true"/>
    <svg className="site-cloud cloud-one" viewBox="0 0 100 40" aria-hidden="true"><path d="M0 24h12V12h16V0h28v9h16v10h20v9h8v12H0z"/></svg>
    <svg className="site-cloud cloud-two" viewBox="0 0 100 40" aria-hidden="true"><path d="M0 24h12V12h16V0h28v9h16v10h20v9h8v12H0z"/></svg>
    <picture className="site-environment-picture">
      <source type="image/avif" srcSet={SITE_IMAGES.hero.avifSrcSet} sizes={small ? SITE_IMAGES.hero.smallSizes : SITE_IMAGES.hero.sizes}/>
      <source type="image/webp" srcSet={SITE_IMAGES.hero.webpSrcSet} sizes={small ? SITE_IMAGES.hero.smallSizes : SITE_IMAGES.hero.sizes}/>
      <img className="site-environment" src={SITE_IMAGES.hero.fallback} alt="A sunlit cottage with a four-bed garden, workbench and roadside mailbox" width="1448" height="1086" fetchPriority={small ? 'auto' : 'high'} loading={small ? 'lazy' : 'eager'} decoding="async"/>
    </picture>
    <button type="button" className="site-scene-rooster" aria-label="Meet another rooster" onPointerEnter={() => setPeek(true)} onPointerLeave={() => setPeek(false)} onClick={() => setIdentity((identity + 1) % BIRDS.length)}>
      <img src={bird(BIRDS[identity], peek ? 'peek' : 'idle')} width="64" height="80" alt=""/><span className="site-rooster-shadow"/>
    </button>
    <span className="site-scene-flutter f1" aria-hidden="true"/><span className="site-scene-flutter f2" aria-hidden="true"/>
  </div>;
}
function Rooster({ seed = 'BOK', className = '' }: { seed?: string; className?: string }) {
  return <img className={`site-rooster ${className}`} src={bird(seed)} alt="Original procedurally generated rooster artwork" width="80" height="100"/>;
}
function PixelEgg() { return <svg className="site-object" viewBox="0 0 48 56" aria-hidden="true"><path fill="#173f35" d="M20 2h8v4h4v6h4v6h4v10h4v14h-4v6h-8v4H16v-4H8v-6H4V28h4V18h4v-6h4V6h4z"/><path fill="#ffe5a1" d="M20 6h8v6h4v8h4v10h4v12h-8v6H16v-6H8V30h4V20h4v-8h4z"/><path fill="#fff7d5" d="M20 10h4v4h4v10h4v10H12v-8h4V16h4z"/><path fill="#e4bd75" d="M16 38h4v4h-4zM28 28h4v4h-4zM28 40h8v4h-8z"/></svg>; }
function FilmArt() { return <svg className="site-film" viewBox="0 0 40 34" aria-hidden="true"><path fill="#193d32" d="M0 0h40v34H0z"/><path fill="#fff2c9" d="M4 3h4v4H4zM13 3h4v4h-4zM23 3h4v4h-4zM32 3h4v4h-4zM4 27h4v4H4zM13 27h4v4h-4zM23 27h4v4h-4zM32 27h4v4h-4z"/><path fill="#d5e4b2" d="M5 10h30v14H5z"/><path fill="#315b40" d="M16 12v10l11-5z"/></svg>; }
function ParcelArt() { return <svg className="site-parcel" viewBox="0 0 160 92" aria-hidden="true"><path fill="#1d4439" d="M8 33h144v52H8zM20 19h120v14H20z"/><path fill="#dca061" d="M12 37h136v44H12z"/><path fill="#f3c98a" d="M24 23h112v10H24zM12 39h136v9H12z"/><path fill="#936542" d="M56 39h4v42h-4zM103 39h4v42h-4z"/>
      <path fill="#225576" d="M27 3h14v8h4v23H23V11h4z"/><path fill="#86d4ef" d="M27 14h14v17H27z"/><path fill="#fff9dc" d="M27 1h14v6H27zM27 20h14v5H27z"/>
      <path fill="#704427" d="M66 17h5v-5h22v5h5v17H66z"/><path fill="#edb46a" d="M70 18h24v12H70z"/><path fill="#fff0b5" d="M73 14h4v11h-4zM83 14h4v11h-4z"/>
      <path fill="#5f5030" d="M113 6h27v28h-27z"/><path fill="#f6dfa1" d="M116 9h21v23h-21z"/><path fill="#6a9c48" d="M124 15h4v12h-4zM119 14h5v6h-5zM128 12h5v6h-5z"/></svg>; }
function WorkshopArt() { return <svg className="site-workshop" viewBox="0 0 140 100" aria-hidden="true"><path fill="#20483c" d="M5 48h130v18H5zM15 66h11v32H15zM115 66h11v32h-11z"/><path fill="#bd8450" d="M9 52h122v9H9zM19 66h5v28h-5zM119 66h5v28h-5z"/><path fill="#4b726b" d="M50 39h63l-12 13H64z"/><path fill="#efbb72" d="M54 39h55l-9 8H64z"/><path fill="#234b3e" d="M82 4h4v35h-4z"/><path fill="#ffedb0" d="M78 10 58 35h20zM89 16v19h17z"/><path fill="#e08e55" d="M89 7h17v10H89zM15 34h27v8H15zM19 26h29v8H19z"/></svg>; }
function QuietNote({ children }: { children: ReactNode }) { return <div className="site-quiet-note"><Icon name="leaf" size={17}/>{children}</div>; }
function SectionLink({ href, children }: { href: string; children: ReactNode }) { return <a className="site-text-link" href={href}><span className="site-link-label">{children}</span><span aria-hidden="true">→</span></a>; }

function Home({ onSearch }: { onSearch(): void }) {
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null), menuPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menuTrigger.current?.contains(event.target) && !menuPanel.current?.contains(event.target)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); menuTrigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menu]);
  const appHref = '/app?v2=1&entry=app';
  return <div className="site arrival-site"><a className="site-skip-link" href="#home-title">Skip to content</a><div className="arrival-shell">
    <header className="arrival-header"><a href="/" className="arrival-brand" aria-label="NEARlyHuman home"><BrandMark/><span>NEARlyHuman</span></a><nav aria-label="Website"><a href="/explore">Explore</a><a href="/docs">Guide</a><button ref={menuTrigger} type="button" aria-label="More pages" aria-expanded={menu} aria-controls="arrival-menu" onClick={() => setMenu(value => !value)}><Icon name={menu ? 'close' : 'menu'} size={20}/></button></nav>{menu && <nav ref={menuPanel} id="arrival-menu" className="arrival-menu" aria-label="More pages"><a href="/the-game">The game <Arrow/></a><a href="/project">The project <Arrow/></a><a href="/docs/contracts">Contracts & source <Arrow/></a><button type="button" onClick={() => { setMenu(false); onSearch(); }}>Search the guide <Icon name="book" size={17}/></button></nav>}</header>
    <main><section className="arrival-hero" aria-labelledby="home-title"><div className="arrival-intro"><span className="site-eyebrow">An AI-led NFT life game</span><h1 id="home-title">You prepare.<br/> <span>They decide.</span></h1><p>Hatch a rooster. Bring the supplies.<br/> Watch a life of its own unfold.</p></div><div className="arrival-preview"><HomePreview/></div><div className="arrival-actions"><AppLink href={appHref}>Open App</AppLink><SectionLink href="/the-game">Meet the game</SectionLink><p><Icon name="leaf" size={15}/>Nothing ages while you’re away.</p></div></section>
    <section className="arrival-loop" aria-label="How it plays"><a href="/the-game#hatch"><PixelEgg/><span><small>01</small><strong>Hatch a life</strong></span></a><a href="/the-game#pack"><ParcelArt/><span><small>02</small><strong>Bring supplies</strong></span></a><a href="/the-game#watch"><FilmArt/><span><small>03</small><strong>See what happens</strong></span></a><a className="arrival-explore" href="/explore"><span>Every life has a story.</span><strong>Explore the roosters <Arrow/></strong></a></section></main>
    <footer className="arrival-footer"><span>NEARlyHuman</span><nav aria-label="Footer"><a href="/project">The project</a><a href="/docs/contracts">Contracts</a><a href="/docs/privacy-data">Privacy</a><a href="/docs/worlds-wallets">NEAR + Robinhood testnets</a></nav></footer>
  </div></div>;
}
function GamePage() {
  return <div className="site-game-page"><div className="site-page-intro"><span className="site-eyebrow">How it plays</span><h1>You prepare.<br/> <span>They decide.</span></h1><p>Choose supplies and watch your rooster decide how to spend the day.</p></div>
    <div className="site-game-steps">
      <section id="hatch" className="site-game-step"><div className="site-step-art site-egg-art"><PixelEgg/><Rooster seed="FERN"/><i aria-hidden="true"/></div><div><span className="site-step-number">01 / A new beginning</span><h2>Hatch a life.</h2><p>A name, a home and a rooster with its own personality. Your NFT carries the life that follows.</p><SectionLink href="/docs/first-day">Start your first day</SectionLink></div></section>
      <section id="pack" className="site-game-step"><div className="site-step-art site-pack-art"><ParcelArt/><span className="site-supply-dot"/><span className="site-supply-dot"/><span className="site-supply-dot"/></div><div><span className="site-step-number">02 / The morning post</span><h2>Prepare its supplies.</h2><p>Choose up to three different supplies. A bite to eat, drinking water, perhaps a seed. Your rooster collects the post and decides how to use it.</p><SectionLink href="/docs/care-supplies">Care & supplies</SectionLink></div></section>
      <section id="watch" className="site-game-step"><div className="site-step-art site-work-art"><WorkshopArt/><span className="site-spark spark-a"/><span className="site-spark spark-b"/></div><div><span className="site-step-number">03 / A mind of its own</span><h2>Watch its day unfold.</h2><p>Jev chooses a project and the routines around it. Some days bring a harvest. Others bring a new craft, a rainy window or a very necessary nap.</p><p className="site-soft-copy">The day saves before its film plays. Its choices stay a surprise.</p></div></section>
    </div>
    <section className="site-growing-world"><div className="site-mini-window"><WindowBar title="Garden & workshop" icon="leaf"/><HeroScene small/></div><div><span className="site-eyebrow">A place to grow</span><h2>Grow crops.<br/>Build something.</h2><p>Four beds for flowers, fruit and wood trees. Wood for spoons, toy boats, birdhouses and chests. What it keeps, uses or sends away is part of the story.</p><div className="site-inline-links"><SectionLink href="/docs/garden">The garden</SectionLink><SectionLink href="/docs/workshop">The workshop</SectionLink></div></div></section>
    <section className="site-page-cta"><div><QuietNote>Nothing ages while you’re away.</QuietNote><h2>Start your<br/>first day.</h2></div><AppLink/></section>
  </div>;
}

function ArticleResult({ article, onNavigate }: { article: GuideArticle; onNavigate?: () => void }) {
  return <a className="site-search-result" href={`/docs/${article.slug}`} onClick={onNavigate}><Icon name={GROUP_ICONS[article.group] || 'book'} size={20}/><span><strong>{article.title}</strong><small>{article.summary}</small></span><span aria-hidden="true">→</span></a>;
}
function Search({ query, onQueryChange, onClose }: { query: string; onQueryChange: (query: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null);
  const results = searchArticles(query);
  useEffect(() => { const node = dialog.current!; node.showModal(); input.current?.focus(); return () => { if (node.open) node.close(); }; }, []);
  return <dialog ref={dialog} className="site-search-dialog" onCancel={onClose} onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }} onClick={event => { if (event.target === dialog.current) { const rect = dialog.current!.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <WindowBar title="Search the guide" icon="book"><button type="button" onClick={onClose} aria-label="Close search"><Icon name="close" size={15}/></button></WindowBar>
    <div className="site-dialog-search"><span className="site-search-glass"/><input ref={input} type="search" value={query} maxLength={160} onChange={e => onQueryChange(e.target.value)} placeholder="Try seeds, wallet or saved days…" aria-label="Search the guide" onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); dialog.current?.querySelector<HTMLAnchorElement>('.site-search-result')?.focus(); } }}/>{query ? <button className="site-clear-search" type="button" aria-label="Clear search" onClick={() => { onQueryChange(''); input.current?.focus(); }}><Icon name="close" size={14}/></button> : <kbd>Esc</kbd>}</div>
    <div className="site-search-results" aria-live="polite">{query.trim() ? results.length ? <><div className="site-result-label">{results.length} {results.length === 1 ? 'answer' : 'answers'}</div>{results.map(a => <ArticleResult key={a.slug} article={a} onNavigate={onClose}/>)}</> : <div className="site-no-results"><Icon name="leaf" size={28}/><h2>No matching articles.</h2><p>Try a shorter word, or browse the guide.</p><SectionLink href="/docs">Browse the guide</SectionLink></div> : <><div className="site-result-label">Start here</div>{['first-day', 'worlds-wallets', 'care-supplies', 'troubleshooting'].map(slug => getArticle(slug)).filter((a): a is GuideArticle => !!a).map(a => <ArticleResult key={a.slug} article={a} onNavigate={onClose}/>)}</>}</div>
  </dialog>;
}
function GuideNavigation({ current }: { current?: string }) {
  return <nav className="site-guide-nav" aria-label="Guide chapters">{GUIDE_GROUPS.map(group => <div key={group.id}><h2><Icon name={GROUP_ICONS[group.id] || 'book'} size={15}/>{group.title}</h2>{ARTICLES.filter(a => a.group === group.id).map(article => <a href={`/docs/${article.slug}`} key={article.slug} className={current === article.slug ? 'is-current' : ''} aria-current={current === article.slug ? 'page' : undefined}>{article.title}</a>)}</div>)}<a className="site-guide-home" href="/">← Back to website</a></nav>;
}
function DocsIndex({ query: filter, onQueryChange, onSearch }: { query: string; onQueryChange: (query: string) => void; onSearch: () => void }) {
  const results = searchArticles(filter);
  return <div className="site-docs-index"><div className="site-guide-welcome"><div><h1>Player handbook</h1><p>How to play, care for your rooster and manage what you own.</p></div><picture className="site-handbook-picture"><source type="image/avif" srcSet={SITE_IMAGES.handbook.avifSrcSet} sizes={SITE_IMAGES.handbook.sizes}/><source type="image/webp" srcSet={SITE_IMAGES.handbook.webpSrcSet} sizes={SITE_IMAGES.handbook.sizes}/><img className="site-book-illustration" src="/site/handbook-560.webp" width="768" height="512" alt="" loading="lazy" decoding="async"/></picture></div>
    <label className="site-guide-search"><span className="site-search-glass"/><input type="search" value={filter} maxLength={160} onChange={e => onQueryChange(e.target.value)} placeholder="What would you like to know?" aria-label="Find a guide article"/><button type="button" onClick={onSearch} aria-label="Open focused guide search"><Icon name="focus" size={19}/></button></label>
    {filter.trim() ? <section className="site-index-results" aria-live="polite"><p className="site-result-label">{results.length ? `${results.length} ${results.length === 1 ? 'answer' : 'answers'}` : 'No matches for that one.'}</p>{results.map(article => <ArticleResult article={article} key={article.slug}/>)}{!results.length && <button className="site-button site-secondary" onClick={() => onQueryChange('')}>Browse all topics</button>}</section> : <>
      <a className="site-first-guide" href="/docs/first-day"><span className="site-first-egg"><PixelEgg/></span><span><small>Quick start</small><strong>Your first day</strong><span>Choose a world, hatch your rooster and prepare supplies.</span></span><span aria-hidden="true">→</span></a>
      <div className="site-guide-groups">{GUIDE_GROUPS.map(group => <section key={group.id}><div className="site-group-heading"><Icon name={GROUP_ICONS[group.id] || 'book'} size={20}/><h2>{group.title}</h2></div>{ARTICLES.filter(a => a.group === group.id && a.slug !== 'first-day').map(article => <a href={`/docs/${article.slug}`} key={article.slug}><span>{article.title}</span><span aria-hidden="true">→</span></a>)}</section>)}</div>
    </>}
    <div className="site-guide-bottom"><QuietNote>Reading needs no wallet.</QuietNote><SectionLink href="/project">About the project</SectionLink></div>
  </div>;
}
function CopyAddress({ value, label = 'Copy address' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false), [failed, setFailed] = useState(false);
  const input = useRef<HTMLElement>(null);
  useEffect(() => { setCopied(false); setFailed(false); }, [value]);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2200); return () => clearTimeout(timer); }, [copied]);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setFailed(false); }
    catch { setFailed(true); input.current?.focus(); if (input.current) window.getSelection()?.selectAllChildren(input.current); }
  }
  return <div className="site-address"><code ref={input} tabIndex={0} aria-label={label.replace('Copy', '').trim() || 'Contract address'}>{value}</code><button type="button" onClick={() => void copy()} aria-label={copied ? 'Address copied' : label}>{copied ? <Icon name="check" size={17}/> : <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 1h12v3H5v11H2zM7 6h11v13H7zm2 2v9h7V8z"/></svg>}</button><span className="site-copy-status" role="status">{copied ? 'Copied' : failed ? 'Select and copy the address above.' : ''}</span></div>;
}
function Contracts({ compact = false }: { compact?: boolean }) {
  const [world, setWorld] = useState(0);
  const selected = PROJECT.worlds[world];
  return <section className={`site-contracts ${compact ? 'is-compact' : ''}`} aria-label="Deployed testnet contracts"><div className="site-contract-tabs" role="group" aria-label="Choose contract world">{PROJECT.worlds.map((w, i) => <button type="button" key={w.id} onClick={() => setWorld(i)} aria-pressed={i === world}><span className={`site-network-dot ${i ? 'rh' : 'near'}`}/>{w.name}</button>)}</div>
    <div className="site-contract-body"><div className="site-contract-heading"><span className="site-eyebrow">{selected.wallet}</span><h3>{selected.name}</h3></div><label>NFT collection{selected.id === 'near-testnet' ? ' & NHC token' : ''}</label><CopyAddress value={selected.collection} label={`Copy ${selected.name} collection address`}/><div className="site-contract-links"><External href={selected.explorer}>View on explorer</External><External href={selected.sourceHref}>Contract source</External></div>{selected.token !== selected.collection && <><label>NHC token</label><CopyAddress value={selected.token} label="Copy Robinhood NHC token address"/><External href={selected.tokenExplorer}>Token on explorer</External></>}
      <div className="site-contract-bottom"><span>Each world has its own lives and belongings.</span><AppLink href={selected.appHref}>Open this world</AppLink></div></div>
  </section>;
}
function DocsArticle({ article, onSearch }: { article: GuideArticle; onSearch: () => void }) {
  const group = GUIDE_GROUPS.find(g => g.id === article.group);
  const [activeSection, setActiveSection] = useState(article.sections[0]?.id);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id); }, { rootMargin: '-12% 0px -60% 0px' });
    document.querySelectorAll('.site-article-section').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [article.slug]);
  const related = article.related.map(slug => getArticle(slug)).filter((a): a is GuideArticle => !!a);
  return <div className="site-docs-shell"><aside className="site-docs-sidebar"><button type="button" className="site-sidebar-search" onClick={onSearch}><span className="site-search-glass"/>Search the guide…<kbd>⌕</kbd></button><GuideNavigation current={article.slug}/></aside>
    <div className="site-mobile-guide"><details><summary><Icon name="book" size={17}/>Guide contents<span aria-hidden="true">⌄</span></summary><GuideNavigation current={article.slug}/></details><button type="button" onClick={onSearch} aria-label="Search the guide"><span className="site-search-glass"/></button></div>
    <article className="site-article" data-guide={article.slug}><nav className="site-breadcrumbs" aria-label="Breadcrumb"><a href="/docs">Guide</a><span>/</span><span>{group?.title}</span></nav><h1>{article.title}</h1><p className="site-article-summary">{article.summary}</p>
      {article.slug === 'contracts' && <Contracts/>}
      {article.slug === 'nft-purse' && <div className="site-ownership-diagram"><Rooster seed="SAGE"/><span>One life</span><i aria-hidden="true"/><Icon name="house" size={32}/><i aria-hidden="true"/><Icon name="book" size={30}/><i aria-hidden="true"/><Icon name="wallet" size={30}/></div>}
      {article.sections.map(section => <section key={section.id} id={section.id} className="site-article-section"><h2><a href={`#${section.id}`}>{section.title}<span aria-hidden="true">#</span></a></h2>{section.paragraphs?.map((text, i) => <p key={i}>{text}</p>)}{section.bullets && <ul>{section.bullets.map((text, i) => <li key={i}>{text}</li>)}</ul>}{section.table && <div className="site-table-wrap" tabIndex={0} aria-label={`${section.title} table`}><table><thead><tr>{section.table.headers.map((heading, i) => <th key={i} scope="col">{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.links && <div className="site-article-links">{section.links.map(link => /^https?:/.test(link.href) ? <External href={link.href} key={link.href}>{link.label}</External> : <SectionLink href={link.href} key={link.href}>{link.label}</SectionLink>)}</div>}</section>)}
      {related.length > 0 && <nav className="site-read-next" aria-label="Related articles"><span className="site-eyebrow">Related guides</span>{related.map(a => <a href={`/docs/${a.slug}`} key={a.slug}><Icon name={GROUP_ICONS[a.group] || 'book'} size={18}/><span>{a.title}</span><span aria-hidden="true">→</span></a>)}</nav>}
    </article><aside className="site-page-contents"><strong>On this page</strong><nav aria-label="Article sections">{article.sections.map(s => <a href={`#${s.id}`} key={s.id} className={s.id === activeSection ? 'is-current' : ''}>{s.title}</a>)}</nav><div className="site-contents-stamp"><Icon name="leaf" size={30}/><span>Need an answer?<br/>Search the guide.</span></div><a href={PROJECT.appHref} className="site-text-link">Open App<Arrow/></a></aside>
  </div>;
}
function ProjectPage() {
  return <div className="site-project-page"><div className="site-page-intro"><span className="site-eyebrow">About the project</span><h1>A small game.<br/><span>A life you own.</span></h1><p>An AI-led virtual pet game with a home, inventory and purse tied to its NFT.</p></div>
    <section className="site-project-story"><a className="site-project-portrait" href={PROJECT.exampleHref}><img src={PROJECT.exampleImage} width="640" height="640" alt="MISO’s current NFT portrait, reflecting its saved life"/><span>View MISO’s life <Arrow/></span></a><div><h2>Less directing.<br/>More discovering.</h2><p>You choose the supplies. Jev, running through NEAR AI Cloud, decides what your rooster does next: grow crops, make objects, look after itself or relax.</p><p>The saved home, inventory, intentions and purse travel with the NFT when ownership changes.</p><SectionLink href="/docs/nft-purse">What the NFT carries</SectionLink></div></section>
    <section className="site-project-architecture"><WindowBar title="How a day works" icon="brain"/><div><span><Icon name="mail" size={27}/><strong>You prepare</strong><small>A few supplies, one accepted day.</small></span><i aria-hidden="true">→</i><span><Icon name="brain" size={30}/><strong>Jev chooses</strong><small>A project and daily routines.</small></span><i aria-hidden="true">→</i><span><Icon name="book" size={28}/><strong>The life saves</strong><small>Rules and outcomes checked onchain.</small></span></div><SectionLink href="/docs/jev-saving">How Jev & saving work</SectionLink></section>
    <div className="site-project-contract-intro"><span className="site-eyebrow">Two testnet worlds</span><h2>Open it. Inspect it.</h2><p>Native NEAR and Robinhood share the game, with separate lives and balances.</p></div><Contracts/>
    <section className="site-source-panel"><div><h2>Code & contracts.</h2><p>Review the contract sources, build settings and verification records.</p><div className="site-inline-links"><a className="site-text-link" href={PROJECT.sourceArchive} download><span className="site-link-label">Download contracts</span><span aria-hidden="true">↓</span></a><External href={PROJECT.sourceUrl}>Browse GitHub</External><SectionLink href="/docs/contracts">Contracts & trust</SectionLink></div></div><div><span className="site-eyebrow">NEAR hackathon</span><strong>NFTs That Do Something</strong><p>A changing asset with continuing behavior, possessions and purse rights.</p></div></section>
  </div>;
}
function NotFound({ article = false }: { article?: boolean }) {
  return <section className="site-not-found"><span className="site-eyebrow">404 / Page not found</span><div className="site-lost-mail" aria-hidden="true"><Icon name="mail" size={76}/><Icon name="leaf" size={32}/></div><h1>{article ? 'Guide page not found.' : 'Page not found.'}</h1><p>{article ? 'Browse the guide to find the article you need.' : 'This page isn’t here. Return home or open the app.'}</p><div className="site-hero-actions"><a className="site-button site-primary" href={article ? '/docs' : '/'}>{article ? 'Browse the guide' : 'Back home'}<span aria-hidden="true">→</span></a><SectionLink href={PROJECT.appHref}>Open App</SectionLink></div></section>;
}
function Footer() {
  return <footer className="site-footer"><a href="/" className="site-footer-tag"><Icon name="leaf" size={17}/>NEARlyHuman · An AI-led life game</a><nav aria-label="Footer"><a href="/explore">Explore lives</a><a href="/project">The project</a><a href="/docs/contracts">Contracts & source</a><a href="/docs/privacy-data">Data & privacy</a></nav></footer>;
}

export default function Site() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const slug = path.startsWith('/docs/') ? path.slice(6) : undefined;
  const article = slug ? getArticle(slug) : undefined;
  const publicLife = parsePublicLifePath(path);
  const [search, setSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const title = path === '/' ? 'A little life. A mind of its own.' : path === '/the-game' ? 'The game' : path === '/explore' ? 'Explore lives' : publicLife ? `Rooster #${publicLife.id}` : path === '/docs' ? 'The player handbook' : path === '/project' ? 'The project' : article?.title || 'Page not found';
  useEffect(() => {
    document.title = path === '/' ? `NEARlyHuman — ${title}` : `${title} · NEARlyHuman`;
    const description = article?.summary || 'Hatch a rooster. Leave a few supplies. See what it makes of the day. A retro AI-led life game, saved onchain.';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]'); if (meta) meta.content = description;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (theme) theme.content = '#f7efd8';
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(v => !v); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [title, path, article]);
  if (path === '/') return <><Home onSearch={() => setSearch(true)}/>{search && <Search query={searchQuery} onQueryChange={setSearchQuery} onClose={() => setSearch(false)}/>}</>;
  return <div className="site"><a className="site-skip-link" href="#site-main">Skip to content</a><div className={`site-window ${path.startsWith('/docs/') && article ? 'site-reading-window' : ''}`}><Header path={path} onSearch={() => setSearch(true)}/><main id="site-main">{path === '/the-game' ? <GamePage/> : path === '/explore' ? <Suspense fallback={<OpeningLives/>}><ExplorePage/></Suspense> : publicLife ? <Suspense fallback={<OpeningLives/>}><PublicLifePage worldId={publicLife.worldId} id={publicLife.id} collection={publicLife.collection}/></Suspense> : path === '/docs' ? <DocsIndex query={searchQuery} onQueryChange={setSearchQuery} onSearch={() => setSearch(true)}/> : article ? <DocsArticle article={article} onSearch={() => setSearch(true)}/> : path === '/project' ? <ProjectPage/> : <NotFound article={!!slug}/>}</main><Footer/></div>{search && <Search query={searchQuery} onQueryChange={setSearchQuery} onClose={() => setSearch(false)}/>}</div>;
}
