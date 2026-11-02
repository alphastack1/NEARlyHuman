import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { formatEther, formatUnits, type Address, type EIP1193Provider, type Hex } from 'viem';
import { connectV2Wallet, createV2ChainReader, mintedId, resolveV2Submission, type V2SubmissionIntent } from '../../chain/v2-client';
import { v2Api, setV2Session, V2ApiError } from '../v2-api';
import { api } from '../api';
import { Icon, type IconName } from '../Icons';
import { CartridgeOpening, type CartridgePhase } from '../CartridgeOpening';
import { roosterCanvas } from '../../art/rooster';
import { itemArt } from '../../game/v2/art';
import { ITEMS, PLANTS, kitMask, createState } from '../../v2';
import { createV2WorldRenderer } from '../../game/v2';
import type { V2OwnerJob, V2OwnerQuote, V2PublicConfig, V2PublicLife, V2World } from '../../v2/public';
import { filmPacket, itemName, type V2FilmPacket } from '../../v2/presentation';
import V2Player from './V2Player';
import '../v2Journey.css';

type Provider = EIP1193Provider & { on?: (name: string, listener: (...a: any[]) => void) => void; removeListener?: (name: string, listener: (...a: any[]) => void) => void };
type Wallet = Awaited<ReturnType<typeof connectV2Wallet>>;
type Screen = 'home' | 'welcome' | 'profile' | 'hatch' | 'care' | 'pending' | 'purse' | 'history' | 'lives' | 'menu' | 'wallet' | 'stock';
type Action = 'mint' | 'day' | 'withdraw' | 'connect' | 'expire' | 'resume' | 'approve';
interface BirthDraft { name: string; stats: number[]; payment: 'native' | 'purse' | 'wallet'; sourceId?: string }
interface Pending { kind: Action; hash?: Hex; requestId?: Hex; tokenId?: string; intent?: V2SubmissionIntent; cursor?: string; birthDraft?: BirthDraft }
interface WalletChoice { id: string; name: string; provider: Provider }
interface Preview { config: V2PublicConfig; life?: V2PublicLife; packet?: unknown; account?: Address; lives?: V2PublicLife[]; days?: { day: number; rewardMicro?: string }[]; pending?: Pending; job?: V2OwnerJob }
declare global { interface Window { __NH_V2_JOURNEY_PREVIEW?: Preview } }
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const artCache = new Map<string, string>();
function itemImage(index: number) { const key = 'item:' + index; if (!artCache.has(key)) artCache.set(key, itemArt(index).toDataURL()); return artCache.get(key)!; }
function roosterImage(seed: string) { if (!artCache.has(seed)) artCache.set(seed, roosterCanvas(seed, 'idle').toDataURL()); return artCache.get(seed)!; }
const coins = (value: string) => { const amount = Number(formatUnits(BigInt(value), 6)); return amount.toLocaleString(undefined, { maximumFractionDigits: amount > 0 && amount < .001 ? 6 : 3 }); };
const eth = (value: string) => { const n = Number(formatEther(BigInt(value))); return n < .000001 && n > 0 ? '< 0.000001' : n.toLocaleString(undefined, { maximumFractionDigits: 6 }); };
function errorText(e: unknown) { const code = (e as { code?: unknown })?.code; if (code === 4001 || code === 'ACTION_REJECTED' || /rejected|denied/i.test(e instanceof Error ? e.message : '')) return 'No problem. Nothing was sent.'; return e instanceof Error && e.message.length < 180 ? e.message : 'That did not go through. Try again.'; }
const storage = { get<T>(k: string): T | undefined { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? undefined; } catch { return; } }, set(k: string, value: unknown) { try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* In-memory continuation remains usable. */ } }, remove(k: string) { try { localStorage.removeItem(k); } catch { /* No browser ledger reset. */ } } };

/** Title artwork only: no public NFT, earned film or economic outcome is invented. */
function TitleScenery({ opening }: { opening: CartridgePhase }) {
  const host = useRef<HTMLDivElement | null>(null), world = useRef<ReturnType<typeof createV2WorldRenderer> | undefined>(undefined);
  useEffect(() => { const view = createV2WorldRenderer(host.current!, { state: createState({ seed: 0x4e48 }) }); world.current = view; view.setInputEnabled(false); view.setOpening(opening); return () => { view.destroy(); world.current = undefined; }; }, []);
  useEffect(() => world.current?.setOpening(opening), [opening]);
  return <div ref={host} className="v2-title-scenery" aria-hidden="true"/>;
}

