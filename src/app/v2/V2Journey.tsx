import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { formatEther, type Address, type EIP1193Provider, type Hex } from 'viem';
import { connectV2Wallet, createV2ChainReader, mintedId, resolveV2Submission, type V2SubmissionIntent } from '../../chain/v2-client';
import { explorerToken, explorerTransaction } from '../../chain/config';
import { formatNativeBalance, networkForConfig } from '../../chain/networks';
import { cacheV2Session, restoreV2Session, v2Api, setV2Session, V2ApiError } from '../v2-api';
import { api } from '../api';
import { Icon } from '../Icons';
import { CartridgeOpening, type CartridgePhase } from '../CartridgeOpening';
import { roosterCanvas } from '../../art/rooster';
import { itemArt } from '../../game/v2/art';
import { ITEMS, PLANTS, kitMask, createState } from '../../v2';
import { createV2WorldRenderer } from '../../game/v2';
import type { V2OwnerJob, V2OwnerQuote, V2PublicConfig, V2PublicLife, V2World } from '../../v2/public';
import { endingNote, filmPacket, itemName, type V2FilmPacket } from '../../v2/presentation';
import V2Player from './V2Player';
import { LifeSoundButton, LifeSoundToggle } from './LifeSound';
import { BirthReveal, DayFlow, ProcessGraphic } from './JourneyVisuals';
import '../v2Journey.css';

type Provider = EIP1193Provider & { on?: (name: string, listener: (...a: any[]) => void) => void; removeListener?: (name: string, listener: (...a: any[]) => void) => void };
type Wallet = Awaited<ReturnType<typeof connectV2Wallet>>;
type Screen = 'home' | 'welcome' | 'profile' | 'hatch' | 'birth' | 'care' | 'review' | 'pending' | 'purse' | 'history' | 'lives' | 'menu' | 'wallet' | 'stock';
type Action = 'mint' | 'day' | 'verify' | 'withdraw' | 'connect' | 'expire' | 'resume' | 'approve';
type Parcel = [number | undefined, number | undefined, number | undefined];
interface BirthDraft { name: string; stats: number[]; payment: 'native' | 'purse' | 'wallet'; sourceId?: string }
interface Pending { kind: Action; hash?: Hex; requestId?: Hex; tokenId?: string; intent?: V2SubmissionIntent; cursor?: string; birthDraft?: BirthDraft }
interface WalletChoice { id: string; name: string; provider: Provider }
interface Preview { config: V2PublicConfig; life?: V2PublicLife; packet?: unknown; account?: Address; lives?: V2PublicLife[]; days?: { day: number; rewardMicro?: string }[]; pending?: Pending; job?: V2OwnerJob; screen?: Screen; kit?: number[]; birth?: { id: string; hash?: Hex }; guideDone?: boolean }
declare global { interface Window { __NH_V2_JOURNEY_PREVIEW?: Preview } }
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const artCache = new Map<string, string>();
function itemImage(index: number) { const key = 'item:' + index; if (!artCache.has(key)) artCache.set(key, itemArt(index).toDataURL()); return artCache.get(key)!; }
function roosterImage(seed: string) { if (!artCache.has(seed)) artCache.set(seed, roosterCanvas(seed, 'idle').toDataURL()); return artCache.get(seed)!; }
const coins = (value: string) => {
  const amount = BigInt(value), units = amount < 0n ? -amount : amount;
  const fraction = (units % 1000000n).toString().padStart(6, '0').replace(/0+$/, '');
  const decimal = new Intl.NumberFormat().formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  return `${amount < 0n ? '−' : ''}${(units / 1000000n).toLocaleString()}${fraction ? decimal + fraction : ''}`;
};
const eth = (value: string) => { const n = Number(formatEther(BigInt(value))); return n < .000001 && n > 0 ? '< 0.000001' : n.toLocaleString(undefined, { maximumFractionDigits: 6 }); };
function errorText(e: unknown) { const code = (e as { code?: unknown })?.code; if (code === 4001 || code === 'ACTION_REJECTED' || /rejected|denied/i.test(e instanceof Error ? e.message : '')) return 'No problem. Nothing was sent.'; return e instanceof Error && e.message.length < 180 ? e.message : 'That did not go through. Try again.'; }
const storage = { get<T>(k: string): T | undefined { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? undefined; } catch { return; } }, set(k: string, value: unknown) { try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* In-memory continuation remains usable. */ } }, remove(k: string) { try { localStorage.removeItem(k); } catch { /* No browser ledger reset. */ } } };
function openingSeen() { try { return !!sessionStorage.getItem('nh:v2:opening'); } catch { return false; } }

/** Title artwork only: no public NFT, earned film or economic outcome is invented. */
function TitleScenery({ opening }: { opening: CartridgePhase }) {
  const host = useRef<HTMLDivElement | null>(null), world = useRef<ReturnType<typeof createV2WorldRenderer> | undefined>(undefined);
  useEffect(() => { const view = createV2WorldRenderer(host.current!, { state: createState({ seed: 0x4e48 }) }); world.current = view; view.setInputEnabled(false); view.setOpening(opening); return () => { view.destroy(); world.current = undefined; }; }, []);
  useEffect(() => world.current?.setOpening(opening), [opening]);
  return <div ref={host} className="v2-title-scenery" aria-hidden="true"/>;
}

