import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { formatUnits, type EIP1193Provider, type Hex } from 'viem';
import { connectGameWallet, createGameReader, mintedGameId, resolveGameSubmission, intentWorld, type GameSubmissionIntent, type GameReceipt, type GameWallet } from '../../chain/game-wallet';
import { nearWalletChoices, onNearWalletChange, type NearWalletChoice } from '../../chain/near-connector';
import { isNearIntent } from '../../chain/near-client';
import { NearWalletError } from '../../chain/near-rpc';
import { gameExplorerToken, gameExplorerTransaction, gameLifeUrl, gameImageUrl, worldKey, sameWorld, sameAccount, gameNetwork, parseGameWorld, worldParams } from '../../chain/game-world';
import { isNearWorld, type GamePublicConfig as V2PublicConfig, type GamePublicLife as V2PublicLife, type GameOwnerJob as V2OwnerJob, type GameOwnerQuote as V2OwnerQuote, type GameWorld as V2World } from '../../chain/game-types';
import { formatNativeBalance, type GameNetwork } from '../../chain/networks';
import { V2ApiError } from '../v2-api';
import { apiFor, gameWorlds, cacheGameSession as cacheV2Session, restoreGameSession as restoreV2Session, setGameSession } from '../game-api';
import { Icon } from '../Icons';
import { CartridgeOpening, type CartridgePhase } from '../CartridgeOpening';
import { roosterCanvas } from '../../art/rooster';
import { itemArt } from '../../game/v2/art';
import { ITEMS, PLANTS, kitMask, createState } from '../../v2';
import { createV2WorldRenderer } from '../../game/v2';
import { endingNote, filmPacket, itemName, type V2FilmPacket } from '../../v2/presentation';
import V2Player from './V2Player';
import { LifeSoundButton, LifeSoundToggle } from './LifeSound';
import { BirthReveal, ThoughtActivity, DayFlow, ProcessGraphic } from './JourneyVisuals';
import { NetworkMark, NetworkPicker } from './NetworkPicker';
import '../v2Journey.css';

type Provider = EIP1193Provider & { on?: (name: string, listener: (...a: any[]) => void) => void; removeListener?: (name: string, listener: (...a: any[]) => void) => void };
type Wallet = GameWallet;
type Screen = 'home' | 'welcome' | 'profile' | 'hatch' | 'birth' | 'care' | 'review' | 'pending' | 'purse' | 'history' | 'lives' | 'menu' | 'wallet' | 'stock' | 'networks';
type Action = 'mint' | 'day' | 'verify' | 'withdraw' | 'connect' | 'hatch-connect' | 'expire' | 'resume' | 'approve';
type Parcel = [number | undefined, number | undefined, number | undefined];
interface BirthDraft { name: string; stats: number[]; payment: 'native' | 'purse' | 'wallet'; sourceId?: string }
interface WalletOpening { phase: 'signin' | 'transaction'; open(): void; cancel(): void }
interface Pending { kind: Action; hash?: string; requestId?: Hex; tokenId?: string; intent?: GameSubmissionIntent; cursor?: string; birthDraft?: BirthDraft; uncertain?: boolean }
type WalletChoice = { kind: 'evm'; id: string; name: string; provider: Provider } | NearWalletChoice;
interface Preview { config: V2PublicConfig; worlds?: V2PublicConfig[]; life?: V2PublicLife; packet?: unknown; account?: string; lives?: V2PublicLife[]; days?: { day: number; rewardMicro?: string }[]; pending?: Pending; job?: V2OwnerJob; screen?: Screen; kit?: number[]; birth?: { id: string; hash?: string }; guideDone?: boolean }
declare global { interface Window { __NH_V2_JOURNEY_PREVIEW?: Preview } }
const same = sameAccount;
const artCache = new Map<string, string>();
function itemImage(index: number) { const key = 'item:' + index; if (!artCache.has(key)) artCache.set(key, itemArt(index).toDataURL()); return artCache.get(key)!; }
function roosterImage(seed: string) { if (!artCache.has(seed)) artCache.set(seed, roosterCanvas(seed, 'idle').toDataURL()); return artCache.get(seed)!; }
const coins = (value: string) => {
  const amount = BigInt(value), units = amount < 0n ? -amount : amount;
  const fraction = (units % 1000000n).toString().padStart(6, '0').replace(/0+$/, '');
  const decimal = new Intl.NumberFormat().formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  return `${amount < 0n ? '−' : ''}${(units / 1000000n).toLocaleString()}${fraction ? decimal + fraction : ''}`;
};
const amount = (value: string, decimals: number) => { const n = Number(formatUnits(BigInt(value), decimals)); return n < .000001 && n > 0 ? '< 0.000001' : n.toLocaleString(undefined, { maximumFractionDigits: 6 }); };
function errorText(e: unknown) { const code = (e as { code?: unknown })?.code; if (code === 4001 || code === 'ACTION_REJECTED' || /rejected|denied/i.test(e instanceof Error ? e.message : '')) return 'No problem. Nothing was sent.'; return e instanceof Error && e.message.length < 180 ? e.message : 'That did not go through. Try again.'; }
const storage = { get<T>(k: string): T | undefined { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? undefined; } catch { return; } }, set(k: string, value: unknown) { try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* In-memory continuation remains usable. */ } }, remove(k: string) { try { localStorage.removeItem(k); } catch { /* No browser ledger reset. */ } } };
function openingSeen() { try { return !!sessionStorage.getItem('nh:v2:opening'); } catch { return false; } }

interface JourneySnapshot {
  world: V2World; name: string; stats: number[]; payment: 'native' | 'purse' | 'wallet';
  account?: string; wallet?: Wallet; provider?: Provider; lifeId?: string; day?: number; jobRequestId?: Hex;
  screen: Screen; backStack: Screen[]; returnScreen: Screen; walletIntent: Action;
  kit: Parcel; category: number; parcelSlot: number; scroll: [string, number][]; moreWallets?: boolean;
}
const journeyMemory = new Map<string, JourneySnapshot>();
const walletConfigKey = (config: V2PublicConfig) => [worldKey(config), config.rpcUrl, config.rulesHash, config.decisionConfig, config.token, config.nativeMintPrice, config.multiplier,
  isNearWorld(config) ? [config.codeHash, config.storageDeposit, config.maxProcessingFee, config.quoteSigner, config.relayer].join(':') : [config.controllerCodeHash, config.verifierCodeHash, config.actionModuleCodeHash, config.quoteSigner, config.relayer].join(':')].join('|');
function saveJourneySnapshot(snapshot: JourneySnapshot) {
  const key = worldKey(snapshot.world); journeyMemory.set(key, snapshot);
  const { wallet: _wallet, provider: _provider, ...publicDraft } = snapshot;
  storage.set(`nh:v2:ui:${key}`, publicDraft);
}
function readJourneySnapshot(world?: V2World): JourneySnapshot | undefined {
  if (!world) return;
  const key = worldKey(world), memory = journeyMemory.get(key); if (memory) return memory;
  const saved = storage.get<JourneySnapshot>(`nh:v2:ui:${key}`);
  let restoredWorld: V2World | undefined;
  try { if (saved?.world) restoredWorld = parseGameWorld(worldParams(saved.world)); } catch { /* Ignore an incomplete UI draft, never a financial journal. */ }
  if (!saved || !sameWorld(restoredWorld, world) || !/^[A-Z0-9 ]{0,8}$/.test(saved.name) || !Array.isArray(saved.stats) || saved.stats.length !== 3
    || saved.stats.some(v => !Number.isInteger(v) || v < 0 || v > 5) || saved.stats.reduce((a, b) => a + b, 0) > 5
    || !['native', 'purse', 'wallet'].includes(saved.payment) || !Array.isArray(saved.kit) || saved.kit.length !== 3) return;
  const screens: Screen[] = ['home', 'welcome', 'profile', 'hatch', 'care', 'review', 'purse', 'history', 'lives', 'menu', 'wallet', 'stock'];
  if (!screens.includes(saved.screen) || !Array.isArray(saved.backStack) || saved.backStack.some(s => !screens.includes(s))) return;
  saved.kit = saved.kit.map(v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 21 ? v : undefined) as Parcel;
  saved.scroll = Array.isArray(saved.scroll) ? saved.scroll.filter(v => Array.isArray(v) && typeof v[0] === 'string' && Number.isFinite(v[1]) && v[1] >= 0).slice(0, 40) : [];
  saved.wallet = undefined; saved.provider = undefined;
  return saved;
}

export default function V2Journey() {
  const preview = import.meta.env.DEV ? window.__NH_V2_JOURNEY_PREVIEW : undefined;
  const [selectedWorld, setSelectedWorld] = useState<V2World | undefined>(() => {
    if (preview) return preview.config;
    const query = new URLSearchParams(location.search);
    if (query.has('collection') || query.has('chainId') || query.has('networkId')) return parseGameWorld(query);
    const saved = storage.get<V2World>('nh:v2:world');
    if (!saved) return;
    try { return parseGameWorld(worldParams(saved)); } catch { return; }
  });
  const [availableWorlds, setAvailableWorlds] = useState<V2PublicConfig[]>(preview?.worlds || (preview ? [preview.config] : []));
  const [discovery, setDiscovery] = useState<'loading' | 'ready' | 'failed'>(preview ? 'ready' : 'loading'), [discoveryAttempt, setDiscoveryAttempt] = useState(0);
  useEffect(() => {
    if (preview) return;
    let active = true;
    setDiscovery('loading');
    void gameWorlds().then(directory => { if (active) { setAvailableWorlds(directory.worlds); setDiscovery('ready'); } }).catch(() => { if (active) setDiscovery('failed'); });
    return () => { active = false; };
  }, [discoveryAttempt]);
  function switchWorld(target: V2PublicConfig, snapshot: JourneySnapshot) {
    saveJourneySnapshot(snapshot);
    const next = isNearWorld(target) ? { networkId: 'near-testnet' as const, collection: target.collection } : { chainId: target.chainId, collection: target.collection };
    const previous = readJourneySnapshot(next), creating = snapshot.screen === 'hatch' || snapshot.screen === 'wallet' && snapshot.walletIntent === 'hatch-connect';
    if (!previous) saveJourneySnapshot({ world: next, name: creating ? snapshot.name : 'PIP', stats: creating ? [...snapshot.stats] : [2, 2, 1], payment: 'native', screen: 'hatch', backStack: ['welcome'], returnScreen: 'welcome', walletIntent: 'hatch-connect', kit: [undefined, undefined, undefined], category: 0, parcelSlot: 0, scroll: [] });
    else if (creating) saveJourneySnapshot({ ...previous, name: snapshot.name, stats: [...snapshot.stats], payment: 'native', screen: 'hatch', backStack: [previous.screen === 'hatch' ? 'welcome' : previous.screen], returnScreen: previous.screen === 'hatch' ? 'welcome' : previous.screen, walletIntent: 'hatch-connect' });
    // The token number belongs to its world. Never carry it across a switch.
    const url = new URL(location.href); url.search = worldParams(next).toString(); history.replaceState(null, '', url.pathname + url.search);
    storage.set('nh:v2:world', next); setSelectedWorld(next);
  }
  return <JourneyWorld key={selectedWorld ? worldKey(selectedWorld) : 'initial'} selectedWorld={selectedWorld} availableWorlds={availableWorlds} snapshot={readJourneySnapshot(selectedWorld)} onWorldSwitch={switchWorld} discovery={discovery} onRetryDiscovery={() => setDiscoveryAttempt(v => v + 1)}/>;
}