export default function V2Journey() {
  const preview = import.meta.env.DEV ? window.__NH_V2_JOURNEY_PREVIEW : undefined;
  const query = new URLSearchParams(location.search), exactId = query.get('rooster') || query.get('id');
  const initialWorld: V2World | undefined = query.get('collection') && /^0x[0-9a-f]{40}$/i.test(query.get('collection')!) && /^[1-9]\d{0,5}$/.test(query.get('chainId') || '') ? { chainId: Number(query.get('chainId')), collection: query.get('collection') as Address } : undefined;
  const malformedWorld = (query.has('collection') || query.has('chainId')) && !initialWorld;
  const [config, setConfig] = useState<V2PublicConfig | undefined>(preview?.config);
  const [life, setLife] = useState<V2PublicLife | undefined>(preview?.life);
  const [packet, setPacket] = useState<V2FilmPacket | undefined>(filmPacket(preview?.packet));
  const [screen, setScreen] = useState<Screen>(preview?.pending || preview?.job ? 'pending' : preview?.life ? exactId ? 'profile' : 'home' : 'welcome');
  const [opening, setOpening] = useState<CartridgePhase>(() => exactId || preview ? 'closed' : sessionStorage.getItem('nh:v2:opening') ? 'closed' : 'assembling');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [boot, setBoot] = useState(0);
  const [account, setAccount] = useState<Address | undefined>(preview?.account);
  const [wallets, setWallets] = useState<WalletChoice[]>([]);
  const [owned, setOwned] = useState<V2PublicLife[]>(preview?.lives || []), [nextCursor, setNextCursor] = useState<string>();
  const [days, setDays] = useState<{ day: number; rewardMicro?: string; alive?: boolean; level?: number }[]>(preview?.days || []), [before, setBefore] = useState<number>();
  const [name, setName] = useState(''), [stats, setStats] = useState([2, 2, 1]);
  const [payment, setPayment] = useState<'native' | 'purse' | 'wallet'>('native');
  const [kit, setKit] = useState<number[]>([0, 2, 13]), [category, setCategory] = useState(0);
  const [quote, setQuote] = useState<V2OwnerQuote>(), [job, setJob] = useState<V2OwnerJob | undefined>(preview?.job);
  const [pending, setPending] = useState<Pending | undefined>(preview?.pending);
  const [readingDay, setReadingDay] = useState<number>();
  const [walletBalance, setWalletBalance] = useState('0'), [allowance, setAllowance] = useState('0'), [copied, setCopied] = useState(false);
  const [walletIntent, setWalletIntent] = useState<Action>('connect');
  const wallet = useRef<Wallet | undefined>(undefined), activeProvider = useRef<Provider | undefined>(undefined), authenticated = useRef('');
  const pendingRef = useRef<Pending | undefined>(preview?.pending), operation = useRef<Action>('connect'), generation = useRef(0);
  const quoteRef = useRef<V2OwnerQuote | undefined>(undefined);
  const operationContext = useRef<{ tokenId?: string; requestId?: Hex; birthDraft?: BirthDraft }>({});
  const returnScreen = useRef<Screen>('home');
  const writeScreen = useRef<Screen>('home');
  const root = useRef<HTMLDivElement | null>(null);
  const sheetBody = useRef<HTMLDivElement | null>(null);
  const historyCache = useRef(new Map<string, { days: { day: number; rewardMicro?: string; alive?: boolean; level?: number }[]; before?: number; scroll: number; selected?: number }>());
  const historyKey = life ? `${life.chainId}:${life.collection.toLowerCase()}:${life.id}` : '';
  const currentWorld = !!life && !!config && life.chainId === config.chainId && same(life.collection, config.collection);
  const owner = currentWorld && same(life?.owner, account), historical = !!life && readingDay !== undefined && readingDay < life.state.day;
  const world = life ? { chainId: life.chainId, collection: life.collection } : config;
  const pendingKey = (who = account) => config && who ? `nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${who.toLowerCase()}` : undefined;
  function remember(p?: Pending) { const k = pendingKey(p?.intent?.account || pendingRef.current?.intent?.account || wallet.current?.account || account); pendingRef.current = p; setPending(p); if (k) p ? storage.set(k, p) : storage.remove(k); }
  function restoreBirth(draft?: BirthDraft) { if (!draft || typeof draft.name !== 'string' || draft.name.length > 8 || !['native', 'purse', 'wallet'].includes(draft.payment) || !Array.isArray(draft.stats) || draft.stats.length !== 3 || draft.stats.some(n => !Number.isInteger(n) || n < 0 || n > 5) || draft.stats.reduce((a, b) => a + b, 0) !== 5) return; setName(draft.name); setStats([...draft.stats]); setPayment(draft.payment); }
  function go(next: Screen) { setMessage(''); setErrorCode(''); setScreen(next); }
  function overlay(next: Screen) { returnScreen.current = screen === 'home' ? 'home' : screen; go(next); }
  function close() { go(returnScreen.current === 'wallet' ? 'home' : returnScreen.current); }
  useLayoutEffect(() => { if (screen === 'history' && sheetBody.current) sheetBody.current.scrollTop = historyCache.current.get(historyKey)?.scroll || 0; }, [screen, days, historyKey]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const fit = () => { if (!root.current) return; root.current.style.setProperty('--v2-visible-height', `${viewport?.height || window.innerHeight}px`); root.current.style.setProperty('--v2-visible-top', `${viewport?.offsetTop || 0}px`); };
    viewport?.addEventListener('resize', fit); viewport?.addEventListener('scroll', fit); window.addEventListener('resize', fit); fit();
    return () => { viewport?.removeEventListener('resize', fit); viewport?.removeEventListener('scroll', fit); window.removeEventListener('resize', fit); };
  }, []);
  async function loadLife(id: string, targetWorld = world, day?: number, show: Screen = 'home') {
    const g = ++generation.current; setBusy(true); setMessage('');
    try {
      let loaded: V2PublicLife, film: V2FilmPacket | undefined;
      try { const result = await v2Api.replay(id, day, targetWorld); loaded = result.life; film = filmPacket(result.packet); }
      catch (e) { if (day || !(e instanceof V2ApiError) || !['not_found', 'replay_unavailable'].includes(e.code)) throw e; loaded = (await v2Api.life(id, targetWorld)).life; }
      if (g !== generation.current) return;
      setLife(loaded); setPacket(film); setReadingDay(day); setQuote(undefined); setScreen(show);
      setJob(current => current?.tokenId === loaded.id && config?.chainId === loaded.chainId && same(config.collection, loaded.collection) && (show === 'pending' || loaded.pendingRequest === current.requestId) ? current : undefined);
      if (account) storage.set(`nh:v2:selected:${loaded.chainId}:${loaded.collection.toLowerCase()}:${account.toLowerCase()}`, loaded.id);
      const url = new URL(location.href); url.searchParams.set('rooster', loaded.id); url.searchParams.set('chainId', String(loaded.chainId)); url.searchParams.set('collection', loaded.collection); day ? url.searchParams.set('day', String(day)) : url.searchParams.delete('day'); history.replaceState(null, '', url.pathname + url.search);
    } catch (e) { setMessage(errorText(e)); } finally { if (g === generation.current) setBusy(false); }
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
      try { const guest = await v2Api.guest(); if (active && generation.current === 0) { setLife(guest.life); setPacket(filmPacket(guest.packet)); setScreen(current => current === 'welcome' ? 'home' : current); } } catch { /* A real new life can be hatched without a demonstration film. */ }
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
    const provider = activeProvider.current, reset = () => { wallet.current = undefined; authenticated.current = ''; setV2Session(''); setJob(undefined); setQuote(undefined); setAccount(undefined); setOwned([]); setWalletBalance('0'); if (pendingRef.current) setScreen('pending'); };
    provider.on?.('accountsChanged', reset); provider.on?.('chainChanged', reset);
    return () => { provider.removeListener?.('accountsChanged', reset); provider.removeListener?.('chainChanged', reset); };
  }, [account]);
  async function signIn(w: Wallet) {
    if (authenticated.current === w.account.toLowerCase()) return;
    const challenge = await api.challenge(w.account), signature = await w.signMessage(challenge.message);
    const s = await api.authenticate(w.account, challenge.id, signature); setV2Session(s.token); authenticated.current = w.account.toLowerCase();
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
    if (!config) return; setBusy(true); setMessage('');
    try {
      const w = await connectV2Wallet(choice.provider, config, intent => { const next = { kind: operation.current, ...operationContext.current, intent } satisfies Pending; pendingRef.current = next; setPending(next); const key = `nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${intent.account.toLowerCase()}`; storage.set(key, next); });
      wallet.current = w; activeProvider.current = choice.provider; setAccount(w.account);
      if (pendingRef.current?.intent && !same(pendingRef.current.intent.account, w.account)) throw Error(`Reconnect ${pendingRef.current.intent.account.slice(0, 6)}…${pendingRef.current.intent.account.slice(-4)} to finish this payment.`);
      setWalletBalance((await w.tokenBalance()).toString()); setAllowance((await w.tokenAllowance()).toString());
      const unfinished = storage.get<Pending>(`nh:v2:submitted:${config.chainId}:${config.collection.toLowerCase()}:${w.account.toLowerCase()}`);
      if (unfinished && action !== 'resume') {
        remember(unfinished); restoreBirth(unfinished.birthDraft);
        const accepted = (action === 'withdraw' || action === 'expire') ? await retireAcceptedDayJournal(unfinished, w.account) : undefined;
        if (!accepted) { setScreen('pending'); return; }
      }
      if (action === 'connect') { go('lives'); await listLives(w.account); } else await perform(action, w);
    } catch (e) { handleWriteError(e); } finally { setBusy(false); }
  }
  async function run(action: Action) {
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
    if (pendingRef.current?.intent && !same(pendingRef.current.intent.account, wallet.current?.account)) { wallet.current = undefined; authenticated.current = ''; setV2Session(''); }
    if (!wallet.current) { setWalletIntent(action); returnScreen.current = screen; setScreen('wallet'); if (wallets.length === 1) void attach(wallets[0]!, action); return; }
    setBusy(true); try { await perform(action, wallet.current); } catch (e) { handleWriteError(e); } finally { setBusy(false); }
  }
  function handleWriteError(e: unknown) {
    const code = (e as { code?: unknown })?.code;
    setErrorCode(typeof code === 'string' ? code : '');
    if (code === 'price') { wallet.current = undefined; void v2Api.config().then(setConfig).catch(() => {}); }
    if ([4001, 'ACTION_REJECTED', 'cancelled', 'replaced', 'reverted'].includes(code as never)) { remember(); setScreen(writeScreen.current); }
    else if (pendingRef.current) setScreen('pending');
    else if (wallet.current) setScreen(writeScreen.current);
    if (code === 'price') setScreen('hatch');
    setMessage(errorText(e));
  }
  async function perform(action: Action, w: Wallet) {
    operation.current = action;
    operationContext.current = { tokenId: life?.id, requestId: life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined), ...(action === 'mint' ? { birthDraft: { name, stats: [...stats], payment, sourceId: payment === 'purse' ? life?.id : undefined } } : {}) };
    if (action === 'connect') { go('lives'); await listLives(w.account); return; }
    if (action === 'resume') {
      if (pendingRef.current) { await checkPayment(w); return; }
      await signIn(w); const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined);
      if (!id) throw Error('Choose a day to open.');
      const next = await v2Api.wake(id); await showJob(next); return;
    }
    if (action === 'mint' || action === 'day' || action === 'approve') setJob(undefined);
    let hash: Hex;
    if (action === 'mint') {
      const clean = name.trim().toUpperCase(); if (!/^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(clean) || stats.reduce((a, b) => a + b, 0) !== 5) throw Error('Give this little life a name and five points.');
      if (payment === 'purse') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); hash = await w.birthFromPurse(life.id, life.purseNonce, clean, stats as [number, number, number]); }
      else if (payment === 'wallet') {
        if (await w.tokenBalance() < 250000000n) throw Error('Your wallet needs 250 NHC for this little life.');
        if (BigInt((await w.tokenAllowance()).toString()) < 250000000n) {
          operation.current = 'approve'; hash = await w.approveBirthTokens(); remember({ ...pendingRef.current, kind: 'approve', hash }); setScreen('pending'); await checkPayment(w); return;
        }
        hash = await w.birthFromWallet(clean, stats as [number, number, number]);
      }
      else hash = await w.mint(clean, stats as [number, number, number]);
    } else if (action === 'day') {
      if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your life in this world.');
      await signIn(w);
      const q = await v2Api.quote(life.id, kitMask(kit.map(i => ITEMS[i]!)).toString(), true); setQuote(q); operationContext.current.requestId = q.admission.id;
      hash = await w.accept(q);
      remember({ ...pendingRef.current, kind: 'day', tokenId: life.id, requestId: q.admission.id, hash });
      setScreen('pending'); await checkPayment(w); return;
    } else if (action === 'withdraw') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); hash = await w.withdraw(life.id, life.purseMicro); }
    else { const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined); if (!currentWorld || !id) throw Error('No day needs releasing.'); hash = await w.expire(id); }
    remember({ ...pendingRef.current, kind: action, tokenId: life?.id, hash }); setScreen('pending'); await checkPayment(w);
  }
  async function checkPayment(w = wallet.current) {
    if (!config || !pendingRef.current) return;
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
      if (p.kind === 'mint') {
        const id = mintedId(receipt, config, p.intent?.account || w?.account || account); if (id === undefined) throw Error('Checking the new life. Try again shortly.');
        remember(); setName(''); setPayment('native'); await loadLife(id.toString(), config); return;
      }
      if (p.kind === 'day') {
        if (!w) { setMessage('Connect your wallet to finish opening this day.'); return; }
        await signIn(w); const j = await v2Api.accept(receipt.transactionHash, p.requestId!); remember(); await showJob(j); return;
      }
      if (p.kind === 'approve') { restoreBirth(p.birthDraft); remember(); setAllowance('250000000'); setScreen('hatch'); return; }
      remember(); if (p.tokenId) await loadLife(p.tokenId, config); setScreen(p.kind === 'withdraw' ? 'purse' : 'home');
    } catch (e) { handleWriteError(e); } finally { setBusy(false); }
  }
  useEffect(() => {
    if (screen !== 'pending' || !job || ['failed', 'expired', 'ready'].includes(job.phase)) return;
    let active = true; const timer = setInterval(() => { void v2Api.job(job.requestId).then(async next => { if (!active) return; adoptJob(next); if (next.phase === 'ready') { remember(); await loadLife(next.tokenId, config); } }).catch(e => { if (active) setMessage(errorText(e)); }); }, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [screen, job?.requestId, job?.phase, config]);
  function adoptJob(next: V2OwnerJob) { setJob(next); if (next.retrySafe) setLife(current => current?.id === next.tokenId ? { ...current, pendingRequest: undefined } : current); }
  async function showJob(next: V2OwnerJob) { adoptJob(next); await loadLife(next.tokenId, config, undefined, next.phase === 'ready' ? 'home' : 'pending'); }
  function retryDay() { const target = job?.tokenId || pendingRef.current?.tokenId || pending?.tokenId; if (!target) { setMessage('Choose the original life to try again.'); return; } remember(); setJob(undefined); void loadLife(target, config, undefined, 'care'); }
  async function listLives(who = account, cursor?: string) { if (!who) { await run('connect'); return; } setBusy(true); try { if (preview?.lives) { setOwned(preview.lives); return; } const page = await v2Api.lives(who, cursor); setOwned(cursor ? [...owned, ...page.lives] : page.lives); setNextCursor(page.nextCursor); } catch (e) { setMessage(errorText(e)); } finally { setBusy(false); } }
  async function showHistory(older?: number) {
    if (!life) return; overlay('history');
    const cached = historyCache.current.get(historyKey);
    if (!older && cached) { setDays(cached.days); setBefore(cached.before); return; }
    setBusy(true);
    try {
      const page = preview?.days ? { days: preview.days, nextBefore: undefined } : await v2Api.days(life.id, older, world);
      const combined = older ? [...days, ...page.days] : page.days;
      setDays(combined); setBefore(page.nextBefore); historyCache.current.set(historyKey, { days: combined, before: page.nextBefore, scroll: cached?.scroll || 0, selected: cached?.selected });
    } catch (e) { setMessage(errorText(e)); } finally { setBusy(false); }
  }
  function hatch(source: 'native' | 'purse' | 'wallet' = 'native') { setPayment(source); overlay('hatch'); }
  function choose(index: number) { setQuote(undefined); setKit(current => { if (current.includes(index)) return current.filter(i => i !== index); if (index >= 13 && current.some(i => i >= 13)) return current.map(i => i >= 13 ? index : i); return current.length < 3 ? [...current, index] : current; }); }
  async function prepare() { if (!life) return; if (life.pendingRequest) { await run('resume'); return; } setReadingDay(undefined); overlay('care'); setQuote(undefined); }
  async function share() { if (!life) return; const url = new URL(location.origin + '/'); url.search = new URLSearchParams({ rooster: life.id, chainId: String(life.chainId), collection: life.collection }).toString(); try { await navigator.clipboard.writeText(url.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setMessage('Copy this page address to share this life.'); } }
  const stageLife = life, stagePacket = packet;
  const nameValid = /^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(name.trim().toUpperCase());
  const sum = stats.reduce((a, b) => a + b, 0), purse = BigInt(life?.purseMicro || '0');
  const overlayOpen = screen !== 'home';
  const pendingDayJob = !pending || pending.kind === 'day' && pending.requestId === job?.requestId ? job : undefined;
  const title: Record<Exclude<Screen, 'home'>, string> = { welcome: 'A little life of its own.', profile: life?.state.alive === false ? `${life.name} · remembered` : life?.name || 'A little life', hatch: 'A new little life', care: "Tomorrow's post", pending: pendingDayJob?.retrySafe ? 'Another little try' : 'A little day is taking shape', purse: `${life?.name || 'A little life'}’s purse`, history: 'A life in little days', lives: 'Your little lives', menu: 'Home', wallet: 'Choose your wallet', stock: 'Belongings' };
  let body: ReactNode;
  if (screen === 'welcome') body = <><div className="v2-egg"><img src={itemImage(38)} alt=""/></div><p>Raise a rooster with a mind of its own.</p><button className="v2-primary" disabled={busy || (!config && !message)} onClick={() => exactId && malformedWorld ? location.assign(location.pathname + '?v2=1') : message && !config ? (setMessage(''), setBoot(v => v + 1)) : hatch()}>{exactId && malformedWorld ? 'Back home' : message && !config ? 'Try again' : 'Hatch a life'}</button>{account ? <button className="v2-text-button" onClick={() => { go('lives'); void listLives(); }}>Your lives</button> : <button className="v2-text-button" disabled={!config} onClick={() => void run('connect')}>I already have one</button>}</>;
  else if (screen === 'profile' && life) body = <><div className="v2-life-portrait"><img className="v2-dynamic-portrait" src={`/api/v2/nft/${life.id}/image.svg?${new URLSearchParams({ chainId: String(life.chainId), collection: life.collection })}`} alt={`${life.name} and their saved home`}/></div><div className="v2-life-facts"><span>DAY {life.state.day}</span><span>LV{String(life.state.level).padStart(2, '0')}</span><span><Icon name="wallet" size={13}/>{coins(life.purseMicro)} NHC</span></div><button className="v2-primary" onClick={() => go('home')}><Icon name="house" size={15}/>Visit home</button><div className="v2-secondary-row"><button onClick={() => void showHistory()}><Icon name="book" size={16}/>Days</button><button onClick={() => void share()}><Icon name="mail" size={16}/>{copied ? 'Copied' : 'Share'}</button>{owner && <button onClick={() => overlay('purse')}><Icon name="wallet" size={16}/>Purse</button>}</div>{!owner && <button className="v2-text-button" onClick={() => hatch()}>Hatch your own</button>}</>;
  else if (screen === 'hatch') body = <><div className="v2-egg small"><img src={itemImage(38)} alt=""/></div><label className="v2-name-field"><span>A name</span><input value={name} disabled={busy} maxLength={8} placeholder="BOK" autoComplete="off" autoCapitalize="characters" onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}/></label><div className="v2-stat-picker">{(['Body', 'Wits', 'Spirit'] as const).map((label, i) => <div key={label}><span>{label}</span><button aria-label={`Less ${label.toLowerCase()}`} disabled={stats[i] === 0 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n - 1 : n))}>−</button><b>{stats[i]}</b><button aria-label={`More ${label.toLowerCase()}`} disabled={sum >= 5 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n + 1 : n))}>+</button></div>)}</div>{sum < 5 && <p className="v2-small-note">{5 - sum} {5 - sum === 1 ? 'point' : 'points'} to place</p>}<div className="v2-payment"><button aria-pressed={payment === 'native'} onClick={() => setPayment('native')}>{config ? eth(config.nativeMintPrice) + ' ETH' : 'ETH'}</button><button aria-pressed={payment !== 'native'} onClick={() => setPayment(owner && purse >= 250000000n ? 'purse' : 'wallet')}>250 NHC</button></div>{payment !== 'native' && <p className="v2-small-note">{payment === 'purse' ? `From ${life?.name}’s purse` : 'From your wallet'}{owner && purse >= 250000000n && <button className="v2-inline-button" onClick={() => setPayment(payment === 'wallet' ? 'purse' : 'wallet')}>Change</button>}</p>}<button className="v2-primary" disabled={!config || busy || !nameValid || sum !== 5} onClick={() => void run('mint')}><Icon name="leaf" size={15}/>{busy ? 'Opening a little life…' : payment === 'wallet' && BigInt(allowance) < 250000000n ? 'Approve 250 NHC' : 'Hatch this life'}</button><span className="v2-fee-note">{payment === 'native' && config ? `${eth(config.nativeMintPrice)} test ETH · ` : ''}network fee applies</span></>;
  else if (screen === 'care' && life) { const choices = category === 0 ? [0, 2, 1, 4, 5, 3] : category === 1 ? [13, 14, 15, 16, 17, 18, 19, 20, 21] : [7, 8, 9, 10, 11, 12]; body = <><div className="v2-post-tray">{[0, 1, 2].map(i => <button key={i} aria-label={kit[i] === undefined ? `Empty parcel slot ${i + 1}` : `Remove ${itemName(kit[i]!)}`} disabled={kit[i] === undefined} onClick={() => choose(kit[i]!)}>{kit[i] === undefined ? <Icon name="leaf" size={18}/> : <><img src={itemImage(kit[i]!)} alt=""/><i>×1</i></>}</button>)}</div><div className="v2-supply-tabs">{(['Care', 'Seeds', 'House'] as const).map((label, i) => <button key={label} aria-pressed={category === i} onClick={() => setCategory(i)}>{label}</button>)}</div><div className="v2-supplies">{choices.map(i => <button key={i} className={kit.includes(i) ? 'selected' : ''} aria-pressed={kit.includes(i)} disabled={!kit.includes(i) && kit.length >= 3 && !(i >= 13 && kit.some(k => k >= 13))} onClick={() => choose(i)}><img src={itemImage(i)} alt=""/><span>{i >= 13 ? PLANTS[i - 12]?.name : itemName(i)}</span><small>{i >= 13 ? `${PLANTS[i - 12]?.ticks} days` : life.state.inventory[i] ? `At home ×${life.state.inventory[i]}` : '×1'}</small></button>)}</div><button className="v2-primary" disabled={busy} onClick={() => void run('day')}><Icon name="mail" size={15}/>{busy ? 'Checking the post…' : 'Prepare day ' + (life.state.day + 1)}</button><span className="v2-fee-note">{quote ? `Est. ${eth(quote.totalEstimate)} test ETH` : 'Supplies included · network + preparation fee'}</span></>; }
  else if (screen === 'pending') body = <><div className={'v2-mail-working' + (pendingDayJob?.retrySafe ? ' is-still' : '')}><Icon name="mail" size={44}/>{!pendingDayJob?.retrySafe && <><i/><i/><i/></>}</div><p>{pendingDayJob?.retrySafe ? 'Your saved day is safe.' : pending?.kind === 'withdraw' ? 'Sending your tokens home.' : pending?.kind === 'mint' ? 'A new little life is on its way.' : pendingDayJob?.phase === 'saving' || pendingDayJob?.phase === 'prepared' ? 'Putting the day safely away.' : 'A few plans. A little thought.'}</p>{pendingDayJob && !pendingDayJob.retrySafe && !['ready', 'quarantined'].includes(pendingDayJob.phase) && <div className="v2-day-progress"><i style={{ width: `${Math.max(8, Math.min(90, pendingDayJob.decisions * 10))}%` }}/></div>}{pendingDayJob?.retrySafe ? <button className="v2-primary" onClick={retryDay}>Try another day</button> : <button className="v2-primary" disabled={busy} onClick={() => void (pending?.intent && !same(pending.intent.account, wallet.current?.account) ? run('resume') : !wallet.current && pending?.kind === 'day' ? run('resume') : pendingDayJob ? v2Api.wake(pendingDayJob.requestId).then(async next => { adoptJob(next); if (next.phase === 'ready') { remember(); await loadLife(next.tokenId, config); } }).catch(e => setMessage(errorText(e))) : checkPayment())}>{busy ? 'Checking…' : pending?.intent && !same(pending.intent.account, wallet.current?.account) ? 'Reconnect wallet' : !wallet.current && pending?.kind === 'day' ? 'Connect wallet' : pendingDayJob ? 'Check day' : 'Check payment'}</button>}{pendingDayJob?.phase === 'quarantined' && <button className="v2-text-button" onClick={() => void run('expire')}>Release expired attempt</button>}</>;
  else if (screen === 'purse' && life) body = <><div className="v2-purse-total"><Icon name="wallet" size={34}/><strong>{coins(life.purseMicro)}</strong><span>NHC</span></div>{!life.state.alive && <p className="v2-small-note">Still yours to take home.</p>}{owner && purse === 0n ? <><p className="v2-small-note">Flowers, fruit and crafts can fill this purse.</p><button className="v2-primary" onClick={() => life.state.alive ? go('home') : hatch() }>{life.state.alive ? 'Back home' : 'Hatch another'}</button></> : owner ? <><button className="v2-primary" disabled={busy || purse === 0n} onClick={() => void run('withdraw')}>Withdraw to wallet</button><button className="v2-text-button" disabled={purse < 250000000n} onClick={() => hatch('purse')}>Hatch another · 250 NHC</button></> : <button className="v2-primary" onClick={() => go('home')}>Visit home</button>}</>;
  else if (screen === 'history') body = <><div className="v2-history-list">{days.map(d => <button key={d.day} aria-current={historyCache.current.get(historyKey)?.selected === d.day ? 'true' : undefined} onClick={() => { const cached = historyCache.current.get(historyKey); if (cached) cached.selected = d.day; if (life) void loadLife(life.id, world, d.day); }}><span>DAY {String(d.day).padStart(2, '0')}</span><small>{d.rewardMicro && BigInt(d.rewardMicro) > 0n ? `+${coins(d.rewardMicro)} NHC` : 'A little day'}</small><Icon name="play" size={13}/></button>)}</div>{!days.length && <p>So many little days ahead.</p>}{before && <button className="v2-text-button" onClick={() => void showHistory(before)}>Earlier days</button>}{life && <button className="v2-primary" onClick={() => void loadLife(life.id, world)}>Latest home</button>}</>;
  else if (screen === 'lives') body = <><div className="v2-owned-lives">{owned.map(l => <button key={l.id} onClick={() => void loadLife(l.id, l)}><img src={roosterImage(l.state.seed)} alt=""/><span>{l.name}<small>DAY {l.state.day} · {l.state.alive ? `LV${l.state.level}` : 'Remembered'}</small></span><Icon name="play" size={14}/></button>)}</div>{!owned.length && <p>A little home is waiting for someone.</p>}{nextCursor && <button className="v2-text-button" onClick={() => void listLives(account, nextCursor)}>More lives</button>}<button className="v2-primary" onClick={() => hatch()}>Hatch a life</button></>;
  else if (screen === 'stock' && life) { const state = historical && packet ? packet.result.state : life.state; body = <><div className="v2-belongings">{state.inventory.flatMap((n, i) => n > 0 ? [<div key={i}><img src={itemImage(i)} alt=""/><span>{itemName(i)}</span><b>×{n.toLocaleString()}</b></div>] : [])}</div>{!state.inventory.some(n => n > 0) && <p>A little room for future things.</p>}</>; }
  else if (screen === 'wallet') body = <><Icon name="wallet" size={38}/>{wallets.length ? <div className="v2-wallet-choices">{wallets.map(w => <button className="v2-primary" disabled={busy} key={w.id} onClick={() => void attach(w, walletIntent)}>{busy ? 'Opening wallet…' : w.name}</button>)}</div> : <><p>Open this game in your wallet’s browser to bring a life home.</p><a className="v2-primary" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Get a wallet</a></>}</>;
  else body = <div className="v2-menu-list">{life && <button onClick={() => go('profile')}><Icon name="house"/>{life.name}</button>}{life && <button onClick={() => void showHistory()}><Icon name="book"/>Days</button>}{life && <button onClick={() => overlay('stock')}><Icon name="book"/>Belongings</button>}{life && <button onClick={() => overlay('purse')}><Icon name="wallet"/>Purse</button>}<button onClick={() => { go('lives'); void listLives(); }}><Icon name="leaf"/>Your lives</button>{life && <button onClick={() => void share()}><Icon name="mail"/>{copied ? 'Link copied' : 'Share this life'}</button>}<button onClick={() => hatch()}><Icon name="leaf"/>Hatch a life</button></div>;

  return <div ref={root} className={`v2-journey${opening !== 'closed' ? ' is-booting' : ''}`}>
    {stageLife || stagePacket ? <V2Player key={`${stageLife?.collection}:${stageLife?.id}:${stagePacket?.requestId || stageLife?.revision}`} packet={stagePacket} life={stageLife} suspended={overlayOpen || opening !== 'closed'} opening={opening} onMenu={() => overlay('menu')} onProfile={() => overlay('profile')} onExit={() => historical ? void showHistory() : overlay('menu')} onPrepare={owner && !historical ? prepare : undefined} prepareLabel={life?.pendingRequest ? 'Open day ' + (life.state.day + 1) : life?.state.day === 0 ? 'Prepare day 1' : undefined} onHatch={!owner ? () => hatch() : !life?.state.alive ? () => hatch(purse >= 250000000n ? 'purse' : 'native') : undefined} onPurse={owner ? () => overlay('purse') : undefined} onLatest={historical && life ? () => void loadLife(life.id, world) : undefined}/> : <TitleScenery opening={opening}/>}
    {overlayOpen && <div className={`v2-sheet-backdrop v2-sheet-${screen}`}><section className="v2-sheet v2-pixel-frame" role="dialog" aria-modal="true" aria-label={title[screen]}><header><h1>{title[screen]}</h1>{screen !== 'welcome' && <button className="v2-icon-button" onClick={() => screen === 'pending' ? go(life ? 'home' : 'welcome') : close()} aria-label="Close"><Icon name="close" size={14}/></button>}</header><div className="v2-sheet-body" ref={sheetBody} onScroll={event => { if (screen === 'history') { const cached = historyCache.current.get(historyKey); if (cached) cached.scroll = event.currentTarget.scrollTop; } }}>{body}{message && <><p className="v2-inline-error" role="alert">{message}</p>{errorCode === 'funds' && <a className="v2-text-button" href="https://faucet.testnet.chain.robinhood.com/" target="_blank" rel="noreferrer">Get test ETH</a>}</>}</div></section></div>}
    {screen === 'home' && message && <button className="v2-toast" onClick={() => overlay('profile')}>{message}</button>}
    {opening !== 'closed' && <CartridgeOpening phase={opening} onStart={startOpening}/>}
  </div>;
}