export default function V2Journey() {
  const preview = import.meta.env.DEV ? window.__NH_V2_JOURNEY_PREVIEW : undefined;
  const [query] = useState(() => new URLSearchParams(location.search));
  const exactId = query.get('rooster') || query.get('id');
  const initialWorld: V2World | undefined = query.get('collection') && /^0x[0-9a-f]{40}$/i.test(query.get('collection')!) && /^[1-9]\d{0,5}$/.test(query.get('chainId') || '') ? { chainId: Number(query.get('chainId')), collection: query.get('collection') as Address } : undefined;
  const malformedWorld = (query.has('collection') || query.has('chainId')) && !initialWorld;
  const [config, setConfig] = useState<V2PublicConfig | undefined>(preview?.config);
  const [life, setLife] = useState<V2PublicLife | undefined>(preview?.life);
  const [packet, setPacket] = useState<V2FilmPacket | undefined>(filmPacket(preview?.packet));
  const [screen, setScreen] = useState<Screen>(preview?.screen || (preview?.birth ? 'birth' : preview?.pending || preview?.job ? 'pending' : preview?.life ? exactId ? 'profile' : 'home' : 'welcome'));
  const [opening, setOpening] = useState<CartridgePhase>(() => exactId || preview ? 'closed' : openingSeen() ? 'closed' : 'assembling');
  const [readBusy, setBusy] = useState(false), [walletBusy, setWalletBusy] = useState(false), [message, setMessage] = useState('');
  const busy = readBusy || walletBusy;
  const [errorCode, setErrorCode] = useState('');
  const [boot, setBoot] = useState(0);
  const [account, setAccount] = useState<Address | undefined>(preview?.account);
  const [wallets, setWallets] = useState<WalletChoice[]>([]);
  const [owned, setOwned] = useState<V2PublicLife[]>(preview?.lives || []), [nextCursor, setNextCursor] = useState<string>();
  const [days, setDays] = useState<{ day: number; rewardMicro?: string; alive?: boolean; level?: number }[]>(preview?.days || []), [before, setBefore] = useState<number>();
  const [historyLoading, setHistoryLoading] = useState(false), [livesLoading, setLivesLoading] = useState(false), [canCloseDay, setCanCloseDay] = useState(false);
  const [name, setName] = useState('PIP'), [stats, setStats] = useState([2, 2, 1]);
  const [payment, setPayment] = useState<'native' | 'purse' | 'wallet'>('native');
  const [kit, setKit] = useState<Parcel>(() => [preview?.kit?.[0], preview?.kit?.[1], preview?.kit?.[2]]), [category, setCategory] = useState(0), [parcelSlot, setParcelSlot] = useState(0);
  const kitRef = useRef(kit); kitRef.current = kit;
  const [guide, setGuide] = useState<number | undefined>(() => preview?.guideDone || storage.get<boolean>('nh:v2:packing-help') ? undefined : 0);
  const [birth, setBirth] = useState<{ id: string; hash?: Hex } | undefined>(preview?.birth);
  const [quote, setQuote] = useState<V2OwnerQuote>(), [job, setJob] = useState<V2OwnerJob | undefined>(preview?.job);
  const [pending, setPending] = useState<Pending | undefined>(preview?.pending);
  const [readingDay, setReadingDay] = useState<number>();
  const [walletBalance, setWalletBalance] = useState('0'), [allowance, setAllowance] = useState('0'), [copied, setCopied] = useState(false);
  const [nativeBalance, setNativeBalance] = useState<string | null>(), [verifiedAccount, setVerifiedAccount] = useState<Address>();
  const nativeBalanceRead = useRef(0), nativeBalanceScope = useRef('');
  nativeBalanceScope.current = config && account ? `${config.chainId}:${config.collection.toLowerCase()}:${account.toLowerCase()}` : '';
  const [walletPhase, setWalletPhase] = useState<'connect' | 'signin' | 'transaction'>();
  const [walletIntent, setWalletIntent] = useState<Action>('connect');
  const [example, setExample] = useState(false);
  const [freshDay, setFreshDay] = useState<Hex>();
  const [playRequest, setPlayRequest] = useState<string>();
  const wallet = useRef<Wallet | undefined>(undefined), activeProvider = useRef<Provider | undefined>(undefined), authenticated = useRef('');
  const pendingRef = useRef<Pending | undefined>(preview?.pending), operation = useRef<Action>('connect'), generation = useRef(0);
  const walletOperation = useRef<symbol | undefined>(undefined);
  const quoteRef = useRef<V2OwnerQuote | undefined>(undefined);
  const operationContext = useRef<{ tokenId?: string; requestId?: Hex; birthDraft?: BirthDraft }>({});
  const returnScreen = useRef<Screen>('home');
  const backStack = useRef<Screen[]>([]);
  const writeScreen = useRef<Screen>('home');
  const root = useRef<HTMLDivElement | null>(null);
  const sheetBody = useRef<HTMLDivElement | null>(null);
  const sheetScroll = useRef(new Map<string, number>()), portfolioRead = useRef(0), pendingCheck = useRef(false), currentScreen = useRef(screen);
  currentScreen.current = screen;
  const historyCache = useRef(new Map<string, { days: { day: number; rewardMicro?: string; alive?: boolean; level?: number }[]; before?: number; scroll: number; selected?: number }>());
  const historyKey = life ? `${life.chainId}:${life.collection.toLowerCase()}:${life.id}` : '';
  const currentWorld = !!life && !!config && life.chainId === config.chainId && same(life.collection, config.collection);
  const readyJob = currentWorld && job?.phase === 'ready' && job.tokenId === life?.id && job.requestId !== packet?.requestId ? job : undefined;
  const owner = currentWorld && same(life?.owner, account), historical = !!life && (readingDay ?? packet?.result.state.day ?? life.state.day) < life.state.day;
  const historyControls = readingDay !== undefined || historical && owner;
  const world = life ? { chainId: life.chainId, collection: life.collection } : config;
  const network = config ? networkForConfig(config) : undefined;
  const signedIn = same(verifiedAccount, account);
  const parcelKey = life && account ? `nh:v2:parcel:${life.chainId}:${life.collection.toLowerCase()}:${life.id}:${life.state.day + 1}:${account.toLowerCase()}` : undefined;
  const packed = kit.filter((i): i is number => i !== undefined);
  const selectedMask = () => kitMask(kitRef.current.filter((i): i is number => i !== undefined).map(i => ITEMS[i]!)).toString();
  function clearQuote() { quoteRef.current = undefined; setQuote(undefined); }
  function keepQuote(q: V2OwnerQuote) { quoteRef.current = q; setQuote(q); }
  function finishGuide() { setGuide(undefined); storage.set('nh:v2:packing-help', true); }
  function networkCard() { return config ? <div className="v2-network-card"><span className="v2-network-badge"><i/>{network?.label || `Chain ${config.chainId}`}</span>{account && <><span className="v2-wallet-address">{account.slice(0, 6)}…{account.slice(-4)}</span><strong className="v2-wallet-balance">{nativeBalance === undefined ? 'Checking balance…' : nativeBalance === null ? 'Balance unavailable' : formatNativeBalance(BigInt(nativeBalance), network)}</strong></>}</div> : null; }
  function refreshNativeBalance(who: Address | undefined, target = config) {
    if (!who || !target) return;
    const scope = `${target.chainId}:${target.collection.toLowerCase()}:${who.toLowerCase()}`;
    if (scope !== nativeBalanceScope.current) return;
    const read = ++nativeBalanceRead.current;
    // Display-only, bounded RPC read. Never hold up a confirmed mint or day, and
    // never let an older wallet/world response overwrite the current balance.
    void createV2ChainReader(target).balance(who).then(balance => {
      if (read === nativeBalanceRead.current && scope === nativeBalanceScope.current) setNativeBalance(balance.toString());
    }).catch(() => {
      if (read === nativeBalanceRead.current && scope === nativeBalanceScope.current) setNativeBalance(null);
    });
  }
  const pendingKey = (who = account) => config && who ? `nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${who.toLowerCase()}` : undefined;
  function remember(p?: Pending) { const k = pendingKey(p?.intent?.account || pendingRef.current?.intent?.account || wallet.current?.account || account); pendingRef.current = p; setPending(p); if (k) p ? storage.set(k, p) : storage.remove(k); }
  function claimWalletOperation() { if (walletOperation.current) return; const token = Symbol('wallet-operation'); walletOperation.current = token; setWalletBusy(true); return token; }
  function releaseWalletOperation(token: symbol) { if (walletOperation.current !== token) return false; walletOperation.current = undefined; setWalletBusy(false); return true; }
  function restoreBirth(draft?: BirthDraft) { if (!draft || typeof draft.name !== 'string' || draft.name.length > 8 || !['native', 'purse', 'wallet'].includes(draft.payment) || !Array.isArray(draft.stats) || draft.stats.length !== 3 || draft.stats.some(n => !Number.isInteger(n) || n < 0 || n > 5) || draft.stats.reduce((a, b) => a + b, 0) !== 5) return; setName(draft.name); setStats([...draft.stats]); setPayment(draft.payment); }
  function showScreen(next: Screen) {
    if (next === 'home' || next === 'welcome') backStack.current = [];
    else while (backStack.current.at(-1) === next) backStack.current.pop();
    if (next === 'welcome') setExample(false);
    setScreen(next);
  }
  function go(next: Screen) { showScreen(next); setMessage(''); setErrorCode(''); }
  function overlay(next: Screen) {
    if (next === screen) return;
    backStack.current.push(screen); returnScreen.current = screen; go(next);
  }
  function close() {
    const destination = backStack.current.pop() || returnScreen.current;
    returnScreen.current = backStack.current.at(-1) || 'home';
    go(destination === 'wallet' || destination === screen ? life ? 'home' : 'welcome' : destination);
  }
  function watchExample() { if (!life || !packet || busy) return; setExample(true); go('home'); }
  function endExample() { setExample(false); go('welcome'); }
  useLayoutEffect(() => {
    if (!sheetBody.current) return;
    if (screen !== 'history') { sheetBody.current.scrollTop = sheetScroll.current.get(`${historyKey}:${screen}`) || 0; return; }
    const cached = historyCache.current.get(historyKey), body = sheetBody.current;
    body.scrollTop = cached?.scroll || 0;
    if (cached?.selected !== undefined) { body.querySelector<HTMLElement>('button[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }); cached.scroll = body.scrollTop; }
  }, [screen, screen === 'history' ? days : undefined, historyKey]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const fit = () => { if (!root.current) return; root.current.style.setProperty('--v2-visible-height', `${viewport?.height || window.innerHeight}px`); root.current.style.setProperty('--v2-visible-top', `${viewport?.offsetTop || 0}px`); };
    viewport?.addEventListener('resize', fit); viewport?.addEventListener('scroll', fit); window.addEventListener('resize', fit); fit();
    return () => { viewport?.removeEventListener('resize', fit); viewport?.removeEventListener('scroll', fit); window.removeEventListener('resize', fit); };
  }, []);
  async function loadLife(id: string, targetWorld = world, day?: number, show: Screen = 'home', fresh?: Hex, options?: { whilePending?: boolean; play?: boolean }) {
    if (options?.whilePending && currentScreen.current !== 'pending') return false;
    const g = ++generation.current; setBusy(true); setMessage('');
    try {
      let loaded: V2PublicLife, film: V2FilmPacket | undefined;
      try { const result = await v2Api.replay(id, day, targetWorld); loaded = result.life; film = filmPacket(result.packet); }
      catch (e) { if (day || !(e instanceof V2ApiError) || !['not_found', 'replay_unavailable'].includes(e.code)) throw e; loaded = (await v2Api.life(id, targetWorld)).life; }
      if (g !== generation.current || options?.whilePending && currentScreen.current !== 'pending') return false;
      const cached = historyCache.current.get(`${loaded.chainId}:${loaded.collection.toLowerCase()}:${loaded.id}`);
      setDays(cached?.days || []); setBefore(cached?.before); setHistoryLoading(false);
      setLife(loaded); setPacket(film); setReadingDay(day); clearQuote(); setExample(false); setFreshDay(fresh); setPlayRequest(options?.play ? fresh : undefined);
      backStack.current = []; returnScreen.current = 'home'; setScreen(show);
      setJob(current => current?.tokenId === loaded.id && config?.chainId === loaded.chainId && same(config.collection, loaded.collection) && (show === 'pending' || loaded.pendingRequest === current.requestId) ? current : undefined);
      if (account) storage.set(`nh:v2:selected:${loaded.chainId}:${loaded.collection.toLowerCase()}:${account.toLowerCase()}`, loaded.id);
      const url = new URL(location.href); url.searchParams.set('rooster', loaded.id); url.searchParams.set('chainId', String(loaded.chainId)); url.searchParams.set('collection', loaded.collection); day ? url.searchParams.set('day', String(day)) : url.searchParams.delete('day'); history.replaceState(null, '', url.pathname + url.search);
      return true;
    } catch (e) { if (g === generation.current && (!options?.whilePending || currentScreen.current === 'pending')) setMessage(errorText(e)); return false; } finally { if (g === generation.current) setBusy(false); }
  }
  useEffect(() => {
    if (opening !== 'assembling') return; const timer = setTimeout(() => setOpening('title'), 1100); return () => clearTimeout(timer);
  }, [opening]);
  function startOpening() { if (opening === 'leaving') return; try { sessionStorage.setItem('nh:v2:opening', '1'); } catch { /* no persistence required */ } if (opening === 'assembling') { setOpening('closed'); return; } setOpening('leaving'); setTimeout(() => setOpening('closed'), 320); }
  useEffect(() => {
    if (preview) return;
    let active = true;
    if (exactId && malformedWorld) { setMessage('Choose the original link for this life.'); return; }
    void v2Api.config().then(async c => {
      if (!active) return; setConfig(c);
      if (exactId) return loadLife(exactId, initialWorld || c, Number(query.get('day')) || undefined, 'profile');
      try { const guest = await v2Api.guest(); if (active && generation.current === 0) { setLife(guest.life); setPacket(filmPacket(guest.packet)); } } catch { /* A real new life can be hatched without a demonstration film. */ }
    }).catch(e => { if (active) setMessage(errorText(e)); });
    return () => { active = false; };
  }, [boot]);
  useEffect(() => {
    const found = new Map<string, WalletChoice>();
    const publish = () => setWallets([...found.values()]);
    const announce = (event: Event) => { const d = (event as CustomEvent).detail; if (d?.provider?.request && d.info?.uuid) { for (const [key, value] of found) if (value.provider === d.provider) found.delete(key); found.set(d.info.uuid, { id: d.info.uuid, name: String(d.info.name || 'Wallet').slice(0, 40), provider: d.provider }); publish(); } };
    window.addEventListener('eip6963:announceProvider', announce); window.dispatchEvent(new Event('eip6963:requestProvider'));
    const injected = (window as unknown as { ethereum?: Provider }).ethereum;
    if (injected) { activeProvider.current = injected; if (![...found.values()].some(w => w.provider === injected)) found.set('injected', { id: 'injected', name: 'Browser wallet', provider: injected }); publish(); void injected.request({ method: 'eth_accounts' }).then(a => { if (Array.isArray(a) && /^0x[0-9a-f]{40}$/i.test(String(a[0]))) setAccount(a[0] as Address); }).catch(() => {}); }
    return () => window.removeEventListener('eip6963:announceProvider', announce);
  }, []);
  useEffect(() => {
    if (!config || !account) return;
    const saved = storage.get<Pending>(pendingKey()!);
    if (saved && ['mint', 'day', 'withdraw', 'expire', 'approve'].includes(saved.kind)) { remember(saved); restoreBirth(saved.birthDraft); setScreen('pending'); return; }
    const selected = storage.get<string>(`nh:v2:selected:${config.chainId}:${config.collection.toLowerCase()}:${account.toLowerCase()}`);
    if (!exactId && generation.current === 0 && (screen === 'welcome' || screen === 'home') && selected && /^[1-9]\d*$/.test(selected)) void loadLife(selected, config);
  }, [config?.collection, account]);
  useEffect(() => {
    if (!activeProvider.current) return;
    const provider = activeProvider.current, reset = () => { portfolioRead.current++; nativeBalanceRead.current++; nativeBalanceScope.current = ''; wallet.current = undefined; authenticated.current = ''; setVerifiedAccount(undefined); setV2Session(''); setJob(undefined); clearQuote(); setAccount(undefined); setOwned([]); setLivesLoading(false); setBusy(false); setWalletBalance('0'); setNativeBalance(undefined); if (pendingRef.current) setScreen('pending'); };
    provider.on?.('accountsChanged', reset); provider.on?.('chainChanged', reset);
    return () => { provider.removeListener?.('accountsChanged', reset); provider.removeListener?.('chainChanged', reset); };
  }, [account]);
  useEffect(() => {
    setVerifiedAccount(undefined);
    if (!config || !account || preview) return;
    let active = true;
    void restoreV2Session(account, config).then(valid => { if (active && valid) { authenticated.current = account.toLowerCase(); setVerifiedAccount(account); } }).catch(() => {});
    return () => { active = false; };
  }, [account, config?.chainId, config?.collection]);
  useEffect(() => {
    setNativeBalance(undefined);
    if (!config || !account) return;
    refreshNativeBalance(account, config);
    return () => { nativeBalanceRead.current++; };
  }, [account, config?.chainId, config?.collection]);
  async function signIn(w: Wallet, allowSignature = true) {
    if (!config) return false;
    if (await restoreV2Session(w.account, config)) { authenticated.current = w.account.toLowerCase(); setVerifiedAccount(w.account); return true; }
    authenticated.current = ''; setVerifiedAccount(undefined); setV2Session('');
    if (!allowSignature) return false;
    setWalletPhase('signin');
    const challenge = await api.challenge(w.account), signature = await w.signMessage(challenge.message);
    const s = await api.authenticate(w.account, challenge.id, signature);
    setV2Session(s.token); cacheV2Session(w.account, config, s); authenticated.current = w.account.toLowerCase(); setVerifiedAccount(w.account); return true;
  }
  /** A confirmed day is durable onchain. Its acknowledgement is not an unresolved wallet payment. */
  async function retireAcceptedDayJournal(p: Pending, player = wallet.current?.account || account) {
    if (!config || p.kind !== 'day' || !p.requestId || !p.tokenId || !player) return;
    if (p.intent && (p.intent.chainId !== config.chainId || !same(p.intent.collection, config.collection) || !same(p.intent.account, player))) return;
    let accepted: Awaited<ReturnType<typeof v2Api.request>>;
    try { accepted = await v2Api.request(p.requestId); } catch (e) { if (e instanceof V2ApiError && e.code === 'not_found') return; throw e; }
    if (accepted.status < 1 || accepted.status > 4 || accepted.requestId !== p.requestId || accepted.tokenId !== p.tokenId || !same(accepted.player, player)) return;
    // Do not erase a newer wallet intent if two user interactions completed out of order.
    if (pendingRef.current !== p) return;
    remember();
    setLife(current => current?.id === accepted.tokenId && current.chainId === config.chainId && same(current.collection, config.collection)
      ? { ...current, pendingRequest: accepted.status === 1 ? accepted.requestId : undefined } : current);
    return accepted;
  }
  async function attach(choice: WalletChoice, action: Action) {
    if (!config) return; const token = claimWalletOperation(); if (!token) return;
    operation.current = action; writeScreen.current = screen === 'wallet' ? returnScreen.current : screen; setWalletPhase('connect'); setBusy(true); setMessage('');
    try {
      const w = await connectV2Wallet(choice.provider, config, intent => { const next = { kind: operation.current, ...operationContext.current, intent } satisfies Pending; pendingRef.current = next; setPending(next); const key = `nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${intent.account.toLowerCase()}`; storage.set(key, next); });
      wallet.current = w; activeProvider.current = choice.provider; setAccount(w.account);
      if (pendingRef.current?.intent && !same(pendingRef.current.intent.account, w.account)) throw Error(`Reconnect ${pendingRef.current.intent.account.slice(0, 6)}…${pendingRef.current.intent.account.slice(-4)} to finish this payment.`);
      setNativeBalance((await w.balance()).toString()); setWalletBalance((await w.tokenBalance()).toString()); setAllowance((await w.tokenAllowance()).toString());
      const unfinished = storage.get<Pending>(`nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${w.account.toLowerCase()}`);
      if (unfinished && action !== 'resume') {
        remember(unfinished); restoreBirth(unfinished.birthDraft);
        const accepted = (action === 'withdraw' || action === 'expire') ? await retireAcceptedDayJournal(unfinished, w.account) : undefined;
        if (!accepted) { setScreen('pending'); return; }
      }
      if (action === 'connect') { go('lives'); await listLives(w.account); } else await perform(action, w, token);
    } catch (e) { handleWriteError(e); } finally { if (releaseWalletOperation(token)) setBusy(false); }
  }
  async function run(action: Action) {
    const token = claimWalletOperation(); if (!token) return;
    try {
    operation.current = action; setMessage('');
    writeScreen.current = screen === 'wallet' ? returnScreen.current : screen;
    if (pendingRef.current && action !== 'resume') {
      const previous = pendingRef.current;
      try {
        const accepted = (action === 'withdraw' || action === 'expire') ? await retireAcceptedDayJournal(previous) : undefined;
        if (!accepted) { setScreen('pending'); setMessage('Check your earlier payment first.'); return; }
        if (action === 'expire' && accepted.status !== 1 && life?.id === accepted.tokenId) { await loadLife(accepted.tokenId, config); return; }
      } catch (e) { handleWriteError(e); return; }
    }
    if (pendingRef.current?.intent && !same(pendingRef.current.intent.account, wallet.current?.account)) { wallet.current = undefined; authenticated.current = ''; setVerifiedAccount(undefined); setV2Session(''); }
    if (!wallet.current) { setWalletIntent(action); overlay('wallet'); setBusy(false); releaseWalletOperation(token); if (wallets.length === 1) void attach(wallets[0]!, action); return; }
    setBusy(true); await perform(action, wallet.current, token);
    } catch (e) { handleWriteError(e); } finally { if (releaseWalletOperation(token)) setBusy(false); }
  }
  function handleWriteError(e: unknown) {
    const code = (e as { code?: unknown })?.code;
    setErrorCode(typeof code === 'string' ? code : '');
    if (code === 'price') { wallet.current = undefined; void v2Api.config().then(setConfig).catch(() => {}); }
    if (code === 'session') { authenticated.current = ''; setVerifiedAccount(undefined); setV2Session(''); }
    if ([4001, 'ACTION_REJECTED', 'cancelled', 'replaced', 'reverted'].includes(code as never)) { remember(); showScreen(writeScreen.current); }
    else if (pendingRef.current) setScreen('pending');
    else if (wallet.current) showScreen(writeScreen.current);
    if (code === 'price') showScreen('hatch');
    setMessage(errorText(e));
  }
  async function perform(action: Action, w: Wallet, token: symbol) {
    operation.current = action;
    operationContext.current = { tokenId: life?.id, requestId: life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined), ...(action === 'mint' ? { birthDraft: { name, stats: [...stats], payment, sourceId: payment === 'purse' ? life?.id : undefined } } : {}) };
    if (action === 'connect') { go('lives'); await listLives(w.account); return; }
    if (action === 'verify') { await signIn(w); go('review'); return; }
    if (action === 'resume') {
      if (pendingRef.current) { await checkPayment(w, token); return; }
      await signIn(w); const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined);
      if (!id) throw Error('Choose a day to open.');
      const next = await v2Api.wake(id); await showJob(next); return;
    }
    if (action === 'mint' || action === 'day' || action === 'approve') setJob(undefined);
    let hash: Hex;
    if (action === 'mint') {
      const clean = name.trim().toUpperCase(); if (!/^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(clean) || stats.reduce((a, b) => a + b, 0) !== 5) throw Error('Give this little life a name and five points.');
      setWalletPhase('transaction'); setScreen('pending');
      if (payment === 'purse') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); hash = await w.birthFromPurse(life.id, life.purseNonce, clean, stats as [number, number, number]); }
      else if (payment === 'wallet') {
        if (await w.tokenBalance() < 250000000n) throw Error('Your wallet needs 250 NHC for this little life.');
        if (BigInt((await w.tokenAllowance()).toString()) < 250000000n) {
          operation.current = 'approve'; hash = await w.approveBirthTokens(); remember({ ...pendingRef.current, kind: 'approve', hash }); setScreen('pending'); await checkPayment(w, token); return;
        }
        hash = await w.birthFromWallet(clean, stats as [number, number, number]);
      }
      else hash = await w.mint(clean, stats as [number, number, number]);
    } else if (action === 'day') {
      if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your life in this world.');
      clearQuote(); setWalletPhase('transaction');
      if (!await signIn(w, false)) { go('review'); setMessage('Verify your wallet, then start the day.'); return; }
      const mask = selectedMask();
      const q = await v2Api.quote(life.id, mask, true);
      if (q.admission.tokenId !== life.id || !same(q.admission.player, w.account) || q.admission.kitMask !== mask || q.admission.baseRevision !== life.revision || q.admission.decisionConfig !== config?.decisionConfig) throw Error('Your home changed. Review the day again.');
      keepQuote(q); operationContext.current.requestId = q.admission.id; setWalletPhase('transaction');
      hash = await w.accept(q);
      remember({ ...pendingRef.current, kind: 'day', tokenId: life.id, requestId: q.admission.id, hash });
      setScreen('pending'); await checkPayment(w, token); return;
    } else if (action === 'withdraw') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); setWalletPhase('transaction'); setScreen('pending'); hash = await w.withdraw(life.id, life.purseMicro); }
    else { const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined); if (!currentWorld || !id) throw Error('No day needs releasing.'); setWalletPhase('transaction'); setScreen('pending'); hash = await w.expire(id); }
    remember({ ...pendingRef.current, kind: action, tokenId: life?.id, hash }); setScreen('pending'); await checkPayment(w, token);
  }
  async function checkPayment(w = wallet.current, ownerToken?: symbol) {
    if (!config || !pendingRef.current) return;
    const token = ownerToken || claimWalletOperation(); if (!token || walletOperation.current !== token) return;
    const p = pendingRef.current; setBusy(true); setMessage('');
    try {
      if (p.intent && w && !same(p.intent.account, w.account)) throw Error(`Reconnect ${p.intent.account.slice(0, 6)}…${p.intent.account.slice(-4)} to finish this payment.`);
      if (p.kind === 'day' && p.requestId && !p.hash) {
        let accepted = false;
        try { accepted = (await v2Api.request(p.requestId)).status > 0; } catch (e) { if (!(e instanceof V2ApiError) || e.code !== 'not_found') throw e; }
        if (accepted) { if (!w) { setMessage('Connect your wallet to open this day.'); return; } await signIn(w); const next = await v2Api.wake(p.requestId); remember(); await showJob(next); return; }
      }
      let hash = p.hash;
      if (!hash && p.intent) {
        const resolved: { hash?: Hex; matched?: boolean; nextBlock: string } = await resolveV2Submission(config, p.intent, p.cursor);
        remember({ ...p, cursor: resolved.nextBlock.toString(), ...(resolved.hash ? { hash: resolved.hash } : {}) });
        if (!resolved.hash) { setMessage('Still checking your wallet. Check again shortly.'); return; }
        if (resolved.matched === false) { remember(); throw Error('That payment was replaced. Your saved home is unchanged.'); } hash = resolved.hash;
      }
      if (!hash) { setMessage('Check your wallet, then try checking again.'); return; }
      const receipt = await (w || createV2ChainReader(config)).wait(hash);
      refreshNativeBalance(p.intent?.account || w?.account || account, config);
      if (p.kind === 'mint') {
        const id = mintedId(receipt, config, p.intent?.account || w?.account || account); if (id === undefined) throw Error('Checking the new life. Try again shortly.');
        // A confirmed mint survives a slow indexing/read response. Keep its exact
        // receipt journal until the new NFT, rather than the guest, is loaded.
        setBirth({ id: id.toString(), hash: receipt.transactionHash }); setScreen('birth');
        if (await loadLife(id.toString(), config, undefined, 'birth')) { remember(); setName('PIP'); setPayment('native'); }
        return;
      }
      if (p.kind === 'day') {
        if (!w) { setMessage('Connect your wallet to finish opening this day.'); return; }
        await signIn(w); const j = await v2Api.accept(receipt.transactionHash, p.requestId!); remember(); await showJob(j); return;
      }
      if (p.kind === 'approve') { restoreBirth(p.birthDraft); remember(); setAllowance('250000000'); go('hatch'); return; }
      remember(); if (p.tokenId) await loadLife(p.tokenId, config); setScreen(p.kind === 'withdraw' ? 'purse' : 'home');
    } catch (e) { handleWriteError(e); } finally { if (!ownerToken && releaseWalletOperation(token)) setBusy(false); }
  }
  useEffect(() => {
    if (screen !== 'pending' || !job || ['failed', 'expired', 'ready'].includes(job.phase)) return;
    let active = true; const timer = setInterval(() => { void v2Api.job(job.requestId).then(async next => { if (!active) return; adoptJob(next); if (next.phase === 'ready') { remember(); await loadLife(next.tokenId, config, undefined, 'home', next.requestId, { whilePending: true }); } }).catch(e => { if (active) setMessage(errorText(e)); }); }, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [screen, job?.requestId, job?.phase, config]);
  useEffect(() => {
    setCanCloseDay(false);
    if (screen !== 'pending' || !job || !['quarantined', 'expiry_due'].includes(job.phase)) return;
    let active = true;
    void v2Api.request(job.requestId).then(request => {
      if (active) setCanCloseDay(request.status === 1 && BigInt(request.chainTimestamp) > BigInt(request.deadline));
    }).catch(() => {});
    return () => { active = false; };
  }, [screen, job?.requestId, job?.phase, job?.updatedAt]);
  function adoptJob(next: V2OwnerJob) { setJob(next); if (next.retrySafe) setLife(current => current?.id === next.tokenId ? { ...current, pendingRequest: undefined } : current); }
  async function showJob(next: V2OwnerJob) { adoptJob(next); await loadLife(next.tokenId, config, undefined, next.phase === 'ready' ? 'home' : 'pending', next.phase === 'ready' ? next.requestId : undefined); }
  function retryDay() { if (walletOperation.current) return; const target = job?.tokenId || pendingRef.current?.tokenId || pending?.tokenId; if (!target) { setMessage('Choose the original life to try again.'); return; } remember(); setJob(undefined); void loadLife(target, config, undefined, 'care'); }
  async function listLives(who = account, cursor?: string) {
    if (!who) { await run('connect'); return; }
    const reading = ++portfolioRead.current;
    setBusy(true); setLivesLoading(true); setMessage(''); setErrorCode('');
    if (!cursor) { setOwned([]); setNextCursor(undefined); }
    try {
      const page = preview?.lives ? { lives: preview.lives, nextCursor: undefined } : await v2Api.lives(who, cursor);
      if (reading !== portfolioRead.current) return;
      setOwned(current => cursor ? [...new Map([...current, ...page.lives].map(l => [l.id, l])).values()] : page.lives); setNextCursor(page.nextCursor);
    } catch (e) { if (reading === portfolioRead.current && currentScreen.current === 'lives') setMessage(errorText(e)); }
    finally { if (reading === portfolioRead.current) { setBusy(false); setLivesLoading(false); } }
  }
  function changeWallet() {
    if (walletOperation.current) return;
    if (pendingRef.current) { void run('connect'); return; }
    portfolioRead.current++; nativeBalanceRead.current++; nativeBalanceScope.current = '';
    wallet.current = undefined; activeProvider.current = undefined; authenticated.current = ''; setVerifiedAccount(undefined); setV2Session('');
    setAccount(undefined); setNativeBalance(undefined); setOwned([]); setLivesLoading(false); setBusy(false); setWalletBalance('0'); setAllowance('0'); setJob(undefined); clearQuote();
    setWalletIntent('connect'); overlay('wallet');
  }
  async function showHistory(older?: number) {
    if (!life) return; overlay('history');
    setMessage(''); setErrorCode('');
    const cached = historyCache.current.get(historyKey);
    setDays(cached?.days || []); setBefore(cached?.before);
    if (!older && cached && (cached.days[0]?.day || 0) >= life.state.day) { setHistoryLoading(false); return; }
    const reading = generation.current;
    setBusy(true); setHistoryLoading(true);
    try {
      const page = preview?.days ? { days: preview.days, nextBefore: undefined } : await v2Api.days(life.id, older, world);
      if (reading !== generation.current) return;
      const combined = [...new Map([...(cached?.days || []), ...page.days].map(day => [day.day, day])).values()].sort((a, b) => b.day - a.day);
      // Keep already-read pages, including a complete older history. If several
      // new pages appeared, the next cursor fills the first actual gap instead.
      let missing = combined[0]?.day || 0;
      for (const day of combined) { if (day.day !== missing) break; missing--; }
      const nextBefore = missing > 0 ? missing + 1 : undefined;
      setDays(combined); setBefore(nextBefore); historyCache.current.set(historyKey, { days: combined, before: nextBefore, scroll: cached?.scroll || 0, selected: cached?.selected });
    } catch (e) { if (reading === generation.current && currentScreen.current === 'history') setMessage(errorText(e)); } finally { if (reading === generation.current) { setBusy(false); setHistoryLoading(false); } }
  }
  function hatch(source: 'native' | 'purse' | 'wallet' = 'native') {
    if (busy || walletOperation.current) return;
    setPayment(source);
    if (example) { setExample(false); backStack.current = ['welcome']; returnScreen.current = 'welcome'; go('hatch'); }
    else overlay('hatch');
  }
  function selectPayment(source: 'native' | 'purse' | 'wallet') { if (busy || walletOperation.current) return; setPayment(source); }
  function choose(index: number) {
    if (busy || walletOperation.current) return;
    clearQuote();
    const current = kitRef.current, next = [...current] as Parcel, selected = current.indexOf(index);
    if (selected >= 0) { next[selected] = undefined; setParcelSlot(selected); }
    else {
      const seedSlot = current.findIndex(i => i !== undefined && i >= 13);
      const target = index >= 13 && seedSlot >= 0 ? seedSlot : parcelSlot;
      const wasEmpty = current[target] === undefined; next[target] = index;
      const nextEmpty = next.findIndex(i => i === undefined);
      setParcelSlot(wasEmpty && nextEmpty >= 0 ? nextEmpty : target);
      if (guide !== undefined) setGuide(Math.min(2, next.filter(i => i !== undefined).length));
    }
    kitRef.current = next; setKit(next);
    if (parcelKey) storage.set(parcelKey, next);
  }
  function selectCategory(index: number) {
    setCategory(index);
    const seedSlot = kit.findIndex(i => i !== undefined && i >= 13);
    if (!busy && !walletOperation.current && index === 1 && seedSlot >= 0) setParcelSlot(seedSlot);
  }
  function restoreParcel() {
    const saved = parcelKey ? storage.get<(number | null)[]>(parcelKey) : undefined;
    const next: Parcel = [undefined, undefined, undefined];
    if (Array.isArray(saved) && saved.length === 3) for (let i = 0; i < 3; i++) { const value = saved[i]; if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 21 && !next.includes(value) && (value < 13 || !next.some(n => n !== undefined && n >= 13))) next[i] = value; }
    kitRef.current = next; setKit(next); const empty = next.findIndex(i => i === undefined); setParcelSlot(empty < 0 ? 0 : empty); clearQuote();
  }
  async function prepare() { if (!life) return; if (readyJob) { await loadLife(readyJob.tokenId, config, undefined, 'home', readyJob.requestId, { play: true }); return; } if (life.pendingRequest) { await run('resume'); return; } setFreshDay(undefined); setPlayRequest(undefined); setReadingDay(undefined); restoreParcel(); overlay('care'); }
  function reviewDay() { if (busy || walletOperation.current) return; finishGuide(); clearQuote(); overlay('review'); }
  async function share() { if (!life) return; const url = new URL(location.origin + '/'); url.search = new URLSearchParams({ rooster: life.id, chainId: String(life.chainId), collection: life.collection }).toString(); try { await navigator.clipboard.writeText(url.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setMessage('Copy this page address to share this life.'); } }
  const stageLife = life, stagePacket = packet;
  const entryScenery = !example && !owner && (screen === 'welcome' || backStack.current.includes('welcome'));
  const nameValid = /^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(name.trim().toUpperCase());
  const sum = stats.reduce((a, b) => a + b, 0), purse = BigInt(life?.purseMicro || '0');
  const overlayOpen = screen !== 'home';
  const pendingDayJob = !pending || pending.kind === 'day' && pending.requestId === job?.requestId ? job : undefined;
  const pendingKind = pendingDayJob ? 'day' : pending?.kind || (walletBusy ? operation.current : undefined);
  const dayReady = pendingDayJob?.phase === 'ready', dayPaused = pendingDayJob?.phase === 'quarantined';
  const dayRetry = !!pendingDayJob?.retrySafe;
  const askingWallet = walletBusy && !pending?.hash && !pendingDayJob;
  const pendingTitle = dayReady ? 'A day to watch' : dayRetry ? 'Day preparation failed' : dayPaused ? 'Checking this day' : askingWallet ? walletPhase === 'signin' ? 'Verify your wallet' : 'Confirm in your wallet' : pendingKind === 'mint' ? `Hatching ${pending?.birthDraft?.name || name}` : pendingKind === 'approve' ? 'Permission to hatch' : pendingKind === 'withdraw' ? 'Taking NHC home' : pendingKind === 'expire' ? 'Closing this day' : pendingDayJob?.phase === 'saving' || pendingDayJob?.phase === 'prepared' ? 'Saving your day' : pendingDayJob ? 'Jev is choosing the day' : 'Confirming your day';
  const pendingNote = dayReady ? `${life?.name || 'Your rooster'} has a day to show you.` : dayRetry ? pendingDayJob?.failureMessage || 'The AI could not prepare this day. Your saved home is unchanged.' : dayPaused ? 'Your payment is recorded. Check again shortly.' : askingWallet ? walletPhase === 'signin' ? 'Sign-in only. No fee.' : `Review the ${pendingKind === 'mint' ? 'NFT mint' : pendingKind === 'approve' ? 'NHC permission' : 'transaction'} in your wallet.` : pendingKind === 'mint' ? 'Confirming your rooster NFT onchain.' : pendingKind === 'approve' ? `Allow 250 NHC, then hatch ${pending?.birthDraft?.name || name}.` : pendingKind === 'withdraw' ? 'Sending NHC to your wallet.' : pendingKind === 'expire' ? 'Your rooster stays at home.' : pendingDayJob?.phase === 'saving' || pendingDayJob?.phase === 'prepared' ? 'Saving the day onchain.' : pendingDayJob ? pendingDayJob.failureMessage || 'One little ambition. A day of their own.' : 'Waiting for blockchain confirmation.';
  const reconnectNeeded = !!pending?.intent && !same(pending.intent.account, wallet.current?.account);
  const pendingLabel = dayReady ? 'Watch day' : reconnectNeeded ? 'Reconnect wallet' : !wallet.current && pending?.kind === 'day' ? 'Connect wallet' : pendingDayJob ? 'Check day' : pendingKind === 'approve' ? 'Check permission' : pendingKind === 'withdraw' ? 'Check transfer' : pendingKind === 'mint' ? 'Check hatching' : 'Check payment';
  async function checkPending() {
    if (pendingCheck.current || walletOperation.current) return;
    pendingCheck.current = true; setBusy(true); setMessage(''); setErrorCode('');
    try {
      if (dayReady && pendingDayJob) { remember(); await loadLife(pendingDayJob.tokenId, config, undefined, 'home', pendingDayJob.requestId, { whilePending: true, play: true }); }
      else if (reconnectNeeded || !wallet.current && pending?.kind === 'day') await run('resume');
      else if (pendingDayJob) { const next = await v2Api.wake(pendingDayJob.requestId); adoptJob(next); if (next.phase === 'ready') { remember(); await loadLife(next.tokenId, config, undefined, 'home', next.requestId, { whilePending: true }); } }
      else await checkPayment();
    } catch (e) { if (currentScreen.current === 'pending') setMessage(errorText(e)); }
    finally { pendingCheck.current = false; if (!walletOperation.current) setBusy(false); }
  }
  const title: Record<Exclude<Screen, 'home'>, string> = { welcome: exactId ? 'Opening this home' : 'A little life of its own.', profile: life?.state.alive === false ? `${life.name} · remembered` : life?.name || 'A little life', hatch: 'A new rooster', birth: birth ? `Rooster #${birth.id}` : 'Your rooster NFT', care: life?.state.day === 0 ? 'Pack the first day' : 'Pack tomorrow', review: `Ready for day ${(life?.state.day || 0) + 1}?`, pending: pendingTitle, purse: `${life?.name || 'A little life'}’s purse`, history: 'Days', lives: 'Your roosters', menu: 'Menu', wallet: 'Choose your wallet', stock: historical && packet ? `Day ${packet.result.state.day} belongings` : 'Belongings' };
  const closeDestination = backStack.current.at(-1) || returnScreen.current;
  const nestedSheet = closeDestination !== 'home' && closeDestination !== screen;
  const backLabel = closeDestination === 'welcome' ? 'Back to start' : closeDestination === 'hatch' ? 'Back to hatching' : closeDestination === 'care' ? 'Back to supplies' : closeDestination === 'review' ? 'Back to review' : closeDestination === 'profile' ? 'Back to rooster' : closeDestination === 'menu' ? 'Back to menu' : 'Back';
  const entryRecovery = !exactId && !!config && !!pending;
  const entryRecoveryLabel = pending?.kind === 'mint' || pending?.kind === 'approve' ? 'Continue hatching' : pending?.kind === 'day' ? 'Open my day' : pending?.kind === 'withdraw' ? 'Check transfer' : 'Check day';
  let body: ReactNode;
  if (screen === 'welcome') body = <>
    <div className="v2-egg"><img src={itemImage(38)} alt=""/></div>
    {!exactId && <p>Raise a rooster with a mind of its own.</p>}
    <button className="v2-primary" disabled={busy || (!config && !message)} onClick={() => exactId && malformedWorld ? location.assign(location.pathname + '?v2=1') : exactId && config ? void loadLife(exactId, initialWorld || config, Number(query.get('day')) || undefined, 'profile') : message && !config ? (setMessage(''), setBoot(v => v + 1)) : entryRecovery ? void run('resume') : hatch()}>
      {exactId && malformedWorld ? 'Back to start' : exactId ? busy || !config && !message ? 'Opening home…' : 'Try again' : message && !config ? 'Try again' : entryRecovery ? entryRecoveryLabel : 'Hatch a rooster'}
    </button>
    {exactId ? <button className="v2-text-button" onClick={() => location.assign(location.pathname + '?v2=1')}>Back to start</button> : <div className="v2-entry-options">
      {life && packet && <button className="v2-text-button" disabled={busy} onClick={watchExample}><Icon name="play" size={16}/>Watch example</button>}
      <button className="v2-text-button" disabled={!config || busy} onClick={() => void run('connect')}><Icon name="leaf" size={16}/>Your roosters</button>
    </div>}
  </>;
  else if (screen === 'profile' && life) body = <>
    <div className="v2-life-portrait"><img className="v2-dynamic-portrait" src={`/api/v2/nft/${life.id}/image.svg?${new URLSearchParams({ chainId: String(life.chainId), collection: life.collection })}`} alt={`${life.name} and their saved home`}/></div>
    <a className="v2-nft-badge" href={explorerToken(life.chainId, life.collection, life.id)} target="_blank" rel="noreferrer">NFT #{life.id}<span aria-hidden="true">↗</span></a>
    <div className="v2-life-facts"><span>DAY {life.state.day}</span><span>LV{String(life.state.level).padStart(2, '0')}</span><span><Icon name="wallet" size={16}/>{coins(life.purseMicro)} NHC</span></div>
    {!life.state.alive && <p className="v2-small-note">{endingNote(life.state)}</p>}
    <button className="v2-primary" onClick={() => go('home')}><Icon name="house" size={16}/>Visit home</button>
    <div className="v2-secondary-row"><button onClick={() => void showHistory()}><Icon name="book" size={16}/>Days</button><button onClick={() => void share()}><Icon name="mail" size={16}/>{copied ? 'Copied' : 'Share'}</button>{owner && <button onClick={() => overlay('purse')}><Icon name="wallet" size={16}/>Purse</button>}</div>
    {!owner && <button className="v2-text-button" onClick={() => hatch()}>Hatch your own</button>}
  </>;
  else if (screen === 'hatch') body = <>
    <div className="v2-egg small"><img src={itemImage(38)} alt=""/></div>
    {networkCard()}
    <label className="v2-name-field"><span>Name your rooster</span><input value={name} disabled={busy} maxLength={8} placeholder="Name" autoComplete="off" autoCapitalize="characters" onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}/></label>
    <details className="v2-personality"><summary>Personality<span>{sum < 5 ? `${5 - sum} to place` : 'Change'}</span></summary>
      <div className="v2-stat-picker">{(['Body', 'Wits', 'Spirit'] as const).map((label, i) => <div key={label}><span>{label}</span><button aria-label={`Less ${label.toLowerCase()}`} disabled={stats[i] === 0 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n - 1 : n))}>−</button><b>{stats[i]}</b><button aria-label={`More ${label.toLowerCase()}`} disabled={sum >= 5 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n + 1 : n))}>+</button></div>)}</div>
    </details>
    {sum < 5 && <p className="v2-small-note">{5 - sum} {5 - sum === 1 ? 'point' : 'points'} to place in Personality</p>}
    <details className="v2-payment-options"><summary><span>{payment === 'native' ? config ? `${eth(config.nativeMintPrice)} ${network?.nativeSymbol || 'ETH'}` : 'ETH' : '250 NHC'}</span><span>Change</span></summary>
      <div className="v2-payment"><button disabled={busy} aria-pressed={payment === 'native'} onClick={() => selectPayment('native')}>{config ? eth(config.nativeMintPrice) + ' ETH' : 'ETH'}</button><button disabled={busy} aria-pressed={payment !== 'native'} onClick={() => selectPayment(owner && purse >= 250000000n ? 'purse' : 'wallet')}>250 NHC</button></div>
    </details>
    {payment !== 'native' && <p className="v2-small-note">{payment === 'purse' ? `From ${life?.name}’s purse` : 'From your wallet'}{owner && purse >= 250000000n && <button className="v2-inline-button" disabled={busy} onClick={() => selectPayment(payment === 'wallet' ? 'purse' : 'wallet')}>Change</button>}</p>}
    <button className="v2-primary" disabled={!config || busy || !nameValid || sum !== 5} onClick={() => void run('mint')}><Icon name="leaf" size={16}/>{busy ? 'Hatching…' : payment === 'wallet' && BigInt(allowance) < 250000000n ? 'Allow 250 NHC' : 'Hatch ' + (name.trim() || 'rooster')}</button>
    <span className="v2-fee-note">Network fee applies</span>
  </>;
  else if (screen === 'birth' && birth && config) body = <BirthReveal key={`${config.collection}:${birth.id}`} id={birth.id} name={life?.id === birth.id && currentWorld ? life.name : pending?.birthDraft?.name || name} egg={itemImage(38)} rooster={life?.id === birth.id && currentWorld ? roosterImage(life.state.seed) : undefined} explorer={explorerToken(config.chainId, config.collection, birth.id)} transaction={birth.hash ? explorerTransaction(config.chainId, birth.hash) : undefined} busy={busy} onHome={() => { setBirth(undefined); go('home'); }} onRetry={() => { if (pendingRef.current) void checkPayment(); else void loadLife(birth.id, config, undefined, 'birth'); }}/>
  else if (screen === 'care' && life) {
    const choices = category === 0 ? [0, 2, 1, 4, 5, 3, 11] : category === 1 ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 12] : [7, 8, 9, 10];
    body = <>
      <DayFlow stage={0}/>
      {guide !== undefined && <aside className="v2-pack-guide" data-step={guide}><span className="v2-guide-dots" aria-label={`Tip ${guide + 1} of 3`}>{[0, 1, 2].map(i => <i key={i} data-active={i === guide}/>)}</span><strong>{['Tap a supply.', 'Pick up to three.', 'Review, then start.'][guide]}</strong><button className="v2-icon-button" aria-label="Dismiss packing tips" onClick={finishGuide}><Icon name="close" size={16}/></button></aside>}
      <div className="v2-post-tray">{[0, 1, 2].map(i => <button key={i} className={'v2-post-slot' + (parcelSlot === i ? ' is-target' : '')} aria-pressed={parcelSlot === i} aria-label={`Parcel slot ${i + 1}: ${kit[i] === undefined ? 'empty' : itemName(kit[i]!)}`} disabled={busy} onClick={() => { if (!walletOperation.current) setParcelSlot(i); }}>{kit[i] === undefined ? <span className="v2-empty-slot" aria-hidden="true">+</span> : <><img src={itemImage(kit[i]!)} alt=""/><i>×1</i></>}</button>)}</div>
      <div className="v2-supply-tabs">{(['Care', 'Garden', 'House'] as const).map((label, i) => <button key={label} aria-pressed={category === i} onClick={() => selectCategory(i)}>{label}</button>)}</div>
      <div className={'v2-supplies' + (category === 2 ? ' is-house' : '')}>{choices.map(i => <button key={i} className={`${kit.includes(i) ? 'selected' : ''}${i === 11 || i === 12 ? ' v2-supply-wide' : ''}`} aria-pressed={kit.includes(i)} aria-label={`${kit.includes(i) ? 'Remove' : 'Pack'} ${i >= 13 ? PLANTS[i - 12]?.name : itemName(i)}`} disabled={busy} onClick={() => choose(i)}><img src={itemImage(i)} alt=""/><span>{i >= 13 ? PLANTS[i - 12]?.name : itemName(i)}</span><small>{i >= 13 ? `${PLANTS[i - 12]?.ticks} days` : life.state.inventory[i] ? `At home ×${life.state.inventory[i]}` : '×1'}</small></button>)}</div>
      <div className="v2-pack-controls"><button className="v2-primary" disabled={busy} onClick={reviewDay}><Icon name="check" size={16}/>Review day {life.state.day + 1}</button>
      <span className="v2-fee-note">{packed.length ? `${packed.length} of 3 packed` : 'Up to 3 supplies · included'}</span></div>
    </>;
  }
  else if (screen === 'review' && life) body = <>
    <DayFlow stage={1}/>
    <div className="v2-review-parcel">{kit.map((index, i) => <div key={i}>{index === undefined ? <span>—</span> : <><img src={itemImage(index)} alt=""/><span>{itemName(index)}</span></>}</div>)}</div>
    <div className="v2-review-facts"><strong>{life.name} chooses what happens.</strong><span>{packed.length ? 'Your supplies arrive at the mailbox.' : 'A day with what is already at home.'}</span></div>
    {networkCard()}
    <div className="v2-signature-steps"><span data-done={signedIn}><b>{signedIn ? <Icon name="check" size={16}/> : '1'}</b><span>Sign-in<small>No fee · {signedIn ? 'verified' : 'once per visit'}</small></span></span><span><b>2</b><span>Start day<small>One transaction · then Jev plans</small></span></span></div>
    {busy && <div className="v2-review-progress" role="status"><Icon name={walletPhase === 'signin' ? 'wallet' : 'check'} size={16}/>{walletPhase === 'signin' ? 'Confirm sign-in in your wallet…' : quote ? 'Confirm the day in your wallet…' : 'Checking this day…'}</div>}
    <button className="v2-primary" disabled={busy} onClick={() => void run(signedIn ? 'day' : 'verify')}><Icon name="wallet" size={16}/>{busy ? walletPhase === 'signin' ? 'Waiting for sign-in…' : quote ? 'Waiting for wallet…' : 'Checking…' : signedIn ? `Start day ${life.state.day + 1}` : 'Verify wallet'}</button>
    <span className="v2-fee-note v2-review-fee">{quote ? `Est. ${eth(quote.totalEstimate)} ${network?.nativeSymbol || 'ETH'} · network + preparation` : 'Network + preparation fee when you start'}</span>
    <button className="v2-text-button" disabled={busy} onClick={close}>Edit supplies</button>
  </>;
  else if (screen === 'pending') {
    const saving = !!pendingDayJob && ['prepared', 'saving', 'ready'].includes(pendingDayJob.phase);
    const visual = dayReady ? 'ready' : dayRetry || dayPaused ? 'failed' : askingWallet ? 'wallet' : saving ? 'saving' : pendingDayJob ? 'ai' : 'chain';
    body = <>
      {pendingKind === 'day' && <DayFlow stage={pendingDayJob ? 2 : 1} complete={dayReady}/>}
      <ProcessGraphic stage={visual}/>
      <p className="v2-pending-status">{pendingNote}</p>
      {dayRetry ? <button className="v2-primary" disabled={busy} onClick={retryDay}>Try this day again</button>
        : dayReady ? <button className="v2-primary" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Opening…' : 'Watch day'}</button>
        : canCloseDay ? <button className="v2-primary" disabled={busy} onClick={() => void run('expire')}>{busy ? 'Closing…' : 'Close expired day'}</button>
        : pendingDayJob ? <button className="v2-primary" disabled={walletBusy} onClick={() => go(owner ? 'home' : 'welcome')}>{owner ? 'Back home' : 'Back to start'}</button>
        : <button className="v2-primary" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Checking…' : pendingLabel}</button>}
      {pendingDayJob && !dayReady && !dayRetry && <button className="v2-text-button" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Checking…' : 'Check again'}</button>}
      {pendingDayJob && (dayReady || dayRetry || canCloseDay) && <button className="v2-text-button" disabled={walletBusy} onClick={() => go(owner ? 'home' : 'welcome')}>{owner ? 'Back home' : 'Back to start'}</button>}
      {(pending?.hash || pendingDayJob?.ownerTx) && config && <a className="v2-text-button v2-transaction-link" href={explorerTransaction(config.chainId, (pending?.hash || pendingDayJob?.ownerTx)!)} target="_blank" rel="noreferrer">View transaction</a>}
    </>;
  }
  else if (screen === 'purse' && life) body = <><div className="v2-purse-total"><Icon name="wallet" size={32}/><strong>{coins(life.purseMicro)}</strong><span>NHC</span></div>{!life.state.alive && <p className="v2-small-note">Still yours to take home.</p>}{owner && purse === 0n ? <><p className="v2-small-note">Flowers, fruit and crafts can fill this purse.</p><button className="v2-primary" disabled={busy} onClick={() => life.state.alive ? go('home') : hatch() }>{life.state.alive ? 'Back home' : 'Hatch another'}</button></> : owner ? <><button className="v2-primary" disabled={busy} onClick={() => void run('withdraw')}>{busy ? 'Sending…' : 'Withdraw to wallet'}</button>{purse >= 250000000n && <button className="v2-text-button" disabled={busy} onClick={() => hatch('purse')}>Hatch another · 250 NHC</button>}</> : <button className="v2-primary" onClick={() => go('home')}>Visit home</button>}</>;
  else if (screen === 'history') body = <>
    {historyLoading && <div className="v2-list-loading" role="status"><Icon name="book" size={16}/>Opening days…</div>}
    <div className="v2-history-list">{days.map(d => <button key={d.day} className={d.day === life?.state.day ? 'is-latest' : undefined} disabled={historyLoading} aria-label={`Watch day ${d.day}`} aria-current={historyCache.current.get(historyKey)?.selected === d.day ? 'true' : undefined} onClick={() => { const cached = historyCache.current.get(historyKey); if (cached) cached.selected = d.day; if (life) void loadLife(life.id, world, d.day); }}><span>DAY {String(d.day).padStart(2, '0')}</span>{d.day === life?.state.day && <small className="v2-day-meta">Latest</small>}{d.rewardMicro && BigInt(d.rewardMicro) > 0n && <small>+{coins(d.rewardMicro)} NHC</small>}<Icon name="play" size={16}/></button>)}</div>
    {!days.length && !historyLoading && !message && <p>No saved days here yet.</p>}
    {message && <button className="v2-text-button" disabled={historyLoading} onClick={() => void showHistory()}>Try days again</button>}
    {before && <button className="v2-text-button" disabled={historyLoading} onClick={() => void showHistory(before)}>Earlier days</button>}
    {life && <button className="v2-primary" disabled={walletBusy} onClick={() => void loadLife(life.id, world)}>{life.state.day ? 'Latest home' : 'Back home'}</button>}
  </>;
  else if (screen === 'lives') body = <>
    {livesLoading && <div className="v2-list-loading" role="status"><Icon name="leaf" size={16}/>Finding your roosters…</div>}
    <div className="v2-owned-lives">{owned.map(l => <button key={l.id} onClick={() => void loadLife(l.id, l)}><img src={roosterImage(l.state.seed)} alt=""/><span>{l.name}<small>DAY {l.state.day} · {l.state.alive ? `LV${l.state.level}` : 'Remembered'}</small></span><Icon name="house" size={16}/></button>)}</div>
    {!owned.length && !livesLoading && !message && <p>No roosters in this wallet.</p>}
    {message && <button className="v2-text-button" disabled={livesLoading} onClick={() => void listLives()}>Look again</button>}
    {nextCursor && <button className="v2-text-button" disabled={livesLoading} onClick={() => void listLives(account, nextCursor)}>More roosters</button>}
    <button className="v2-primary" disabled={busy} onClick={() => hatch()}>Hatch a rooster</button><button className="v2-text-button" disabled={busy} onClick={changeWallet}>Change wallet</button>
  </>;
  else if (screen === 'stock' && life) {
    const state = historical && packet ? packet.result.state : life.state;
    const groups = [{ name: 'For home', test: (i: number) => i < 13 && i !== 6 }, { name: 'Seeds', test: (i: number) => i >= 13 && i < 22 }, { name: 'From garden', test: (i: number) => i >= 22 && i < 30 }, { name: 'Workshop', test: (i: number) => i === 6 || i >= 30 }];
    body = <>{groups.map(group => { const stock = state.inventory.flatMap((n, i) => n > 0 && group.test(i) ? [{ n, i }] : []); return stock.length ? <section className="v2-belongings-group" key={group.name}><h2>{group.name}</h2><div className="v2-belongings">{stock.map(({ n, i }) => <div key={i}><img src={itemImage(i)} alt=""/><span>{itemName(i)}</span><b>×{n.toLocaleString()}</b></div>)}</div></section> : null; })}{!state.inventory.some(n => n > 0) && <p>A little room for future things.</p>}</>;
  }
  else if (screen === 'wallet') body = <>
    <Icon name="wallet" size={32}/>
    {networkCard()}
    {walletIntent !== 'connect' && <span className="v2-wallet-purpose">{walletIntent === 'verify' ? 'Sign-in · no fee' : walletIntent === 'mint' || walletIntent === 'approve' ? `Hatch ${name.trim() || 'your rooster'}` : walletIntent === 'withdraw' ? 'NHC to your wallet' : walletIntent === 'day' ? 'Start the next day' : walletIntent === 'expire' ? 'Close this expired day' : pending?.kind === 'mint' || pending?.kind === 'approve' ? 'Finish hatching' : 'Open your day'}</span>}
    {wallets.length ? <div className="v2-wallet-choices">{wallets.map(w => <button className="v2-primary" disabled={busy} key={w.id} onClick={() => void attach(w, walletIntent)}>{busy ? 'Opening wallet…' : w.name}</button>)}</div> : <><p>Open this game in your wallet’s browser to bring a life home.</p><a className="v2-primary" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Get a wallet</a></>}
  </>;
  else body = <>
    {networkCard()}
    {life && <>
      <button className="v2-menu-life" onClick={() => overlay('profile')}><img src={roosterImage(life.state.seed)} alt=""/><span>{life.name}<small>DAY {life.state.day} · {life.state.alive ? `LV${life.state.level}` : 'Remembered'}</small></span><Icon name="house" size={16}/></button>
      <div className="v2-menu-grid">
        <button onClick={() => void showHistory()}><Icon name="book" size={16}/><span>Days</span></button>
        <button onClick={() => overlay('stock')}><Icon name="house" size={16}/><span>Belongings</span></button>
        <button onClick={() => overlay('purse')}><Icon name="wallet" size={16}/><span>Purse</span></button>
        <button onClick={() => void share()}><Icon name="mail" size={16}/><span>{copied ? 'Copied' : 'Share'}</span></button>
      </div>
    </>}
    <div className="v2-menu-account"><button className="v2-text-button" disabled={busy} onClick={() => void run('connect')}><Icon name="leaf" size={16}/>Your roosters</button><button className="v2-text-button" disabled={busy} onClick={() => hatch()}>Hatch a rooster</button></div>
    <LifeSoundToggle/>
  </>;

  return <div ref={root} className={`v2-journey${opening !== 'closed' ? ' is-booting' : ''}`}>
    {!entryScenery && (stageLife || stagePacket) ? <V2Player
      key={`${stageLife?.collection}:${stageLife?.id}:${stagePacket?.requestId || stageLife?.revision}:${example ? 'example' : 'home'}`}
      packet={stagePacket} life={stageLife} example={example} onEndExample={example ? endExample : undefined}
      autoPlay={!example && !!playRequest && playRequest === stagePacket?.requestId}
      homeFirst={!example && !!owner && !historical && readingDay === undefined && (!freshDay || freshDay !== stagePacket?.requestId)}
      suspended={overlayOpen || opening !== 'closed'} opening={opening}
      onMenu={example ? undefined : () => overlay('menu')} onProfile={example ? undefined : () => overlay('profile')}
      onExit={example ? endExample : historyControls ? () => void showHistory() : exactId ? () => overlay('profile') : undefined}
      onPrepare={!example && owner && !historical ? prepare : undefined}
      prepareLabel={readyJob ? 'Watch new day' : life?.pendingRequest ? 'Open day ' + (life.state.day + 1) : life?.state.day === 0 ? 'Prepare day 1' : undefined}
      onHatch={example || !owner ? () => hatch() : !life?.state.alive ? () => hatch(purse >= 250000000n ? 'purse' : 'native') : undefined}
      hatchLabel={owner ? 'Hatch another' : undefined}
      onPurse={!example && owner ? () => overlay('purse') : undefined}
      onLatest={!example && historical && historyControls && life ? () => void loadLife(life.id, world) : undefined}
    /> : <TitleScenery opening={opening}/>}
    {overlayOpen && <div className={`v2-sheet-backdrop v2-sheet-${screen}`}><section className="v2-sheet v2-pixel-frame" role="dialog" aria-modal="true" aria-label={title[screen]}><header><h1>{title[screen]}</h1>{screen !== 'menu' && <LifeSoundButton className="v2-sheet-sound"/>}{screen !== 'welcome' && <button className="v2-icon-button" disabled={walletBusy} onClick={() => screen === 'pending' ? go(owner ? 'home' : 'welcome') : screen === 'birth' ? go(birth && life?.id === birth.id && currentWorld ? 'home' : 'pending') : close()} aria-label={nestedSheet ? backLabel : 'Close'}><Icon name={nestedSheet ? 'back' : 'close'} size={16}/></button>}</header><div className="v2-sheet-body" ref={sheetBody} onScroll={event => { if (screen === 'history') { const cached = historyCache.current.get(historyKey); if (cached) cached.scroll = event.currentTarget.scrollTop; } else sheetScroll.current.set(`${historyKey}:${screen}`, event.currentTarget.scrollTop); }}>{body}{message && <><p className="v2-inline-error" role="alert">{message}</p>{errorCode === 'funds' && <a className="v2-text-button" href="https://faucet.testnet.chain.robinhood.com/" target="_blank" rel="noreferrer">Get test ETH</a>}</>}</div></section></div>}
    {screen === 'home' && message && <button className="v2-toast" onClick={() => overlay('profile')}>{message}</button>}
    {opening !== 'closed' && <CartridgeOpening phase={opening} onStart={startOpening}><LifeSoundButton className="v2-title-sound"/></CartridgeOpening>}
  </div>;
}