/** Title artwork only: no public NFT, earned film or economic outcome is invented. */
function TitleScenery({ opening }: { opening: CartridgePhase }) {
  const host = useRef<HTMLDivElement | null>(null), world = useRef<ReturnType<typeof createV2WorldRenderer> | undefined>(undefined);
  useEffect(() => { const view = createV2WorldRenderer(host.current!, { state: createState({ seed: 0x4e48 }) }); world.current = view; view.setInputEnabled(false); view.setOpening(opening); return () => { view.destroy(); world.current = undefined; }; }, []);
  useEffect(() => world.current?.setOpening(opening), [opening]);
  return <div ref={host} className="v2-title-scenery" aria-hidden="true"/>;
}

function JourneyWorld({ selectedWorld, availableWorlds, snapshot, onWorldSwitch, discovery, onRetryDiscovery }: { selectedWorld?: V2World; availableWorlds: V2PublicConfig[]; snapshot?: JourneySnapshot; onWorldSwitch(target: V2PublicConfig, snapshot: JourneySnapshot): void; discovery: 'loading' | 'ready' | 'failed'; onRetryDiscovery(): void }) {
  const offeredPreview = import.meta.env.DEV ? window.__NH_V2_JOURNEY_PREVIEW : undefined;
  const preview = offeredPreview && (!selectedWorld || sameWorld(offeredPreview.config, selectedWorld)) ? offeredPreview : undefined;
  const [query] = useState(() => new URLSearchParams(location.search));
  const exactId = query.get('rooster') || query.get('id');
  const hatchEntry = query.get('entry') === 'hatch' && !exactId;
  const initialWorld = parseGameWorld(query) || selectedWorld;
  const malformedWorld = (query.has('collection') || query.has('chainId') || query.has('networkId')) && !parseGameWorld(query);
  const [config, setConfig] = useState<V2PublicConfig | undefined>(preview?.config);
  const [life, setLife] = useState<V2PublicLife | undefined>(preview?.life);
  const [packet, setPacket] = useState<V2FilmPacket | undefined>(filmPacket(preview?.packet));
  const [screen, setScreen] = useState<Screen>(preview?.screen || (hatchEntry ? 'hatch' : snapshot?.screen) || (preview?.birth ? 'birth' : preview?.pending || preview?.job ? 'pending' : preview?.life ? exactId ? 'profile' : 'home' : 'welcome'));
  const [opening, setOpening] = useState<CartridgePhase>(() => exactId || hatchEntry || query.get('entry') === 'app' || preview || snapshot ? 'closed' : openingSeen() ? 'closed' : 'assembling');
  const [readBusy, setBusy] = useState(false), [walletBusy, setWalletBusy] = useState(false), [message, setMessage] = useState('');
  const busy = readBusy || walletBusy;
  const [errorCode, setErrorCode] = useState('');
  const [boot, setBoot] = useState(0);
  const [account, setAccount] = useState<string | undefined>(preview?.account || snapshot?.account);
  const [wallets, setWallets] = useState<WalletChoice[]>([]);
  const [moreWallets, setMoreWallets] = useState(snapshot?.moreWallets || false);
  const [owned, setOwned] = useState<V2PublicLife[]>(preview?.lives || []), [nextCursor, setNextCursor] = useState<string>();
  const [days, setDays] = useState<{ day: number; rewardMicro?: string; alive?: boolean; level?: number }[]>(preview?.days || []), [before, setBefore] = useState<number>();
  const [historyLoading, setHistoryLoading] = useState(false), [livesLoading, setLivesLoading] = useState(false), [canCloseDay, setCanCloseDay] = useState(false);
  const [name, setName] = useState(snapshot?.name || 'PIP'), [stats, setStats] = useState(snapshot?.stats || [2, 2, 1]);
  const [payment, setPayment] = useState<'native' | 'purse' | 'wallet'>(snapshot?.payment || 'native');
  const [kit, setKit] = useState<Parcel>(() => [preview?.kit?.[0] ?? snapshot?.kit?.[0], preview?.kit?.[1] ?? snapshot?.kit?.[1], preview?.kit?.[2] ?? snapshot?.kit?.[2]]), [category, setCategory] = useState(snapshot?.category || 0), [parcelSlot, setParcelSlot] = useState(snapshot?.parcelSlot || 0);
  const kitRef = useRef(kit); kitRef.current = kit;
  // Tab suggestions may move the target; a slot the player tapped stays theirs.
  const manualParcelTarget = useRef(false);
  const [guide, setGuide] = useState<number | undefined>(() => preview?.guideDone || storage.get<boolean>('nh:v2:packing-help') ? undefined : 0);
  const [birth, setBirth] = useState<{ id: string; hash?: string } | undefined>(preview?.birth);
  const [quote, setQuote] = useState<V2OwnerQuote>(), [job, setJob] = useState<V2OwnerJob | undefined>(preview?.job);
  const [pending, setPending] = useState<Pending | undefined>(preview?.pending);
  const [readingDay, setReadingDay] = useState<number>();
  const [walletBalance, setWalletBalance] = useState('0'), [allowance, setAllowance] = useState('0'), [copied, setCopied] = useState(false);
  const [nativeBalance, setNativeBalance] = useState<string | null>(), [verifiedAccount, setVerifiedAccount] = useState<string>();
  const nativeBalanceRead = useRef(0), nativeBalanceScope = useRef('');
  nativeBalanceScope.current = config && account ? `${worldKey(config)}:${account}` : '';
  const [walletPhase, setWalletPhase] = useState<'connect' | 'signin' | 'transaction' | 'checking' | 'wallet-ready'>();
  const [walletOpening, setWalletOpening] = useState<WalletOpening>(), walletOpeningRef = useRef<WalletOpening | undefined>(undefined);
  const [walletIntent, setWalletIntent] = useState<Action>(snapshot?.walletIntent || 'connect');
  const [example, setExample] = useState(false);
  const [freshDay, setFreshDay] = useState<Hex>();
  const [playRequest, setPlayRequest] = useState<string>();
  const wallet = useRef<Wallet | undefined>(undefined), activeProvider = useRef<Provider | undefined>(undefined), authenticated = useRef('');
  const pendingRef = useRef<Pending | undefined>(preview?.pending), operation = useRef<Action>('connect'), generation = useRef(0);
  const mounted = useRef(true);
  const walletOperation = useRef<symbol | undefined>(undefined);
  const quoteRef = useRef<V2OwnerQuote | undefined>(undefined);
  const operationContext = useRef<{ tokenId?: string; requestId?: Hex; birthDraft?: BirthDraft }>({});
  const returnScreen = useRef<Screen>(snapshot?.returnScreen || 'home');
  const backStack = useRef<Screen[]>(snapshot?.backStack || []);
  const writeScreen = useRef<Screen>('home');
  const root = useRef<HTMLDivElement | null>(null);
  const sheetBody = useRef<HTMLDivElement | null>(null);
  const sheetScroll = useRef(new Map<string, number>(snapshot?.scroll || [])), portfolioRead = useRef(0), pendingCheck = useRef(false), currentScreen = useRef(screen);
  currentScreen.current = screen;
  const historyCache = useRef(new Map<string, { days: { day: number; rewardMicro?: string; alive?: boolean; level?: number }[]; before?: number; scroll: number; selected?: number }>());
  const historyKey = life ? `${worldKey(life)}:${life.id}` : '';
  const currentWorld = sameWorld(life, config);
  const readyJob = currentWorld && job?.phase === 'ready' && job.tokenId === life?.id && job.requestId !== packet?.requestId ? job : undefined;
  const owner = currentWorld && same(life?.owner, account), historical = !!life && (readingDay ?? packet?.result.state.day ?? life.state.day) < life.state.day;
  const historyControls = readingDay !== undefined || historical && owner;
  const world = life || config || selectedWorld;
  const network = config || selectedWorld ? gameNetwork((config || selectedWorld)!) : undefined;
  const eth = (value: string) => amount(value, network?.nativeDecimals || 18);
  const v2Api = apiFor(config || selectedWorld);
  const setV2Session = (token: string) => { if (config || selectedWorld) setGameSession(token, (config || selectedWorld)!); };
  // A descriptive catalog entry alone is not a deployed game. Only the served,
  // validated runtime can be selected until an actual second-world adapter exists.
  const worldOptions = discovery === 'failed' ? config ? [config] : [] : availableWorlds.length ? availableWorlds : config ? [config] : [];
  const availableNetworks = worldOptions.flatMap(c => { const n = gameNetwork(c); return n ? [n] : []; });
  const signedIn = !!wallet.current && sameWorld(wallet.current.world, config) && same(verifiedAccount, account);
  const parcelKey = life && account ? `nh:v2:parcel:${worldKey(life)}:${life.id}:${life.state.day + 1}:${account.toLowerCase()}` : undefined;
  const packed = kit.filter((i): i is number => i !== undefined);
  const selectedMask = () => kitMask(kitRef.current.filter((i): i is number => i !== undefined).map(i => ITEMS[i]!)).toString();
  function clearQuote() { quoteRef.current = undefined; setQuote(undefined); }
  function keepQuote(q: V2OwnerQuote) { quoteRef.current = q; setQuote(q); }
  function finishGuide() { setGuide(undefined); storage.set('nh:v2:packing-help', true); }
  function networkCard() {
    return config || selectedWorld ? <div className="v2-network-card">
      <button type="button" className="v2-network-trigger" aria-label={`Choose network: ${network?.label || 'Game network'}`} aria-haspopup="dialog" disabled={busy || !!walletOperation.current || !!pendingRef.current?.intent || !availableNetworks.length} onClick={() => overlay('networks')}><NetworkMark/><strong className="v2-network-brand">{network?.ecosystem === 'near' ? 'NEAR' : 'Robinhood'}</strong><span className="v2-network-environment" data-network={network?.environment}>{network?.environment === 'mainnet' ? 'Mainnet' : 'Testnet'}</span><i className="v2-network-chevron" aria-hidden="true"/></button>
      {account && wallet.current && <>
        <span className="v2-wallet-address" title={account}>{account.length <= 20 ? account : `${account.slice(0, 8)}…${account.slice(-8)}`}</span><strong className="v2-wallet-balance">{nativeBalance === undefined ? 'Checking balance…' : nativeBalance === null ? 'Balance unavailable' : formatNativeBalance(BigInt(nativeBalance), network)}</strong>
        {nativeBalance === '0' && network?.environment === 'testnet' && errorCode !== 'funds' && <a className="v2-text-button v2-network-funds" href={network.ecosystem === 'near' ? 'https://near-faucet.io/' : 'https://faucet.testnet.chain.robinhood.com/'} target="_blank" rel="noreferrer">Get test {network.nativeSymbol} ↗</a>}
      </>}
    </div> : null;
  }
  function refreshNativeBalance(who: string | undefined, target = config) {
    if (!who || !target) return;
    const scope = `${worldKey(target)}:${who}`;
    if (scope !== nativeBalanceScope.current) return;
    const read = ++nativeBalanceRead.current;
    // Display-only, bounded RPC read. Never hold up a confirmed mint or day, and
    // never let an older wallet/world response overwrite the current balance.
    void createGameReader(target).balance(who).then(balance => {
      if (read === nativeBalanceRead.current && scope === nativeBalanceScope.current) setNativeBalance(balance.toString());
    }).catch(() => {
      if (read === nativeBalanceRead.current && scope === nativeBalanceScope.current) setNativeBalance(null);
    });
  }
  const pendingKey = (who = account) => config && who ? `nh:v2:submitted:${worldKey(config)}:${who.toLowerCase()}` : undefined;
  const nativeIntentKey = (intent: GameSubmissionIntent) => isNearIntent(intent) ? `nh:v2:near-intent:${intent.collection}:${intent.account}:${intent.operationId}` : undefined;
  function rememberedPending(who = account): Pending | undefined {
    const key = pendingKey(who); if (!key) return;
    const direct = storage.get<Pending>(key); if (direct) return direct;
    if (!config || !isNearWorld(config) || !who) return;
    const prefix = `nh:v2:near-intent:${config.collection}:${who}:`;
    try { for (let i = 0; i < Math.min(localStorage.length, 5000); i++) { const candidate = localStorage.key(i); if (candidate?.startsWith(prefix)) { const pending = storage.get<Pending>(candidate); if (pending?.intent && isNearIntent(pending.intent) && pending.intent.account === who && sameWorld(intentWorld(pending.intent), config)) return pending; } } } catch { /* No request is automatically resent. */ }
  }
  function remember(p?: Pending) {
    const previous = pendingRef.current, k = pendingKey(p?.intent?.account || previous?.intent?.account || wallet.current?.account || account);
    pendingRef.current = p; setPending(p);
    if (!k) return;
    if (p) { storage.set(k, p); const operationKey = p.intent && nativeIntentKey(p.intent); if (operationKey) storage.set(operationKey, p); }
    else if (previous?.intent && isNearIntent(previous.intent)) {
      storage.remove(nativeIntentKey(previous.intent)!);
      const stored = storage.get<Pending>(k);
      if (stored?.intent && isNearIntent(stored.intent) && stored.intent.operationId === previous.intent.operationId) storage.remove(k);
    } else storage.remove(k);
  }
  function claimWalletOperation() { if (walletOperation.current) return; const token = Symbol('wallet-operation'); walletOperation.current = token; setWalletBusy(true); return token; }
  function releaseWalletOperation(token: symbol) { if (walletOperation.current !== token) return false; walletOperation.current = undefined; setWalletBusy(false); return true; }
  function walletGesture(phase: WalletOpening['phase'] = 'transaction'): Promise<void> {
    return new Promise((resolve, reject) => {
      const gate: WalletOpening = { phase,
        open() { if (walletOpeningRef.current !== gate) return; walletOpeningRef.current = undefined; setWalletOpening(undefined); setWalletPhase(phase); resolve(); },
        cancel() { if (walletOpeningRef.current !== gate) return; walletOpeningRef.current = undefined; setWalletOpening(undefined); reject(new NearWalletError('ACTION_REJECTED', 'No problem. Nothing was sent.')); },
      };
      walletOpeningRef.current = gate; setWalletOpening(gate); setWalletPhase('wallet-ready');
    });
  }
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
    go(destination === 'wallet' && screen !== 'networks' || destination === screen ? life ? 'home' : 'welcome' : destination);
  }
  function captureSnapshot(): JourneySnapshot | undefined {
    const target = config || selectedWorld; if (!target) return;
    const destination = screen === 'networks' ? backStack.current.at(-1) || returnScreen.current : screen;
    return { world: isNearWorld(target) ? { networkId: 'near-testnet', collection: target.collection } : { chainId: target.chainId, collection: target.collection },
      name, stats: [...stats], payment, account, wallet: wallet.current, provider: activeProvider.current, lifeId: life?.id || snapshot?.lifeId || exactId || undefined,
      day: readingDay, jobRequestId: job?.requestId || snapshot?.jobRequestId, screen: destination === 'pending' || destination === 'birth' ? 'home' : destination,
      backStack: screen === 'networks' ? backStack.current.slice(0, -1) : [...backStack.current], returnScreen: returnScreen.current,
      walletIntent, kit: [...kit] as Parcel, category, parcelSlot, scroll: [...sheetScroll.current.entries()].slice(-40), moreWallets };
  }
  const snapshotFactory = useRef(captureSnapshot); snapshotFactory.current = captureSnapshot;
  useEffect(() => {
    const state = captureSnapshot(); if (state) saveJourneySnapshot(state);
  }, [config, name, stats, payment, account, life?.id, readingDay, screen, kit, category, parcelSlot, moreWallets]);
  useEffect(() => {
    mounted.current = true;
    return () => { walletOpeningRef.current?.cancel(); mounted.current = false; generation.current++; portfolioRead.current++; nativeBalanceRead.current++;
      const state = snapshotFactory.current(); if (state) saveJourneySnapshot(state); };
  }, []);
  function chooseWorld(choice: GameNetwork) {
    if (busy || walletOperation.current || pendingRef.current?.intent) return;
    const target = worldOptions.find(world => gameNetwork(world)?.id === choice.id);
    if (!target) { setMessage('Opening this network. Try again.'); return; }
    if (sameWorld(target, config || selectedWorld)) { close(); return; }
    const state = captureSnapshot(); if (!state) return;
    onWorldSwitch(target, state);
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
    if (!mounted.current) return false;
    if (options?.whilePending && currentScreen.current !== 'pending') return false;
    const g = ++generation.current; setBusy(true); setMessage('');
    try {
      let loaded: V2PublicLife, film: V2FilmPacket | undefined;
      try { const result = await v2Api.replay(id, day, targetWorld); loaded = result.life; film = filmPacket(result.packet); }
      catch (e) { if (day || !(e instanceof V2ApiError) || !['not_found', 'replay_unavailable'].includes(e.code)) throw e; loaded = (await v2Api.life(id, targetWorld)).life; }
      if (!mounted.current || g !== generation.current || options?.whilePending && currentScreen.current !== 'pending') return false;
      const cached = historyCache.current.get(`${worldKey(loaded)}:${loaded.id}`);
      setDays(cached?.days || []); setBefore(cached?.before); setHistoryLoading(false);
      const filmRequestId = typeof film?.requestId === 'string' && /^0x[\da-f]{64}$/i.test(film.requestId) ? film.requestId as Hex : undefined;
      const requestedPlay = options?.play ? fresh || filmRequestId : undefined;
      setLife(loaded); setPacket(film); setReadingDay(day); clearQuote(); setExample(false); setFreshDay(fresh || requestedPlay); setPlayRequest(requestedPlay);
      backStack.current = []; returnScreen.current = 'home'; setScreen(show);
      setJob(current => current?.tokenId === loaded.id && sameWorld(targetWorld, loaded) && (show === 'pending' || loaded.pendingRequest === current.requestId || current.phase === 'ready' && current.requestId !== filmRequestId) ? current : undefined);
      if (account) storage.set(`nh:v2:selected:${worldKey(loaded)}:${account.toLowerCase()}`, loaded.id);
      const url = new URL(gameLifeUrl(loaded, loaded.id)); if (day) url.searchParams.set('day', String(day)); history.replaceState(null, '', url.pathname + url.search);
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
    if (malformedWorld) { setMessage('Choose the original link for this life.'); return; }
    const startupGeneration = generation.current;
    setBusy(true);
    void apiFor(selectedWorld).config().then(async c => {
      if (!active) return; if (selectedWorld && isNearWorld(selectedWorld) && !sameWorld(selectedWorld, c)) throw Error('Choose the original NEAR home.'); setConfig(c); storage.set('nh:v2:world', isNearWorld(c) ? { networkId: 'near-testnet', collection: c.collection } : { chainId: c.chainId, collection: c.collection });
      const cached = snapshot?.wallet, cachedConfig = cached?.world as V2PublicConfig | undefined;
      if (cached && cachedConfig && sameWorld(cached.world, c) && cached.account === snapshot?.account && walletConfigKey(cachedConfig) === walletConfigKey(c) && await cached.connectionValid()) {
        if (!active) return; wallet.current = cached; activeProvider.current = snapshot?.provider;
      }
      if (!active) return;
      if (exactId) {
        const view = query.get('view');
        return loadLife(exactId, initialWorld || c, Number(query.get('day')) || undefined,
          view === 'home' || view === 'watch' ? 'home' : 'profile', undefined,
          view === 'watch' ? { play: true } : undefined);
      }
      if (snapshot?.lifeId && /^[1-9]\d{0,77}$/.test(snapshot.lifeId)) {
        let show: Screen = hatchEntry ? 'hatch' : snapshot.screen;
        let restoredFresh: Hex | undefined;
        if (snapshot.jobRequestId && snapshot.account && await restoreV2Session(snapshot.account, c).catch(() => false)) {
          const current = await apiFor(c).job(snapshot.jobRequestId).catch(() => undefined);
          if (!active) return;
          if (current) { setJob(current); show = current.phase === 'ready' ? 'home' : 'pending'; if (current.phase === 'ready') restoredFresh = current.requestId; }
        }
        if (!active) return;
        return loadLife(snapshot.lifeId, c, snapshot.day, show, restoredFresh);
      }
      // The optional example must not hold up a new hatch or replace a life
      // opened while its replay was still arriving.
      void apiFor(c).guest().then(guest => {
        if (!active || !mounted.current || startupGeneration !== 0 || generation.current !== startupGeneration || walletOperation.current || wallet.current || pendingRef.current) return;
        setLife(guest.life); setPacket(filmPacket(guest.packet));
      }).catch(() => { /* A real new life can be hatched without a demonstration film. */ });
    }).catch(e => { if (active) setMessage(errorText(e)); }).finally(() => {
      if (active && generation.current === startupGeneration && !walletOperation.current) setBusy(false);
    });
    return () => { active = false; };
  }, [boot]);
  useEffect(() => {
    if (isNearWorld(selectedWorld || preview?.config)) { let active = true; void nearWalletChoices().then(choices => { if (active) setWallets(choices); }).catch(e => { if (active) setMessage(errorText(e)); }); return () => { active = false; }; }
    const found = new Map<string, Extract<WalletChoice, { kind: 'evm' }>>();
    const publish = () => setWallets([...found.values()]);
    const announce = (event: Event) => { const d = (event as CustomEvent).detail; if (d?.provider?.request && d.info?.uuid) { for (const [key, value] of found) if (value.provider === d.provider) found.delete(key); found.set(d.info.uuid, { kind: 'evm', id: d.info.uuid, name: String(d.info.name || 'Wallet').slice(0, 40), provider: d.provider }); publish(); } };
    window.addEventListener('eip6963:announceProvider', announce); window.dispatchEvent(new Event('eip6963:requestProvider'));
    const injected = (window as unknown as { ethereum?: Provider }).ethereum;
    if (injected) { activeProvider.current = injected; if (![...found.values()].some(w => w.provider === injected)) found.set('injected', { kind: 'evm', id: 'injected', name: 'Browser wallet', provider: injected }); publish(); }
    return () => window.removeEventListener('eip6963:announceProvider', announce);
  }, []);
  useEffect(() => {
    if (!config || !account) return;
    const saved = rememberedPending();
    if (saved && ['mint', 'day', 'withdraw', 'expire', 'approve'].includes(saved.kind)) { remember(saved); restoreBirth(saved.birthDraft); setScreen('pending'); return; }
    const selected = storage.get<string>(`nh:v2:selected:${worldKey(config)}:${account.toLowerCase()}`);
    if (!exactId && generation.current === 0 && (screen === 'welcome' || screen === 'home') && selected && /^[1-9]\d*$/.test(selected)) void loadLife(selected, config);
  }, [config?.collection, account]);
  useEffect(() => {
    if (screen !== 'purse' || !config || preview) return;
    let active = true;
    void apiFor(config).config().then(current => { if (active && sameWorld(current, config)) setConfig(current); }).catch(() => {});
    return () => { active = false; };
  }, [screen]);
  useEffect(() => {
    if (!activeProvider.current) return;
    const provider = activeProvider.current, reset = () => { portfolioRead.current++; nativeBalanceRead.current++; nativeBalanceScope.current = ''; wallet.current = undefined; authenticated.current = ''; setVerifiedAccount(undefined); setV2Session(''); setJob(undefined); clearQuote(); setAccount(undefined); setOwned([]); setLivesLoading(false); setBusy(false); setWalletBalance('0'); setNativeBalance(undefined); if (pendingRef.current) setScreen('pending'); };
    provider.on?.('accountsChanged', reset); provider.on?.('chainChanged', reset);
    return () => { provider.removeListener?.('accountsChanged', reset); provider.removeListener?.('chainChanged', reset); };
  }, [account]);
  useEffect(() => {
    if (!config || !isNearWorld(config) || !account) return;
    let active = true, cleanup: (() => void) | undefined;
    void onNearWalletChange(() => {
      if (!active) return;
      nativeBalanceRead.current++; nativeBalanceScope.current = ''; wallet.current = undefined; authenticated.current = '';
      setVerifiedAccount(undefined); setV2Session(''); setAccount(undefined); setOwned([]); setNativeBalance(undefined); clearQuote();
      if (pendingRef.current) setScreen('pending');
    }).then(stop => { if (active) cleanup = stop; else stop(); }).catch(() => {});
    return () => { active = false; cleanup?.(); };
  }, [account, config?.collection]);
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
    let lastRefresh = 0;
    const refreshOnReturn = () => {
      if (document.visibilityState === 'hidden' || walletOperation.current || Date.now() - lastRefresh < 1500) return;
      lastRefresh = Date.now(); refreshNativeBalance(account, config);
    };
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => { nativeBalanceRead.current++; window.removeEventListener('focus', refreshOnReturn); document.removeEventListener('visibilitychange', refreshOnReturn); };
  }, [account, config?.chainId, config?.collection]);
  async function signIn(w: Wallet, allowSignature = true) {
    if (!config) return false;
    if (await restoreV2Session(w.account, config)) { authenticated.current = w.account.toLowerCase(); setVerifiedAccount(w.account); return true; }
    authenticated.current = ''; setVerifiedAccount(undefined); setV2Session('');
    if (!allowSignature) return false;
    setWalletPhase('signin');
    const challenge = await v2Api.challenge(w.account), signature = await w.signLogin(challenge, () => walletGesture('signin'));
    const s = await v2Api.authenticate(w.account, challenge.id, signature);
    setV2Session(s.token); cacheV2Session(w.account, config, s); authenticated.current = w.account.toLowerCase(); setVerifiedAccount(w.account); return true;
  }
  /** A confirmed day is durable onchain. Its acknowledgement is not an unresolved wallet payment. */
  async function retireAcceptedDayJournal(p: Pending, player = wallet.current?.account || account) {
    if (!config || p.kind !== 'day' || !p.requestId || !p.tokenId || !player) return;
    if (p.intent && (!sameWorld(intentWorld(p.intent), config) || !same(p.intent.account, player))) return;
    let accepted: Awaited<ReturnType<typeof v2Api.request>>;
    try { accepted = await v2Api.request(p.requestId); } catch (e) { if (e instanceof V2ApiError && e.code === 'not_found') return; throw e; }
    if (accepted.status < 1 || accepted.status > 4 || accepted.requestId !== p.requestId || accepted.tokenId !== p.tokenId || !same(accepted.player, player)) return;
    // Do not erase a newer wallet intent if two user interactions completed out of order.
    if (pendingRef.current !== p) return;
    remember();
    setLife(current => current?.id === accepted.tokenId && sameWorld(current, config)
      ? { ...current, pendingRequest: accepted.status === 1 ? accepted.requestId : undefined } : current);
    return accepted;
  }
  async function attach(choice: WalletChoice, action: Action) {
    if (!config) return; const token = claimWalletOperation(); if (!token) return;
    operation.current = action; writeScreen.current = screen === 'wallet' ? returnScreen.current : screen; setWalletPhase('connect'); setBusy(true); setMessage('');
    try {
      const w = await connectGameWallet(choice, config, intent => {
        setWalletPhase('transaction');
        const next: Pending = { kind: operation.current, ...operationContext.current, intent }, key = `nh:v2:submitted:${worldKey(config)}:${intent.account.toLowerCase()}`;
        if (isNearIntent(intent)) {
          const original = pendingRef.current;
          if (original?.intent && isNearIntent(original.intent) && original.intent.operationId === intent.operationId && original.uncertain) next.uncertain = true;
          const prior = storage.get<Pending>(key);
          if (prior?.intent && (!isNearIntent(prior.intent) || prior.intent.operationId !== intent.operationId)) { pendingRef.current = prior; setPending(prior); throw new NearWalletError('context', 'Check your earlier transaction first.'); }
          const operationKey = nativeIntentKey(intent)!;
          storage.set(operationKey, next); storage.set(key, next);
          const saved = storage.get<Pending>(operationKey), pointer = storage.get<Pending>(key);
          if (!saved?.intent || !isNearIntent(saved.intent) || saved.intent.operationId !== intent.operationId || !pointer?.intent || !isNearIntent(pointer.intent) || pointer.intent.operationId !== intent.operationId) {
            // No wallet request has opened yet. Do not leave a phantom pending
            // operation when persistence failed before a transaction could exist.
            storage.remove(operationKey); if (pointer?.intent && isNearIntent(pointer.intent) && pointer.intent.operationId === intent.operationId) storage.remove(key);
            throw new NearWalletError('storage', 'This browser cannot keep the transaction. Use a regular browser tab.');
          }
          const draft = captureSnapshot(); if (draft) saveJourneySnapshot(draft);
        } else storage.set(key, next);
        pendingRef.current = next; setPending(next);
      });
      wallet.current = w; activeProvider.current = choice.kind === 'evm' ? choice.provider : undefined; setAccount(w.account);
      if (pendingRef.current?.intent && !same(pendingRef.current.intent.account, w.account)) throw Error(`Reconnect ${pendingRef.current.intent.account.slice(0, 6)}…${pendingRef.current.intent.account.slice(-4)} to finish this payment.`);
      setNativeBalance((await w.balance()).toString()); setWalletBalance((await w.tokenBalance()).toString()); setAllowance((await w.tokenAllowance()).toString());
      const unfinished = rememberedPending(w.account);
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
    if (config?.admissionsEnabled === false && ['mint', 'approve', 'day', 'verify', 'hatch-connect'].includes(action)) { throw Error('New lives and days are paused here. Your saved life and purse are still yours.'); }
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
    const original = pendingRef.current;
    const rejected = code === 4001 || code === 'ACTION_REJECTED' || code === 'cancelled';
    if (original?.intent && isNearIntent(original.intent) && (original.uncertain && (rejected || code === 'reverted')
      || rejected && ['resume', 'connect', 'hatch-connect'].includes(operation.current))) {
      // Cancelling a retry or a reconnect says nothing about the earlier
      // request. Its immutable operation ID remains the only allowed retry.
      remember(original); setErrorCode('uncertain'); setScreen('pending');
      setMessage('The original transaction still needs checking.'); return;
    }
    if (code === 'uncertain' && pendingRef.current?.intent && isNearIntent(pendingRef.current.intent)) remember({ ...pendingRef.current, uncertain: true });
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
    if (action === 'hatch-connect') { go('hatch'); return; }
    if (action === 'verify') { await signIn(w); go('review'); return; }
    if (action === 'resume') {
      if (pendingRef.current) { setScreen('pending'); await checkPayment(w, token); return; }
      await signIn(w); const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined);
      if (!id) throw Error('Choose a day to open.');
      const next = await v2Api.wake(id); await showJob(next); return;
    }
    if (action === 'mint' || action === 'day' || action === 'approve') setJob(undefined);
    let hash: string;
    if (action === 'mint') {
      const clean = name.trim().toUpperCase(); if (!/^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(clean) || stats.reduce((a, b) => a + b, 0) !== 5) throw Error('Give this little life a name and five points.');
      setWalletPhase('checking'); setScreen('pending');
      if (payment === 'purse') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); hash = await w.birthFromPurse(life.id, life.purseNonce, clean, stats as [number, number, number], walletGesture); }
      else if (payment === 'wallet') {
        if (await w.tokenBalance() < 250000000n) throw Error('Your wallet needs 250 NHC for this little life.');
        if (w.requiresBirthApproval && BigInt((await w.tokenAllowance()).toString()) < 250000000n) {
          operation.current = 'approve'; hash = await w.approveBirthTokens(); remember({ ...pendingRef.current, kind: 'approve', hash }); setScreen('pending'); await checkPayment(w, token); return;
        }
        hash = await w.birthFromWallet(clean, stats as [number, number, number], walletGesture);
      }
      else hash = await w.mint(clean, stats as [number, number, number], walletGesture);
    } else if (action === 'day') {
      if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your life in this world.');
      clearQuote(); setWalletPhase('checking');
      if (!await signIn(w, false)) { go('review'); setMessage('Verify your wallet, then start the day.'); return; }
      const mask = selectedMask();
      const q = await v2Api.quote(life.id, mask, true);
      if (q.admission.tokenId !== life.id || !same(q.admission.player, w.account) || q.admission.kitMask !== mask || q.admission.baseRevision !== life.revision || q.admission.decisionConfig !== config?.decisionConfig) throw Error('Your home changed. Review the day again.');
      keepQuote(q); operationContext.current.requestId = q.admission.id; setWalletPhase('checking');
      hash = await w.accept(q, walletGesture);
      remember({ ...pendingRef.current, kind: 'day', tokenId: life.id, requestId: q.admission.id, hash });
      setScreen('pending'); await checkPayment(w, token); return;
    } else if (action === 'withdraw') { if (!currentWorld || !life || !same(life.owner, w.account)) throw Error('Choose your own purse.'); setWalletPhase('checking'); setScreen('pending'); hash = await w.withdraw(life.id, life.purseMicro, walletGesture); }
    else { const id = life?.pendingRequest || (job?.tokenId === life?.id ? job?.requestId : undefined); if (!currentWorld || !id) throw Error('No day needs releasing.'); setWalletPhase('checking'); setScreen('pending'); hash = await w.expire(id, walletGesture); }
    remember({ ...pendingRef.current, kind: action, tokenId: life?.id, hash }); setScreen('pending'); await checkPayment(w, token);
  }
  async function checkPayment(w = wallet.current, ownerToken?: symbol) {
    if (!config || !pendingRef.current) return;
    const token = ownerToken || claimWalletOperation(); if (!token || walletOperation.current !== token) return;
    const p = pendingRef.current; setBusy(true); setWalletPhase('checking'); setMessage('');
    try {
      if (p.intent && w && !same(p.intent.account, w.account)) throw Error(`Reconnect ${p.intent.account.slice(0, 6)}…${p.intent.account.slice(-4)} to finish this payment.`);
      if (p.kind === 'day' && p.requestId && !p.hash && !isNearIntent(p.intent)) {
        let accepted = false;
        try { accepted = (await v2Api.request(p.requestId)).status > 0; } catch (e) { if (!(e instanceof V2ApiError) || e.code !== 'not_found') throw e; }
        if (accepted) { if (!w) { setMessage('Connect your wallet to open this day.'); return; } await signIn(w); const next = await v2Api.wake(p.requestId); remember(); await showJob(next); return; }
      }
      let hash = p.hash, receipt: GameReceipt | undefined;
      if (hash && p.intent && isNearIntent(p.intent) && p.intent.method === 'accept_day') {
        const known = await resolveGameSubmission(config, p.intent);
        if (known.expired) { await retireExpiredOriginal(p); return; }
      }
      if (!hash && p.intent) {
        const resolved = await resolveGameSubmission(config, p.intent, p.cursor);
        if (resolved.expired) { await retireExpiredOriginal(p); return; }
        remember({ ...p, ...(resolved.nextBlock ? { cursor: resolved.nextBlock } : {}), ...(resolved.hash ? { hash: resolved.hash } : {}) });
        if (resolved.matched === false) { remember(); throw Error('That payment was replaced. Your saved home is unchanged.'); }
        receipt = resolved.receipt;
        if (!resolved.hash && !receipt) { if (isNearIntent(p.intent)) remember({ ...p, uncertain: true }); setMessage('Still checking your wallet. Check again shortly.'); return; }
        hash = resolved.hash;
      }
      if (!hash && !receipt) { setMessage('Check your wallet, then try checking again.'); return; }
      receipt ||= await (w || createGameReader(config)).wait(hash!, p.intent);
      refreshNativeBalance(p.intent?.account || w?.account || account, config);
      if (p.kind === 'mint') {
        const id = mintedGameId(receipt, config, p.intent?.account || w?.account || account); if (id === undefined) throw Error('Checking the new life. Try again shortly.');
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
    } catch (e) { if (!await handleNativeReplacement(p, e)) handleWriteError(e); }
    finally { if (!ownerToken && releaseWalletOperation(token)) setBusy(false); }
  }
  async function handleNativeReplacement(p: Pending, error: unknown): Promise<boolean> {
    if (!config || !isNearIntent(p.intent) || (error as { code?: unknown })?.code !== 'replaced') return false;
    const replacement = (error as { replacementTokenId?: string }).replacementTokenId;
    const target = replacement || p.tokenId;
    remember(); setJob(undefined);
    if (target && /^[1-9]\d{0,77}$/.test(target)) await loadLife(target, config);
    else go(life ? 'home' : 'welcome');
    setMessage(errorText(error)); return true;
  }
  async function retireExpiredOriginal(p: Pending) {
    if (!config || !isNearIntent(p.intent) || p.intent.method !== 'accept_day') return;
    const original = (p.intent.args.admission as { tokenId?: string })?.tokenId;
    const target = p.tokenId || original;
    remember(); setJob(undefined); clearQuote();
    if (target && /^[1-9]\d{0,77}$/.test(target)) await loadLife(target, config, undefined, 'review');
    setMessage('That quote expired. Review your day and start again.');
  }
  async function retryOriginal() {
    const p = pendingRef.current, w = wallet.current;
    if (!p?.intent || !isNearIntent(p.intent) || !w?.retryOriginal || !same(w.account, p.intent.account) || !config || !sameWorld(w.world, config)) return;
    const token = claimWalletOperation(); if (!token) return;
    operation.current = p.kind; operationContext.current = { tokenId: p.tokenId, requestId: p.requestId, birthDraft: p.birthDraft };
    setBusy(true); setWalletPhase('checking'); setMessage(''); setErrorCode('');
    remember({ ...p, uncertain: true });
    try {
      const result = await w.retryOriginal(p.intent, walletGesture);
      if (result.expired) { await retireExpiredOriginal(p); return; }
      // A completed canonical operation needs no new wallet request. A retry
      // otherwise reuses every original field, operation ID, gas and deposit.
      remember({ ...p, hash: result.hash, uncertain: true });
      await checkPayment(w, token);
    } catch (e) { if (!await handleNativeReplacement(p, e)) handleWriteError(e); }
    finally { if (releaseWalletOperation(token)) setBusy(false); }
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
    if (config?.admissionsEnabled === false) {
      const current = availableWorlds.find(target => gameNetwork(target)?.id === gameNetwork(config)?.id && !sameWorld(target, config) && target.admissionsEnabled !== false);
      const draft = captureSnapshot();
      if (current && draft) { onWorldSwitch(current, { ...draft, screen: 'hatch', payment: 'native' }); return; }
      setMessage('Hatching is paused. Your saved life is still here.'); return;
    }
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
      const seedSlot = current.findIndex(i => i !== undefined && i >= 13), emptySlot = current.findIndex(i => i === undefined);
      const target = index >= 13 && seedSlot >= 0 ? seedSlot
        : !manualParcelTarget.current && parcelSlot === seedSlot && emptySlot >= 0 ? emptySlot : parcelSlot;
      const wasEmpty = current[target] === undefined; next[target] = index;
      const nextEmpty = next.findIndex(i => i === undefined);
      setParcelSlot(wasEmpty && nextEmpty >= 0 ? nextEmpty : target);
      if (guide !== undefined) setGuide(Math.min(2, next.filter(i => i !== undefined).length));
    }
    manualParcelTarget.current = false;
    kitRef.current = next; setKit(next);
    if (parcelKey) storage.set(parcelKey, next);
  }
  function selectCategory(index: number) {
    setCategory(index);
    if (busy || walletOperation.current || manualParcelTarget.current) return;
    const seedSlot = kit.findIndex(i => i !== undefined && i >= 13), emptySlot = kit.findIndex(i => i === undefined);
    if (index === 1 && seedSlot >= 0) setParcelSlot(seedSlot);
    else if (emptySlot >= 0) setParcelSlot(emptySlot);
  }
  function restoreParcel() {
    const saved = parcelKey ? storage.get<(number | null)[]>(parcelKey) : undefined;
    const next: Parcel = [undefined, undefined, undefined];
    if (Array.isArray(saved) && saved.length === 3) for (let i = 0; i < 3; i++) { const value = saved[i]; if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 21 && !next.includes(value) && (value < 13 || !next.some(n => n !== undefined && n >= 13))) next[i] = value; }
    manualParcelTarget.current = false;
    kitRef.current = next; setKit(next); const empty = next.findIndex(i => i === undefined); setParcelSlot(empty < 0 ? 0 : empty); clearQuote();
  }
  async function prepare() { if (!life) return; if (readyJob) { await loadLife(readyJob.tokenId, config, undefined, 'home', readyJob.requestId, { play: true }); return; } if (life.pendingRequest) { await run('resume'); return; } if (config?.admissionsEnabled === false) { setMessage('New days are paused here. Your saved days and purse are still yours.'); return; } setFreshDay(undefined); setPlayRequest(undefined); setReadingDay(undefined); restoreParcel(); overlay('care'); }
  function reviewDay() { if (busy || walletOperation.current) return; finishGuide(); clearQuote(); overlay('review'); }
  async function share() { if (!life) return; const url = new URL(gameLifeUrl(life, life.id)); try { await navigator.clipboard.writeText(url.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setMessage('Copy this page address to share this life.'); } }
  const stageLife = life, stagePacket = packet;
  const entryScenery = !example && !owner && (screen === 'welcome' || backStack.current.includes('welcome'));
  const nameValid = /^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(name.trim().toUpperCase());
  const sum = stats.reduce((a, b) => a + b, 0), purse = BigInt(life?.purseMicro || '0');
  const withdrawalBurn = config?.transferBurn?.enabled ? purse * BigInt(config.transferBurn.bps) / 10000n : 0n;
  const overlayOpen = screen !== 'home';
  const pendingDayJob = !pending || pending.kind === 'day' && pending.requestId === job?.requestId ? job : undefined;
  const pendingKind = pendingDayJob ? 'day' : pending?.kind || (walletBusy ? operation.current : undefined);
  const dayReady = pendingDayJob?.phase === 'ready', dayPaused = pendingDayJob?.phase === 'quarantined';
  const dayClosing = pendingDayJob?.phase === 'failure_due' || pendingDayJob?.phase === 'expiry_due';
  const dayRetry = !!pendingDayJob?.retrySafe;
  const askingWallet = walletBusy && walletPhase !== 'checking' && walletPhase !== 'wallet-ready' && !pending?.hash && !pendingDayJob;
  const pendingTitle = dayReady ? 'A day to watch' : dayRetry ? 'Day preparation failed' : dayPaused ? 'Checking this day' : askingWallet ? walletPhase === 'signin' ? 'Verify your wallet' : 'Confirm in your wallet' : pendingKind === 'mint' ? `Hatching ${pending?.birthDraft?.name || name}` : pendingKind === 'approve' ? 'Permission to hatch' : pendingKind === 'withdraw' ? 'Taking NHC home' : pendingKind === 'expire' ? 'Closing this day' : pendingDayJob?.phase === 'saving' || pendingDayJob?.phase === 'prepared' ? 'Saving your day' : pendingDayJob ? 'Jev is choosing the day' : 'Confirming your day';
  const pendingNote = dayReady ? `${life?.name || 'Your rooster'} has a day to show you.` : dayRetry ? pendingDayJob?.failureMessage || 'The AI could not prepare this day. Your saved home is unchanged.' : dayPaused ? 'Your payment is recorded. Check again shortly.' : askingWallet ? walletPhase === 'signin' ? 'Sign-in only. No fee.' : `Review the ${pendingKind === 'mint' ? 'NFT mint' : pendingKind === 'approve' ? 'NHC permission' : 'transaction'} in your wallet.` : pendingKind === 'mint' ? 'Confirming your rooster NFT onchain.' : pendingKind === 'approve' ? `Allow 250 NHC, then hatch ${pending?.birthDraft?.name || name}.` : pendingKind === 'withdraw' ? 'Sending NHC to your wallet.' : pendingKind === 'expire' ? 'Your rooster stays at home.' : pendingDayJob?.phase === 'saving' || pendingDayJob?.phase === 'prepared' ? 'Saving the day onchain.' : pendingDayJob ? pendingDayJob.failureMessage || 'One little ambition. A day of their own.' : 'Waiting for blockchain confirmation.';
  const reconnectNeeded = !!pending?.intent && !same(pending.intent.account, wallet.current?.account);
  const pendingLabel = dayReady ? 'Watch day' : reconnectNeeded ? 'Reconnect wallet' : !wallet.current && pending?.kind === 'day' ? 'Connect wallet' : pendingDayJob ? 'Check day' : pendingKind === 'approve' ? 'Check permission' : pendingKind === 'withdraw' ? 'Check transfer' : pendingKind === 'mint' ? 'Check hatching' : 'Check payment';
  const originalRetry = (pending?.uncertain || errorCode === 'uncertain') && !!pending?.intent && isNearIntent(pending.intent) && wallet.current?.kind === 'near' && same(wallet.current.account, pending.intent.account);
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
  const title: Record<Exclude<Screen, 'home'>, string> = { welcome: exactId ? 'Opening this home' : 'Welcome home', profile: life?.state.alive === false ? `${life.name} · remembered` : life?.name || 'A little life', hatch: 'A new rooster', birth: birth ? `Rooster #${birth.id}` : 'Your rooster NFT', care: life?.state.day === 0 ? 'Pack the first day' : 'Pack tomorrow', review: `Ready for day ${(life?.state.day || 0) + 1}?`, pending: dayClosing ? 'Closing this attempt' : pendingTitle, purse: `${life?.name || 'A little life'}’s purse`, history: 'Days', lives: 'Your roosters', menu: 'Menu', wallet: 'Choose your wallet', stock: historical && packet ? `Day ${packet.result.state.day} belongings` : 'Belongings', networks: 'Choose network' };
  const closeDestination = backStack.current.at(-1) || returnScreen.current;
  const nestedSheet = closeDestination !== 'home' && closeDestination !== screen;
  const backLabel = closeDestination === 'welcome' ? 'Back to start' : closeDestination === 'hatch' ? 'Back to hatching' : closeDestination === 'care' ? 'Back to supplies' : closeDestination === 'review' ? 'Back to review' : closeDestination === 'profile' ? 'Back to rooster' : closeDestination === 'menu' ? 'Back to menu' : closeDestination === 'wallet' ? 'Back to wallets' : 'Back';
  const entryRecovery = !exactId && !!config && !!pending;
  const entryRecoveryLabel = pending?.kind === 'mint' || pending?.kind === 'approve' ? 'Continue hatching' : pending?.kind === 'day' ? 'Open my day' : pending?.kind === 'withdraw' ? 'Check transfer' : 'Check day';
  const meteor = wallets.find(wallet => wallet.kind === 'near' && /meteor/i.test(wallet.name));
  const visibleWallets = isNearWorld(config) && meteor && !moreWallets ? [meteor] : wallets;
  let body: ReactNode;
  if (screen === 'welcome') body = <>
    <div className="v2-egg"><img src={itemImage(38)} alt=""/></div>
    {message && selectedWorld && networkCard()}
    <button className="v2-primary" disabled={busy || (!config && !message)} onClick={() => malformedWorld ? location.assign(location.pathname + '?v2=1') : exactId && config ? void loadLife(exactId, initialWorld || config, Number(query.get('day')) || undefined, 'profile') : message && !config ? (setMessage(''), setBoot(v => v + 1)) : entryRecovery ? void run('resume') : hatch()}>
      {malformedWorld ? 'Back to start' : exactId ? busy || !config && !message ? 'Opening home…' : 'Try again' : message && !config ? 'Try again' : entryRecovery ? entryRecoveryLabel : busy || !config ? 'Opening…' : 'Hatch a rooster'}
    </button>
    {exactId ? <button className="v2-text-button" onClick={() => location.assign(location.pathname + '?v2=1')}>Back to start</button> : <div className="v2-entry-options">
      {life && packet && <button className="v2-text-button" disabled={busy} onClick={watchExample}><Icon name="play" size={16}/>Watch example</button>}
      <button className="v2-text-button" disabled={!config || busy} onClick={() => void run('connect')}><Icon name="leaf" size={16}/>Your roosters</button>
    </div>}
  </>;
  else if (screen === 'profile' && life) body = <>
    <div className="v2-life-portrait"><img className="v2-dynamic-portrait" src={gameImageUrl(life, life.id)} alt={`${life.name} and their saved home`}/></div>
    <a className="v2-nft-badge" href={gameExplorerToken(life, life.id)} target="_blank" rel="noreferrer">{gameNetwork(life)?.label ? `${gameNetwork(life)!.label} · ` : ''}NFT #{life.id}<span aria-hidden="true">↗</span></a>
    <div className="v2-life-facts"><span>DAY {life.state.day}</span><span>LV{String(life.state.level).padStart(2, '0')}</span><span><Icon name="wallet" size={16}/>{coins(life.purseMicro)} NHC</span></div>
    {!life.state.alive && <p className="v2-small-note">{endingNote(life.state)}</p>}
    <button className="v2-primary" onClick={() => go('home')}><Icon name="house" size={16}/>Visit home</button>
    <div className="v2-secondary-row"><button onClick={() => void showHistory()}><Icon name="book" size={16}/>Days</button><button onClick={() => void share()}><Icon name="mail" size={16}/>{copied ? 'Copied' : 'Share'}</button>{owner && <button onClick={() => overlay('purse')}><Icon name="wallet" size={16}/>Purse</button>}</div>
    {!owner && <button className="v2-text-button" onClick={() => hatch()}>Hatch your own</button>}
  </>;
  else if (screen === 'hatch') body = <>
    <div className="v2-egg small"><img src={itemImage(38)} alt=""/></div>
    {networkCard()}
    {!config && message && <button className="v2-text-button" disabled={busy} onClick={() => { setMessage(''); setBoot(value => value + 1); }}>Try opening again</button>}
    <label className="v2-name-field"><span>Name your rooster</span><input value={name} disabled={busy} maxLength={8} placeholder="Name" autoComplete="off" autoCapitalize="characters" onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}/></label>
    <details className="v2-personality"><summary><span className="v2-personality-label">Strengths<small>Hardy, handy or upbeat?</small></span><span>{sum < 5 ? `${5 - sum} to place` : stats[0] === 2 && stats[1] === 2 && stats[2] === 1 ? 'Balanced' : 'Custom'}</span></summary>
      <p className="v2-points-left"><span>Move 5 points</span><small>− then + to move a point.</small></p>
      <div className="v2-stat-picker">{(['Body', 'Wits', 'Spirit'] as const).map((label, i) => <div key={label}><span className="v2-stat-copy"><strong>{label}</strong><small>{['Less hurt from mishaps', 'Fewer fumbles', 'Cheerful for longer'][i]}</small></span><button aria-label={`Less ${label.toLowerCase()}`} disabled={stats[i] === 0 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n - 1 : n))}>−</button><b>{stats[i]}</b><button aria-label={`More ${label.toLowerCase()}`} disabled={sum >= 5 || busy} onClick={() => setStats(stats.map((n, j) => i === j ? n + 1 : n))}>+</button></div>)}</div>
      {(stats[0] !== 2 || stats[1] !== 2 || stats[2] !== 1) && <button className="v2-text-button v2-strength-reset" disabled={busy} onClick={() => setStats([2, 2, 1])}>Reset to balanced</button>}
    </details>
    {sum < 5 && <p className="v2-small-note">Place {5 - sum} {5 - sum === 1 ? 'point' : 'points'} in Strengths to hatch.</p>}
    <details className="v2-payment-options"><summary><span>{payment === 'native' ? config ? `${eth(config.nativeMintPrice)} ${network?.nativeSymbol || 'ETH'}` : 'Loading price…' : '250 NHC'}</span><span>Change</span></summary>
      <div className="v2-payment"><button disabled={busy} aria-pressed={payment === 'native'} onClick={() => selectPayment('native')}>{config ? eth(config.nativeMintPrice) + ' ' + (network?.nativeSymbol || 'ETH') : network?.nativeSymbol || 'ETH'}</button><button disabled={busy} aria-pressed={payment !== 'native'} onClick={() => selectPayment(owner && purse >= 250000000n ? 'purse' : 'wallet')}>250 NHC</button></div>
    </details>
    {payment !== 'native' && <p className="v2-small-note">{payment === 'purse' ? `From ${life?.name}’s purse` : 'From your wallet'}{owner && purse >= 250000000n && <button className="v2-inline-button" disabled={busy} onClick={() => selectPayment(payment === 'wallet' ? 'purse' : 'wallet')}>Change</button>}</p>}
    {payment !== 'native' && config && isNearWorld(config) && <p className="v2-native-deposit">{eth(config.storageDeposit)} NEAR storage deposit.<small>Unused NEAR returns.</small></p>}
    <button className="v2-primary" disabled={!config || config.admissionsEnabled === false || busy || !!wallet.current && (!nameValid || sum !== 5)} onClick={() => void run(wallet.current ? 'mint' : 'hatch-connect')}><Icon name={wallet.current ? 'leaf' : 'wallet'} size={16}/>{config?.admissionsEnabled === false ? 'Hatching paused' : busy ? walletBusy ? wallet.current ? 'Hatching…' : 'Connecting…' : 'Opening…' : !wallet.current ? 'Connect wallet' : payment === 'wallet' && !isNearWorld(config) && BigInt(allowance) < 250000000n ? 'Allow 250 NHC' : 'Hatch ' + (name.trim() || 'rooster')}</button>
    <span className="v2-fee-note">{wallet.current ? 'Network fee applies' : 'Connecting is free'}</span>
  </>;
  else if (screen === 'birth' && birth && config) body = <BirthReveal key={`${config.collection}:${birth.id}`} id={birth.id} name={life?.id === birth.id && currentWorld ? life.name : pending?.birthDraft?.name || name} egg={itemImage(38)} rooster={life?.id === birth.id && currentWorld ? roosterImage(life.state.seed) : undefined} explorer={gameExplorerToken(config, birth.id)} transaction={birth.hash ? gameExplorerTransaction(config, birth.hash) : undefined} busy={busy} onHome={() => { setBirth(undefined); go('home'); }} onRetry={() => { if (pendingRef.current) void checkPayment(); else void loadLife(birth.id, config, undefined, 'birth'); }}/>
  else if (screen === 'care' && life) {
    const choices = category === 0 ? [0, 2, 1, 4, 5, 3, 11] : category === 1 ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 12] : [7, 8, 9, 10];
    body = <>
      <DayFlow stage={0}/>
      {guide !== undefined && <aside className="v2-pack-guide" data-step={guide}><span className="v2-guide-dots" aria-label={`Tip ${guide + 1} of 3`}>{[0, 1, 2].map(i => <i key={i} data-active={i === guide}/>)}</span><strong>{['Tap a supply.', 'Pick up to three.', 'Review, then start.'][guide]}</strong><button className="v2-icon-button" aria-label="Dismiss packing tips" onClick={finishGuide}><Icon name="close" size={16}/></button></aside>}
      <div className="v2-post-tray">{[0, 1, 2].map(i => <button key={i} className={'v2-post-slot' + (parcelSlot === i ? ' is-target' : '')} aria-pressed={parcelSlot === i} aria-label={`Parcel slot ${i + 1}: ${kit[i] === undefined ? 'empty' : itemName(kit[i]!)}`} disabled={busy} onClick={() => { if (!walletOperation.current) { manualParcelTarget.current = true; setParcelSlot(i); } }}>{kit[i] === undefined ? <span className="v2-empty-slot" aria-hidden="true">+</span> : <><img src={itemImage(kit[i]!)} alt=""/><i>×1</i></>}</button>)}</div>
      <div className="v2-supply-tabs">{(['Care', 'Garden', 'House'] as const).map((label, i) => <button key={label} aria-pressed={category === i} onClick={() => selectCategory(i)}>{label}</button>)}</div>
      {category === 1 && <span className="v2-supply-hint">1 seed or sapling per day</span>}
      <div className={'v2-supplies' + (category === 2 ? ' is-house' : '')}>{choices.map(i => <button key={i} className={`${kit.includes(i) ? 'selected' : ''}${i === 11 || i === 12 ? ' v2-supply-wide' : ''}`} aria-pressed={kit.includes(i)} aria-label={`${kit.includes(i) ? 'Remove' : 'Pack'} ${i >= 13 ? PLANTS[i - 12]?.name : itemName(i)}`} disabled={busy} onClick={() => choose(i)}><img src={itemImage(i)} alt=""/><span>{i >= 13 ? PLANTS[i - 12]?.name : itemName(i)}</span><small>{i >= 13 ? `${PLANTS[i - 12]?.ticks} days` : life.state.inventory[i] ? `At home ×${life.state.inventory[i]}` : '×1'}</small></button>)}</div>
      <div className="v2-pack-controls"><button className="v2-primary" disabled={busy} onClick={reviewDay}><Icon name="check" size={16}/>Review day {life.state.day + 1}</button>
      <span className="v2-fee-note">{packed.length ? `${packed.length} of 3 packed` : 'Up to 3 supplies · included'}</span></div>
    </>;
  }
  else if (screen === 'review' && life) body = <>
    <DayFlow stage={1}/>
    {packed.length > 0 && <div className="v2-review-parcel">{kit.map((index, i) => <div key={i}>{index === undefined ? <span>—</span> : <><img src={itemImage(index)} alt=""/><span>{itemName(index)}</span></>}</div>)}</div>}
    <div className="v2-review-facts">{!packed.length && <Icon name="house" size={28}/>}<strong>{life.name} chooses what happens.</strong><span>{packed.length ? 'Your supplies arrive at the mailbox.' : 'A day with what is already at home.'}</span></div>
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
      <ProcessGraphic stage={dayClosing ? 'saving' : visual}/>
      {pendingDayJob && !dayClosing && !dayRetry && !dayPaused && <ThoughtActivity completed={pendingDayJob.progress?.length || pendingDayJob.decisions} saving={saving}/>}
      {!(visual === 'ai' && (pendingDayJob?.progress?.length || pendingDayJob?.decisions) && !dayClosing) && <p className="v2-pending-status">{dayClosing ? 'Recording this incomplete attempt onchain.' : saving && !dayReady ? `Saving on ${network?.label || 'the blockchain'}…` : pendingDayJob?.phase === 'queued' ? 'Getting ready for Jev.' : pendingNote}</p>}
      {dayRetry ? <button className="v2-primary" disabled={busy} onClick={retryDay}>Try this day again</button>
        : dayReady ? <button className="v2-primary" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Opening…' : 'Watch day'}</button>
        : canCloseDay ? <button className="v2-primary" disabled={busy} onClick={() => void run('expire')}>{busy ? 'Closing…' : 'Close expired day'}</button>
        : originalRetry ? <button className="v2-primary" disabled={busy} onClick={() => void retryOriginal()}>{busy ? 'Checking…' : 'Retry original transaction'}</button>
        : pendingDayJob ? <button className="v2-text-button" disabled={walletBusy} onClick={() => go(owner ? 'home' : 'welcome')}>{owner ? 'Back home' : 'Back to start'}</button>
        : <button className="v2-primary" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Checking…' : pendingLabel}</button>}
      {originalRetry && <button className="v2-text-button" disabled={busy} onClick={() => void checkPending()}>Check again</button>}
      {pendingDayJob && !dayReady && !dayRetry && (message || dayPaused || Date.now() - pendingDayJob.updatedAt > 20_000) && <button className="v2-text-button" disabled={busy} onClick={() => void checkPending()}>{busy ? 'Checking…' : 'Check again'}</button>}
      {pendingDayJob && (dayReady || dayRetry || canCloseDay) && <button className="v2-text-button" disabled={walletBusy} onClick={() => go(owner ? 'home' : 'welcome')}>{owner ? 'Back home' : 'Back to start'}</button>}
      {(pendingDayJob?.finalTx || pending?.hash || pendingDayJob?.ownerTx) && config && <a className="v2-text-button v2-transaction-link" href={gameExplorerTransaction(config, (pendingDayJob?.finalTx || pending?.hash || pendingDayJob?.ownerTx)!)} target="_blank" rel="noreferrer">{pendingDayJob?.finalTx ? 'View saved day onchain' : 'View transaction'}</a>}
    </>;
  }
  else if (screen === 'purse' && life) body = <><div className="v2-purse-total"><Icon name="wallet" size={32}/><strong>{coins(life.purseMicro)}</strong><span>NHC</span></div>{!life.state.alive && <p className="v2-small-note">Still yours to take home.</p>}{owner && purse === 0n ? <><p className="v2-small-note">Flowers, fruit and crafts can fill this purse.</p><button className="v2-primary" disabled={busy} onClick={() => life.state.alive ? go('home') : hatch() }>{life.state.alive ? 'Back home' : 'Hatch another'}</button></> : owner ? <>{config && isNearWorld(config) && <p className="v2-native-deposit">{eth(config.storageDeposit)} NEAR storage deposit.<small>Unused NEAR returns.</small></p>}<p className="v2-small-note">Receive {coins((purse - withdrawalBurn).toString())} NHC{withdrawalBurn > 0n && <small className="v2-withdraw-burn">{coins(withdrawalBurn.toString())} NHC burned · 0.5%</small>}</p><button className="v2-primary" disabled={busy} onClick={() => void run('withdraw')}>{busy ? 'Sending…' : 'Withdraw to wallet'}</button>{purse >= 250000000n && <button className="v2-text-button" disabled={busy} onClick={() => hatch('purse')}>Hatch another · 250 NHC</button>}</> : <button className="v2-primary" onClick={() => go('home')}>Visit home</button>}</>;
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
  else if (screen === 'networks') body = <NetworkPicker networks={availableNetworks} currentId={network?.id} disabled={busy || !!walletOperation.current || !!pendingRef.current?.intent} loading={discovery === 'loading'} discoveryFailed={discovery === 'failed'} onRetry={onRetryDiscovery} onSelect={chooseWorld}/>;
  else if (screen === 'wallet') body = <>
    {networkCard()}
    {walletIntent !== 'connect' && <span className="v2-wallet-purpose">{walletIntent === 'hatch-connect' ? 'Connect to hatch' : walletIntent === 'verify' ? 'Sign-in · no fee' : walletIntent === 'mint' || walletIntent === 'approve' ? `Hatch ${name.trim() || 'your rooster'}` : walletIntent === 'withdraw' ? 'NHC to your wallet' : walletIntent === 'day' ? 'Start the next day' : walletIntent === 'expire' ? 'Close this expired day' : pending?.kind === 'mint' || pending?.kind === 'approve' ? 'Finish hatching' : 'Open your day'}</span>}
    {wallets.length ? <><div className="v2-wallet-choices">{visibleWallets.map(w => <button className="v2-wallet-choice" disabled={busy} key={w.id} onClick={() => void attach(w, walletIntent)}><Icon name="wallet" size={16}/><span>{busy ? 'Opening wallet…' : w.name}</span><i className="v2-network-chevron" aria-hidden="true"/></button>)}</div>{isNearWorld(config) && meteor && wallets.length > 1 && !moreWallets && <button className="v2-text-button" disabled={busy} onClick={() => setMoreWallets(true)}>Other NEAR wallets</button>}</> : <><p>{isNearWorld(config) ? 'Open Meteor to bring a life home.' : 'Open this game in your wallet’s browser to bring a life home.'}</p><a className="v2-primary" href={isNearWorld(config) ? 'https://wallet.meteorwallet.app/' : 'https://metamask.io/download/'} target="_blank" rel="noreferrer">{isNearWorld(config) ? 'Open Meteor' : 'Get a wallet'}</a>{isNearWorld(config) && <button className="v2-text-button" onClick={() => location.reload()}>Try wallet connection again</button>}</>}
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
    <nav className="v2-menu-site-links" aria-label="Website and player guide">
      <a className="v2-text-button" href="/" target="_blank" rel="noopener noreferrer">Website ↗</a>
      <a className="v2-text-button" href="/docs" target="_blank" rel="noopener noreferrer">Player guide ↗</a>
    </nav>
  </>;

  const handoffTitle = walletOpening?.phase === 'signin' ? 'Verify your wallet' : 'Ready to confirm';
  const handoffLabel = /meteor/i.test(wallet.current?.walletName || '') ? 'Open Meteor' : 'Open wallet';
  const handoffPurpose = walletOpening?.phase === 'signin' ? 'Sign-in only. No fee.' : pending?.kind === 'mint' ? `Hatch ${pending.birthDraft?.name || name}` : pending?.kind === 'withdraw' ? 'Take NHC home' : pending?.kind === 'expire' ? 'Close this expired day' : `Start day ${(life?.state.day || 0) + 1}`;
  const handoff = walletOpening && <div className="v2-wallet-handoff"><ProcessGraphic stage="wallet"/><p className="v2-pending-status">{handoffPurpose}</p>{walletOpening.phase !== 'signin' && pending?.intent && isNearIntent(pending.intent) && <span className="v2-fee-note">{pending.intent.method.startsWith('birth_') ? '250 NHC + ' : ''}{eth(pending.intent.deposit)} NEAR · network fee applies</span>}{pending?.uncertain && <span className="v2-small-note">Original request, unchanged.</span>}<button className="v2-primary" onClick={walletOpening.open}>{handoffLabel}</button></div>;
  return <div ref={root} className={`v2-journey${opening !== 'closed' ? ' is-booting' : ''}`}>
    {!entryScenery && (stageLife || stagePacket) ? <V2Player
      key={`${stageLife ? worldKey(stageLife) : ''}:${stageLife?.id}:${stagePacket?.requestId || stageLife?.revision}:${example ? 'example' : 'home'}`}
      packet={stagePacket} life={stageLife} example={example} onEndExample={example ? endExample : undefined}
      autoPlay={!example && !!playRequest && playRequest === stagePacket?.requestId}
      homeFirst={!example && !!owner && !historical && readingDay === undefined && (!freshDay || freshDay !== stagePacket?.requestId)}
      suspended={overlayOpen || opening !== 'closed'} opening={opening}
      onMenu={example ? undefined : () => overlay('menu')} onProfile={example ? undefined : () => overlay('profile')}
      onExit={example ? endExample : historyControls ? () => void showHistory() : exactId ? () => overlay('profile') : undefined}
      onPrepare={!example && owner && !historical && (config?.admissionsEnabled !== false || !!readyJob || !!life?.pendingRequest) ? prepare : undefined}
      prepareLabel={readyJob ? 'Watch new day' : life?.pendingRequest ? 'Open day ' + (life.state.day + 1) : life?.state.day === 0 ? 'Prepare day 1' : undefined}
      onHatch={example || !owner ? () => hatch() : !life?.state.alive ? () => hatch(purse >= 250000000n ? 'purse' : 'native') : undefined}
      hatchLabel={owner ? 'Hatch another' : undefined}
      onPurse={!example && owner ? () => overlay('purse') : undefined}
      onLatest={!example && historical && historyControls && life ? () => void loadLife(life.id, world) : undefined}
    /> : <TitleScenery opening={opening}/>}
    {overlayOpen && <div className={`v2-sheet-backdrop v2-sheet-${screen}`}><section className="v2-sheet v2-pixel-frame" role="dialog" aria-modal="true" aria-label={walletOpening ? handoffTitle : title[screen]}><header><h1>{walletOpening ? handoffTitle : title[screen]}</h1>{screen !== 'menu' && <LifeSoundButton className="v2-sheet-sound"/>}{screen !== 'welcome' && <button className="v2-icon-button" disabled={walletBusy && !walletOpening} onClick={() => walletOpening ? walletOpening.cancel() : screen === 'pending' ? go(owner ? 'home' : 'welcome') : screen === 'birth' ? go(birth && life?.id === birth.id && currentWorld ? 'home' : 'pending') : close()} aria-label={nestedSheet ? backLabel : 'Close'}><Icon name={nestedSheet ? 'back' : 'close'} size={16}/></button>}</header><div className="v2-sheet-body" ref={sheetBody} onScroll={event => { if (screen === 'history') { const cached = historyCache.current.get(historyKey); if (cached) cached.scroll = event.currentTarget.scrollTop; } else sheetScroll.current.set(`${historyKey}:${screen}`, event.currentTarget.scrollTop); }}>{handoff || body}{message && <><p className="v2-inline-error" role="alert">{message}</p>{errorCode === 'funds' && <a className="v2-text-button" href={isNearWorld(config) ? 'https://near-faucet.io/' : 'https://faucet.testnet.chain.robinhood.com/'} target="_blank" rel="noreferrer">Get test {isNearWorld(config) ? 'NEAR' : 'ETH'}</a>}</>}</div></section></div>}
    {screen === 'home' && message && <button className="v2-toast" onClick={() => overlay('profile')}>{message}</button>}
    {opening !== 'closed' && <CartridgeOpening phase={opening} onStart={startOpening}><LifeSoundButton className="v2-title-sound"/></CartridgeOpening>}
  </div>;
}
