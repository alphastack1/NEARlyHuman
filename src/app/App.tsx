import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject, type UIEvent } from 'react';
import { formatEther, getAddress, type Address, type EIP1193Provider, type Hex } from 'viem';
import { createPortal } from 'react-dom';
import { ITEM_CATALOG, ITEM_IDS, PHASES, cloneState, conditionLabel, createInitialState, normalizeName, type GameState, type ItemId, type Receipt, type Stats, type TargetId, type DayResult } from '../domain';
import { createWorldRenderer, itemImageUrl, roosterImageUrl, TARGET_LABELS, type WorldController, type HouseRoom } from '../game';
import { acceptedRequest, createChainReader, createOwnerWallet, explorerTransaction, permitFromJSON, type CollectionConfig } from '../chain/client';
import { api, ApiError, setSession, type JobView, type PublicConfig, type QuoteView, type Rooster, type SavedOutcome, type CompactHistoryEntry, type SavedDay, type SavedDaysPage } from './api';
import { Icon } from './Icons';
import { SavedStatus } from './SavedStatus';
import { describeCompactAction } from './compactHistory';
import { SavedDaysPanel } from './SavedDaysPanel';
import { HouseDetails } from './HouseDetails';
import { HouseExplorer } from './HouseExplorer';
import { WelcomeDock } from './WelcomeDock';
import { DayFocusBadge, DayPlanDetails } from './DayFocus';
import { DayLog } from './DayLog';
import { CartridgeOpening, type CartridgePhase } from './CartridgeOpening';
import { openingVisitorState, OPENING_START_TARGET } from './openingIdentity';
import { PREVIEW_DAY_URL } from './previewData';
import { showSupplyTransfer } from './supplyTransfer';
import { beforeActionBeat, afterActionBeat } from '../game/recorded-events';
import { NEED_ICONS, NEED_KEYS, dayHighlights, recordedChanges, signedNeed, type Need } from './receiptFeedback';
type Screen = 'entry' | 'discover' | 'visit' | 'mint' | 'care' | 'processing' | 'ready' | 'replay' | 'summary' | 'memorial' | 'trial' | 'firstRetry';
interface GuestDay { rooster:Rooster; result:DayResult;source?:{chainId:number;collection:string} }
interface FreshDayIntent { account:string;tokenId:string;requestId:string;readyDay?:number }
const isFilm=(mode:Screen)=>mode==='replay'||mode==='discover';
type ModalContent = {
    kind: 'options' | 'help' | 'selector' | 'status' | 'fee' | 'details' | 'wallet' | 'birth' | 'history' | 'owner' | 'supplies' | 'savedDays';
} | {
    kind: 'item';
    item: ItemId;
} | {
    kind: 'object';
    target: TargetId;
    state: GameState;
} | {
    kind: 'brain';
    choice?: Receipt['choice'];
    receipt?: Receipt;
    preparing: boolean;
    planPacket?:DayResult;planIndex?:number;atImpact?:boolean;
} | {kind:'dayPlan';packet:DayResult;index:number;atImpact:boolean} | {kind:'compactHistory';entries:CompactHistoryEntry[];day:number};
interface ReadingView { tokenId?: string; revision?: number; state?: GameState; readingDay?:number; delivery: ItemId[]; screen: Screen }
type Modal = ModalContent & { view?: ReadingView };
interface MenuFrame { modal: Modal; invoker?: string; scroll: number }
interface PlaybackReturn { tokenId:string;screen:Screen;result?:DayResult;compact?:SavedOutcome;delivery:ItemId[];page:number;modal:Modal;trail:MenuFrame[];scroll:number;latestDay:number; }
type WalletProvider = EIP1193Provider & {
    on?: (name: string, fn: (data: any) => void) => void;
    removeListener?: (name: string, fn: (data: any) => void) => void;
};
type WalletEntry = {
    id: string;
    name: string;
    provider: WalletProvider;
};
type Submitted = {
    originalHash?: Hex;
    replacementReason?: 'repriced' | 'cancelled' | 'replaced';
    hash?: Hex;
    permitId?: Hex;
    expiresAt?: number;
    fromBlock?: string;
    operation: 'mint' | 'day' | 'release';
    tokenId?: string;
    chainId?: number;
    account?: string;
};
const initialStats: Stats = { body: 2, wits: 2, spirit: 1 };
const OPENING_SEEN='nh:opening:v1';
function firstOpening():boolean {
    const query=new URLSearchParams(location.search);
    if(query.has('rooster'))return false;
    let returningOwner=false;
    try {
        for(let index=0;index<localStorage.length;index++){
            const key=localStorage.key(index);
            if(!key||!/^nh:(selected|submitted):/.test(key))continue;
            let value:any;try{value=JSON.parse(localStorage.getItem(key)||'null');}catch{continue;}
            if(key.startsWith('nh:submitted:')&&[value?.hash,value?.permitId].some(id=>typeof id==='string'&&/^0x[0-9a-f]{64}$/i.test(id)))return false;
            if(key.startsWith('nh:selected:')&&typeof value==='string'&&!!value)returningOwner=true;
        }
    }catch{/* A fresh title screen also works when browser storage is unavailable. */}
    if(query.get('intro')==='1')return true;
    try{if(sessionStorage.getItem(OPENING_SEEN))return false;}catch{}
    return !returningOwner;
}
function clearOpeningRequest(){
    const url=new URL(location.href);
    if(!url.searchParams.has('intro'))return;
    url.searchParams.delete('intro');history.replaceState(history.state,'',url.pathname+url.search+url.hash);
}
const labels: Record<keyof GameState['needs'], string> = { health: 'Health', nutrition: 'Nutrition', hydration: 'Hydration', energy: 'Energy', morale: 'Morale' };
const needIcons = NEED_ICONS;
const deathNames:Record<NonNullable<GameState['deathCause']>,string>={health:'Health depleted',starvation:'Food deficit',dehydration:'Water deficit',wound:'Serious wound',illness:'Illness',infection:'Infection',structural:'House accident'};
const needs = Object.keys(labels) as Array<keyof GameState['needs']>;
const asTime = (n: number) => n < 1e12 ? n * 1000 : n;
const store = { get<T>(k: string, f: T): T { try {
        return JSON.parse(localStorage.getItem(k) || 'null') ?? f;
    }
    catch {
        return f;
    } }, set(k: string, v: unknown) { try {
        localStorage.setItem(k, JSON.stringify(v));
    }
    catch { } } };
class PlayerMessage extends Error {}
function humanError(error: unknown): string { if(error instanceof PlayerMessage)return error.message; const e = error as any; const msg = String(e?.shortMessage || e?.message || ''); if (e?.code === 4001 || /rejected|denied|declined/i.test(msg))
    return 'Not approved. Your choices are kept.'; if (/insufficient funds|exceeds the balance/i.test(msg))
    return 'Not enough ETH for this request.'; if (/Transaction was not accepted/i.test(msg))
    return 'That transaction failed. You can try again.'; if (/expired/i.test(msg))
    return 'The estimate expired. Please try again.'; if (/already pending|locked/i.test(msg))
    return 'This rooster already has a day preparing.'; if (error instanceof ApiError)
    return error.message; return 'Connection interrupted. Please try again.'; }
function fee(value?: string): string { if (!value)
    return ''; try {
    const amount = Number(formatEther(BigInt(value)));
    if (amount === 0)
        return '0 ETH';
    if (amount < 1e-9)
        return '<0.000000001 ETH';
    return (amount < .000001 ? amount.toFixed(9) : amount < .001 ? amount.toFixed(6) : amount.toFixed(4)).replace(/0+$/, '').replace(/\.$/, '') + ' ETH';
}
catch {
    return '';
} }
function short(value: string): string { return value.slice(0, 6) + '…' + value.slice(-4); }
function expiryText(day: number) { return 'By day ' + day + ' bedtime'; }
const catalog = (id: ItemId) => ITEM_CATALOG.find(x => x.id === id)!;
const PanelContext = createContext<{
    error: string;
    body: RefObject<HTMLDivElement | null>;
    onScroll: (e: UIEvent<HTMLDivElement>) => void;
}>({ error: '', body: { current: null }, onScroll: () => { } });
function FitText({ children, min = 9 }: {
    children: string;
    min?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => { const node = ref.current; if (!node)
        return; let frame = 0; const fit = () => { node.style.fontSize = ''; node.style.whiteSpace = 'nowrap'; const natural = parseFloat(getComputedStyle(node).fontSize); const ratio = Math.min(1, node.clientWidth / Math.max(1, node.scrollWidth)); node.style.fontSize = Math.max(min, natural * ratio) + 'px'; if (natural * ratio < min)
        node.style.whiteSpace = 'normal'; }; fit(); const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }); observer.observe(node.parentElement!); void document.fonts.ready.then(fit); return () => { observer.disconnect(); cancelAnimationFrame(frame); }; }, [children, min]);
    return <span className="fit-text" ref={ref}>{children}</span>;
}
function Panel({ title, children, footer, kind = 'compact', back, accessory }: {
    title?: string;
    children?: ReactNode;
    footer?: ReactNode;
    kind?: string;
    back?: () => void;
    accessory?: ReactNode;
}) {
    const { error, body, onScroll } = useContext(PanelContext);
    const localBody = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => { if (localBody.current && !localBody.current.closest('[inert]'))
        body.current = localBody.current; });
    return <section className={'panel panel-' + kind} aria-label={title}><header className="panel-head">{back && <button className="icon-button back-button" aria-label="Back" onClick={back}><Icon name="back"/></button>}{title && <h1 className="panel-title" tabIndex={-1}>{title}</h1>}{accessory}</header><div className="panel-body" ref={localBody} onScroll={onScroll}>{children}{error && <p className="error-message" role="alert">{error}</p>}</div>{footer && <footer className="panel-footer">{footer}</footer>}</section>;
}
function RecordedEffect({receipt}:{receipt:Receipt}) {
    const changes=recordedChanges(receipt);
    return <div className="recorded-result"><p className="recorded-target">{TARGET_LABELS[receipt.target]||'Home'}</p>{changes.length>0&&<div className="recorded-changes">{changes.map(change=><span className={'recorded-change '+change.tone} key={change.key} aria-label={change.label} title={change.label}>{change.item?<img src={itemImageUrl(change.item)} alt=""/>:change.icon?<Icon name={change.icon}/>:null}<span>{change.text}</span></span>)}</div>}</div>;
}
function RecordedEventLine({message,kind}:{message:string;kind:string}){
    return <p className="recorded-event-line"><Icon name={kind==='delivery'?'mail':kind==='weather'?'water':kind==='growth'||kind==='garden'?'leaf':'book'} size={14}/><span>{message}</span></p>;
}
function RecordedStory({receipt}:{receipt:Receipt}){
    const before=beforeActionBeat(receipt),after=afterActionBeat(receipt);
    return <>{before&&<RecordedEventLine message={before.event.message} kind={before.event.kind}/>}<p className="recorded-effect">{receipt.lines.join(' ')}</p>{after&&<RecordedEventLine message={after.event.message} kind={after.event.kind}/>} {receipt.events.filter(event=>event.kind==='delivery'&&event.source==='estate'&&event!==before?.event&&event!==after?.event).map((event,index)=><RecordedEventLine message={event.message} kind={event.kind} key={index}/>)}<RecordedEffect receipt={receipt}/></>;
}
export default function App() {
    const host = useRef<HTMLDivElement>(null), world = useRef<WorldController | undefined>(undefined);
    const [opening,setOpening]=useState<CartridgePhase>(()=>firstOpening()?'assembling':'closed');
    const openingPhase=useRef(opening),openingStarted=useRef(false);openingPhase.current=opening;
    const [config, setConfig] = useState<PublicConfig>(), [screen, setScreen] = useState<Screen>('entry'), [modal, setModal] = useState<Modal | null>(null);
    const [wallets, setWallets] = useState<WalletEntry[]>([]), [provider, setProvider] = useState<WalletProvider>(), [account, setAccount] = useState<Address>(), [network, setNetwork] = useState<number>();
    const [owned, setOwned] = useState<Rooster[]>([]), [selected, setSelected] = useState<Rooster>(), [hud, setHud] = useState<GameState>(), [result, setResult] = useState<DayResult>(), [job, setJob] = useState<JobView>(), [jobId, setJobId] = useState<string>();
    const [name, setName] = useState(''), [stats, setStats] = useState<Stats>(initialStats), [delivery, setDelivery] = useState<ItemId[]>([]), [page, setPage] = useState(0), [quote, setQuote] = useState<QuoteView>();
    const [busy, setBusy] = useState(false), [busyLabel, setBusyLabel] = useState(''), [errorNotice, setErrorNotice] = useState<{message:string;navigation:number}>(), [submitted, setSubmitted] = useState<Submitted>(), [ownerLost, setOwnerLost] = useState(false), [packetMissing, setPacketMissing] = useState(false);
    const [lines, setLines] = useState<[
        string,
        string
    ]>(['', '']), [receipt, setReceipt] = useState<Receipt>(), [replayIndex, setReplayIndex] = useState(0), [paused, setPaused] = useState(false), [muted, setMuted] = useState(() => store.get('nh:sound', false)), [tokenSearch, setTokenSearch] = useState(''), [expiryAvailable, setExpiryAvailable] = useState(false);
    const [lastAttempt, setLastAttempt] = useState<Submitted>();
 const [compactOutcome,setCompactOutcome]=useState<SavedOutcome>();
 const [historicalDay,setHistoricalDay]=useState<number>();
    const [replayLoading,setReplayLoading]=useState(false);
 const [detailDay,setDetailDay]=useState<SavedDay>();
 const [ownershipRead,setOwnershipRead]=useState<'unknown'|'loading'|'ready'|'error'>('unknown');
    const [canonicalStale,setCanonicalStale]=useState(false);
    const [catalogSize,setCatalogSize]=useState(()=>window.innerWidth<360?4:5);
    const [meterCue,setMeterCue]=useState<{sequence:number;changes:Partial<Record<Need,number>>}>();
    const [houseView,setHouseView]=useState<{exploring:boolean;room?:HouseRoom}>({exploring:false});
    const [roomsOpen,setRoomsOpen]=useState(false);
    const [logGroups,setLogGroups]=useState<Record<string,boolean>>({});
    const [housePeek,setHousePeek]=useState<TargetId>();
    const [traveling,setTraveling]=useState(false);
    const [guest,setGuest]=useState<GuestDay>();
    const guestRef=useRef<GuestDay|undefined>(undefined),guestRequest=useRef(0),guestPlaybackTicket=useRef(0),connectionIntent=useRef<'mint'|'home'>('home'),freshDay=useRef<FreshDayIntent|undefined>(undefined);
    const [traitsOpen,setTraitsOpen]=useState(false);
    const supplyFlight=useRef<(()=>void)|undefined>(undefined);
    const playbackPacket=useRef<DayResult|undefined>(undefined),snapshotCursor=useRef<{packet:DayResult|undefined;index:number;state:GameState}|undefined>(undefined),cueSequence=useRef(0);
    const catalogSizeRef=useRef(catalogSize);
    const [choiceNotice, setChoiceNotice] = useState(false), [ownedLoading, setOwnedLoading] = useState(false);
    const session = useRef<{
        account: string;
        chain: number;
        token: string;
        expires: number;
    } | undefined>(undefined), context = useRef({ screen, selected, result, job, receipt, config, account, modal, hud, provider, network, name, stats, delivery }), panelScroll = useRef<HTMLDivElement>(null), returnFocus = useRef<HTMLElement | null>(null), scrollMemory = useRef<Record<string, number>>({});
    context.current = { screen, selected, result, job, receipt, config, account, modal, hud, provider, network, name, stats, delivery };
    const menuTrail=useRef<MenuFrame[]>([]),menuOrigin=useRef<{tokenId?:string;invoker?:string}>({}),navigationGeneration=useRef(0),walletGeneration=useRef(0),openRef=useRef<((modal:Modal)=>void)|undefined>(undefined);
    const modalInputBlocked=useRef(false),operationToken=useRef(0);
    const readTickets=useRef<Record<string,number>>({}),daysCache=useRef<Record<string,SavedDaysPage>>({}),archiveReturn=useRef<PlaybackReturn|undefined>(undefined),historyFocusDay=useRef<number|undefined>(undefined);
    const error=errorNotice?.navigation===navigationGeneration.current?errorNotice.message:'';
    const setError=(message:string)=>setErrorNotice(message?{message,navigation:navigationGeneration.current}:undefined);
    const beginReadScope=(channel:string,tokenId?:string,expectedPlayer?:Address)=>{
        const ticket=(readTickets.current[channel]||0)+1,navigation=navigationGeneration.current,player=expectedPlayer||context.current.account;
        readTickets.current[channel]=ticket;setError('');
        return()=>readTickets.current[channel]===ticket&&navigationGeneration.current===navigation&&context.current.account===player&&(!tokenId||context.current.selected?.id===tokenId);
    };
    const canInspect=(mode:Screen)=>['care','replay','discover','visit','summary','memorial','trial','ready','firstRetry'].includes(mode);
    const cfg: CollectionConfig | undefined = config ? { chainId: config.chainId as 46630 | 4663, address: config.collection as Address, rpcUrl: config.rpcUrl } : undefined;
    const active = !!selected && !ownerLost && !!account && selected.owner.toLowerCase() === account.toLowerCase();
    const eligible = active && selected.state.alive && !selected.pending && !(config?.testnet && selected.state.day >= 3);
    const homeVisit=screen==='care'&&!!config?.testnet&&!!selected?.state.alive&&selected.state.day>=3;
    const scope = (id = selected?.id) => `nh:${context.current.config?.chainId}:${context.current.account?.toLowerCase()}:${id}`;
    const submittedKey = (tx?: Submitted) => 'nh:submitted:' + (tx?.chainId || context.current.config?.chainId) + ':' + (tx?.account || context.current.account)?.toLowerCase();
    const forgetTransaction=(tx:Submitted)=>{
        const same=(current:Submitted|undefined)=>!!current&&!!(tx.permitId&&current.permitId===tx.permitId||tx.hash&&current.hash===tx.hash);
        if(same(store.get<Submitted|undefined>(submittedKey(tx),undefined)))store.set(submittedKey(tx),null);
        setSubmitted(current=>same(current)?undefined:current);setLastAttempt(tx);
    };
    const watched = (r: Rooster) => store.get(scope(r.id) + ':watched', 0) >= r.latestDay;
    const focusName=(element:Element|null)=>element?.getAttribute('aria-label')||element?.textContent?.trim()||undefined;
    const open=(m:Modal)=>{
        const c=context.current;
        supplyFlight.current?.();
        if(m.kind!=='birth')freshDay.current=undefined;
        setMeterCue(undefined);
        modalInputBlocked.current=true;
        world.current?.setInputEnabled(false);
        if(c.modal)menuTrail.current.push({modal:c.modal,invoker:focusName(document.activeElement),scroll:panelScroll.current?.scrollTop||0});
        else{menuTrail.current=[];returnFocus.current=document.activeElement as HTMLElement;menuOrigin.current={tokenId:c.selected?.id,invoker:focusName(document.activeElement)};}
        const visiting=c.screen==='discover'||c.screen==='visit',state=isFilm(c.screen)?c.hud:visiting?guestRef.current?.rooster.state:c.selected?.state;
        const view=m.view||c.modal?.view||{tokenId:visiting?guestRef.current?.rooster.id:c.selected?.id,revision:visiting?undefined:c.selected?.revision,state:state?cloneState(state):undefined,readingDay:isFilm(c.screen)?c.result?.day:state?.day,delivery:c.screen==='care'?[...delivery]:[],screen:c.screen};
        world.current?.pause();if(isFilm(c.screen))setPaused(true);setModal({...m,view});setError('');
    };
    openRef.current=open;
    const close=()=>{
        const frame=menuTrail.current.pop();setModal(frame?.modal||null);
        requestAnimationFrame(()=>{
            const c=context.current,sameToken=menuOrigin.current.tokenId===c.selected?.id,targetName=frame?.invoker||menuOrigin.current.invoker;
            const root=frame?document.querySelector('.composition-modal'):document.querySelector('.game-composition');
            const matching=[...root?.querySelectorAll<HTMLElement>('button,a,input')||[]].find(el=>!el.closest('[inert]')&&!el.hasAttribute('disabled')&&focusName(el)===targetName);
            if(matching&&sameToken)matching.focus({preventScroll:true});else(root?.querySelector('.panel-title') as HTMLElement|null)?.focus({preventScroll:true});
            if(panelScroll.current)panelScroll.current.scrollTop=frame?.scroll??scrollMemory.current[c.screen+':'+c.selected?.id]??0;
        });
    };
    useEffect(()=>{
        if(!modal)return;
        const id=requestAnimationFrame(()=>{(document.querySelector('.composition-modal .panel-title') as HTMLElement|null)?.focus({preventScroll:true});if(modal.kind==='brain')document.querySelector('.composition-modal .choice-row.picked')?.scrollIntoView({block:'nearest'});});
        const keyboard=(event:KeyboardEvent)=>{
            if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;
            const targets=[...document.querySelectorAll<HTMLElement>('.composition-modal button:not(:disabled),.composition-modal input,.composition-modal a[href]')].filter(el=>el.getClientRects().length),first=targets[0],last=targets.at(-1);
            if(event.shiftKey&&(document.activeElement===first||!targets.includes(document.activeElement as HTMLElement))){event.preventDefault();last?.focus();}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        };
        document.addEventListener('keydown',keyboard);return()=>{cancelAnimationFrame(id);document.removeEventListener('keydown',keyboard);};
    },[modal]);
    useEffect(()=>{const enabled=opening==='closed'&&!modal&&canInspect(screen);modalInputBlocked.current=!enabled;world.current?.setInputEnabled(enabled);},[modal,screen,selected?.id,opening]);
    useEffect(()=>{if(modal||!isFilm(screen))setMeterCue(undefined);},[modal,screen]);
    useEffect(()=>{supplyFlight.current?.();world.current?.setExploreEnabled(screen==='care'&&!!selected?.state.alive||screen==='visit'&&!!guest?.rooster.state.alive);setHousePeek(undefined);setRoomsOpen(false);if(!isFilm(screen))setTraveling(false);},[screen,selected?.id,selected?.revision,guest?.rooster.id]);
    useEffect(()=>()=>supplyFlight.current?.(),[]);
    useEffect(()=>{
        const intent=freshDay.current;if(!intent?.readyDay||screen!=='ready'||!result||result.day!==intent.readyDay)return;
        if(document.hidden||account?.toLowerCase()!==intent.account||selected?.id!==intent.tokenId||network!==config?.chainId){freshDay.current=undefined;return;}
        if(modal){if(modal.kind!=='birth')freshDay.current=undefined;return;}
        if(busy)return;
        const packet=result,generation=navigationGeneration.current,revision=selected?.revision,chain=config?.chainId,collection=config?.collection;
        // Let this Ready commit's saved-house effects finish before starting its film.
        const frame=requestAnimationFrame(()=>{
            const c=context.current;if(freshDay.current!==intent)return;
            const valid=!document.hidden&&navigationGeneration.current===generation&&c.screen==='ready'&&!c.modal
                &&c.account?.toLowerCase()===intent.account&&c.selected?.id===intent.tokenId&&c.selected.owner.toLowerCase()===intent.account
                &&c.selected.revision===revision&&c.selected.latestDay===intent.readyDay&&!c.selected.pending
                &&c.job?.requestId===intent.requestId&&c.job.phase==='ready'&&c.result===packet&&packet.day===intent.readyDay
                &&c.network===chain&&c.config?.chainId===chain&&c.config?.collection===collection;
            if(!valid){freshDay.current=undefined;return;}
            freshDay.current=undefined;startPlayback(0);
        });
        return()=>cancelAnimationFrame(frame);
    },[screen,result,modal,busy,selected?.id,selected?.revision,account,network,config?.chainId,config?.collection]);
    useEffect(()=>{const hidden=()=>{if(document.hidden)freshDay.current=undefined;};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
    useEffect(()=>{if(!housePeek)return;const timer=window.setTimeout(()=>setHousePeek(undefined),9000);return()=>window.clearTimeout(timer);},[housePeek]);
    useEffect(()=>{if(!meterCue)return;const timer=window.setTimeout(()=>setMeterCue(undefined),900);return()=>window.clearTimeout(timer);},[meterCue]);
    const clearQuote = () => setQuote(undefined);
    useEffect(()=>{
        const row=document.querySelector<HTMLElement>('.catalog-row');if(!row)return;
        const resize=()=>{const gap=parseFloat(getComputedStyle(row).columnGap)||5,available=row.clientWidth,next=Math.max(3,Math.min(5,Math.floor((available-44)/(44+gap)))),previous=catalogSizeRef.current;if(next!==previous){setPage(page=>Math.floor(page*previous/next));catalogSizeRef.current=next;setCatalogSize(next);}};
        resize();const observer=new ResizeObserver(resize);observer.observe(row);return()=>observer.disconnect();
    },[screen,selected?.id,ownerLost]);
    useEffect(() => { let alive = true; api.config().then(c => { if (alive) {
        setConfig(c);
        store.set('nh:config', c);
    } }).catch(e => { const cached = store.get<PublicConfig | undefined>('nh:config', undefined); if (cached)
        setConfig(cached);
    else
        setError(humanError(e)); }); return () => { alive = false; }; }, []);
    useEffect(()=>{
        if(screen!=='entry'||selected||guestRef.current)return;
        const ticket=++guestRequest.current,request=new AbortController();
        void fetch(PREVIEW_DAY_URL,{signal:request.signal}).then(async response=>{if(!response.ok)throw Error('Visit unavailable');return await response.json() as GuestDay;}).then(packet=>{
            if(ticket!==guestRequest.current)return;
            if(!packet.rooster?.id||!packet.result?.receipts?.length)throw Error('Visit unavailable');
            const visit={...packet,rooster:{...packet.rooster,state:packet.result.finalState,latestDay:packet.result.day}};guestRef.current=visit;setGuest(visit);
        }).catch(()=>{/* The ownership and hatch paths remain available while the public film rests. */});
        return()=>{guestRequest.current++;request.abort();};
    },[screen,selected?.id]);
    useEffect(()=>{if(opening==='closed'&&screen==='entry'&&guest&&!selected&&!modal&&!busy&&ownershipRead!=='loading')startGuestDay();},[screen,guest,selected?.id,modal,busy,ownershipRead,opening]);
    useEffect(() => {
        const injected = (window as any).ethereum as WalletProvider | undefined;
        if (injected)
            setWallets([{ id: 'injected', name: 'Installed wallet', provider: injected }]);
        const announce = (e: Event) => { const detail = (e as CustomEvent).detail; if (!detail?.provider?.request)
            return;setWallets(all=>{const announced=all.filter(wallet=>wallet.id!=='injected'),id=detail.info?.uuid||'wallet-'+announced.length;if(announced.some(wallet=>wallet.id===id||wallet.provider===detail.provider))return announced;return [...announced,{id,name:detail.info?.name||'Wallet',provider:detail.provider}];}); };
        window.addEventListener('eip6963:announceProvider', announce);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        return () => window.removeEventListener('eip6963:announceProvider', announce);
    }, []);
    useEffect(() => {
        if (!host.current)
            return;
        const renderer = createWorldRenderer(host.current, { onOpeningPhase:phase=>{
            if(openingPhase.current==='closed')return;
            if(phase==='title'){if(openingPhase.current==='assembling'){openingPhase.current='title';setOpening('title');}}
            else{openingPhase.current='closed';setOpening('closed');try{sessionStorage.setItem(OPENING_SEEN,'1');}catch{}clearOpeningRequest();}
        },onReceipt: (r, i) => { setReceipt(r); setReplayIndex(i); const c = context.current; if (c.selected&&c.screen==='replay')
                store.set(`nh:${c.config?.chainId}:${c.account?.toLowerCase()}:${c.selected.id}:play:${r.day}`, i); }, onSnapshot: (s,index) => {
                const c=context.current,packet=playbackPacket.current,previous=snapshotCursor.current,impact=packet?.receipts[index]?.snapshot===s;
                if(isFilm(c.screen)&&!c.modal&&impact&&previous?.packet===packet&&previous.index===index&&previous.state!==s){
                    const changes:Partial<Record<Need,number>>={};for(const need of NEED_KEYS){const delta=s.needs[need]-previous.state.needs[need];if(delta)changes[need]=delta;}
                    if(Object.keys(changes).length)setMeterCue({sequence:++cueSequence.current,changes});
                }
                snapshotCursor.current={packet,index,state:s};setHud(s);
            }, onMessage: setLines, onComplete: () => { const c=context.current;if(c.screen==='discover'){setPaused(false);setScreen('visit');return;}if(archiveReturn.current){returnFromArchive();return;}setPaused(false); const r = c.selected; if (r) {
                store.set(`nh:${c.config?.chainId}:${c.account?.toLowerCase()}:${r.id}:watched`, r.latestDay);
                store.set(`nh:${c.config?.chainId}:${c.account?.toLowerCase()}:${r.id}:play:${c.result?.day || r.latestDay}`, null);
                setHud(r.state);
                setScreen(!r.state.alive ? 'memorial' : c.config?.testnet && r.state.day >= 3 ? 'trial' : 'summary');
            } }, onViewChange: view=>setHouseView(previous=>previous.exploring===view.exploring&&previous.room===view.room?previous:view),onMotion: motion=>setTraveling(motion.traveling),onInspect: (target) => { const c = context.current; if(c.modal||modalInputBlocked.current||!canInspect(c.screen))return;const state = isFilm(c.screen)?c.hud:c.screen==='visit'?guestRef.current?.rooster.state:c.selected?.state; if (state) {
                if(c.screen==='care'||c.screen==='visit'){setHousePeek(target);return;}
                setPaused(isFilm(c.screen));
                openRef.current?.({ kind: 'object', target, state: cloneState(state) });
            } } });
        world.current = renderer;
        if(openingPhase.current!=='closed'){
            openingStarted.current=true;
            renderer.beginOpening(()=>{
                const first=guestRef.current?.result.receipts[0];
                return first?.decisionSnapshot||first?.before||openingVisitorState();
            },()=>guestRef.current?.result.startTarget||OPENING_START_TARGET);
            if(openingPhase.current==='leaving')renderer.finishOpening();
        }
        renderer.setMuted(muted);renderer.setInputEnabled(openingPhase.current==='closed'&&!context.current.modal&&canInspect(context.current.screen));
        return () => { renderer.dispose(); world.current = undefined; };
    }, []);
    // Renderer stays mounted. Saved-state changes are never pushed into an active film.
    useEffect(() => { if (opening!=='closed'||isFilm(screen))
        return;const state=screen==='visit'?guestRef.current?.rooster.state:selected?.state;if(!state)return;world.current?.showSave(state, { sleep: true }); setHud(state); }, [selected?.id, selected?.revision, screen,opening]);
    useLayoutEffect(()=>{
        const mount=host.current,frame=mount?.closest<HTMLElement>('.game-frame'),composition=frame?.closest<HTMLElement>('.game-composition');
        if(!frame||!composition)return;
        let raf=0,alive=true,lastTop=-1,lastBottom=-1,lastRight=-1;
        const targets=[...composition.querySelectorAll<HTMLElement>('.game-hud,.event-box,.welcome-wrap,.care-dock,.mint-dock')];
        const visible=(element:HTMLElement)=>{const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden';};
        const measure=()=>{
            if(!alive)return;
            const bounds=frame.getBoundingClientRect(),active=openingPhase.current==='closed';
            let top=0,bottom=0,right=0,dockHeight=0;
            const sideDock=active&&(parseFloat(getComputedStyle(composition).getPropertyValue('--side-dock-width'))||0)>0;
            const shown=active?targets.filter(visible):[];
            for(const element of shown){
                if(!element.matches('.game-hud'))continue;
                const rect=element.getBoundingClientRect();
                if(rect.width&&rect.height)top=Math.max(top,rect.bottom-bounds.top);
            }
            composition.style.setProperty('--hud-height',Math.ceil(top)+'px');
            for(const element of shown){
                if(!element.matches('.welcome-wrap,.care-dock,.mint-dock'))continue;
                dockHeight=Math.max(dockHeight,Math.ceil(element.getBoundingClientRect().height));
            }
            composition.style.setProperty('--dock-height',dockHeight+'px');
            // Publishing dock height moves the event box without resizing it.
            // Read positions afterward so a position-only change reaches the camera.
            top=0;
            for(const element of shown){
                const rect=element.getBoundingClientRect();
                if(!rect.width||!rect.height||rect.right<=bounds.left||rect.left>=bounds.right)continue;
                if(element.matches('.welcome-wrap,.care-dock,.mint-dock')){
                    if(sideDock){right=Math.max(right,bounds.right-rect.left+10);continue;}
                }
                if(element.matches('.game-hud'))top=Math.max(top,rect.bottom-bounds.top);
                else if(rect.bottom>bounds.top&&rect.top<bounds.bottom)bottom=Math.max(bottom,bounds.bottom-rect.top);
            }
            const t=Math.max(0,Math.ceil(top)),b=Math.max(0,Math.ceil(bottom)),r=Math.max(0,Math.ceil(right));
            if(t!==lastTop||b!==lastBottom||r!==lastRight){lastTop=t;lastBottom=b;lastRight=r;world.current?.setViewportInsets(t,b,0,r);}
        };
        const schedule=()=>{if(!alive)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(measure);};
        const observer=new ResizeObserver(schedule);observer.observe(frame);for(const element of targets)observer.observe(element);
        schedule();void document.fonts.ready.then(schedule);
        return()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();};
    },[opening,screen,modal,roomsOpen,housePeek,traitsOpen,guest?.rooster.id,selected?.id]);
    useEffect(() => { world.current?.setMuted(muted); store.set('nh:sound', muted); }, [muted]);
    useEffect(() => { if (!provider)
        return; const changed = (addresses: string[]) => { freshDay.current=undefined;operationToken.current++;setBusy(false);setBusyLabel('');walletGeneration.current++;navigationGeneration.current++;setOwnershipRead('unknown');setSession(''); session.current = undefined; setOwnerLost(false); setSelected(undefined); setOwned([]); setJobId(undefined); setResult(undefined); setSubmitted(undefined); setJob(undefined); setDelivery([]); setError('');if(!context.current.modal?.view){menuTrail.current=[];setModal(null);}setScreen('entry'); setQuote(undefined); if (addresses?.[0]) {
        const a = getAddress(addresses[0]);
        setAccount(a);
        void loadOwned(a);
    }
    else
        setAccount(undefined); }; const chainChanged = (chain: string) => { setNetwork(parseInt(chain, 16)); setSession(''); session.current = undefined; setQuote(undefined); world.current?.pause(); if (isFilm(context.current.screen))
        setPaused(true); }; provider.on?.('accountsChanged', changed); provider.on?.('chainChanged', chainChanged); return () => { provider.removeListener?.('accountsChanged', changed); provider.removeListener?.('chainChanged', chainChanged); }; }, [provider, config]);
    useEffect(()=>{
        const viewport=window.visualViewport;
        const update=()=>{const style=document.documentElement.style;style.setProperty('--visible-height',(viewport?.height||window.innerHeight)+'px');style.setProperty('--visible-width',(viewport?.width||document.documentElement.clientWidth)+'px');style.setProperty('--visible-top',(viewport?.offsetTop||0)+'px');style.setProperty('--visible-left',(viewport?.offsetLeft||0)+'px');};
        update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);
        return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
    },[]);
    useEffect(() => { if (!selected || screen !== 'care')
        return; store.set(scope() + ':kit', delivery); }, [delivery, selected?.id, screen]);
    useEffect(() => { if (!selected?.id)
        return; const url = new URL(location.href); url.searchParams.set('rooster', selected.id); history.replaceState(null, '', url); }, [selected?.id]);
    useEffect(() => { if (!selected?.id || !account)
        return; let stopped = false; const refresh = async () => { try {
        const r = (await api.rooster(selected.id)).rooster;
        if (stopped)
            return;
        const c = context.current;
        if (c.selected?.id !== r.id)
            return;
        if (r.owner.toLowerCase() !== account.toLowerCase()) { await reconcileToken(r.id,'This rooster has a new owner.',r);return; }
        if (c.screen !== 'replay' && !c.modal && !c.selected?.pending && r.revision !== c.selected?.revision)
            await reconcileToken(r.id,'The saved day changed. Review before preparing again.',r);
    }
    catch { /* The next deliberate action retries a fresh read. */ } }; window.addEventListener('focus', refresh); return () => { stopped = true; window.removeEventListener('focus', refresh); }; }, [selected?.id, account]);
    useEffect(() => { if (!jobId)
        return; const generation=navigationGeneration.current,player=account,token=selected?.id;const relevant=()=>generation===navigationGeneration.current&&context.current.account===player&&context.current.selected?.id===token;let disposed = false, timer: ReturnType<typeof setTimeout>; const poll = async () => { try {
        const j = await api.job(jobId);
        if (disposed||!relevant())
            return;
        setJob(j);
        if (context.current.modal?.kind === 'brain' && context.current.modal.preparing && j.slot !== context.current.job?.slot)
            setChoiceNotice(true);
        if(j.phase==='unaccepted'){
            if(j.retrySafe===true&&(j.operation==='mint'||j.operation==='day'))await restoreUnaccepted(j);
            else setScreen('processing');
        }
        else if (j.phase === 'ready' || j.phase === 'failed' || j.phase === 'expired') {
            if(j.phase!=='ready')freshDay.current=undefined;
            const r = (await api.rooster(j.tokenId)).rooster;
            if (disposed||!relevant())
                return;
            setSelected(r);
            setOwned(all => all.map(x => x.id === r.id ? r : x));
            if (j.phase === 'ready') {
                await loadReplay(r, true,j.requestId);
                setJobId(undefined);
            }
            else if (!r.pending) {
                setQuote(undefined);setJobId(undefined);
                setScreen(r.state.day === 0 ? 'firstRetry' : 'care');
                setError('That day did not prepare. Your last save is safe.');
            }
        }
        else if (j.phase !== 'checking')
            setScreen('processing');
    }
    catch (e) {
        if (!disposed&&relevant())
            setError(humanError(e));
    } if (!disposed&&relevant())
        timer = setTimeout(poll, 2500); }; void poll(); return () => { disposed = true; clearTimeout(timer); }; }, [jobId]);
    function terminalScreen(r: Rooster): Screen { return !r.state.alive ? 'memorial' : context.current.config?.testnet && r.state.day >= 3 ? 'trial' : r.state.day === 0 ? 'firstRetry' : 'care'; }
    async function restoreUnaccepted(recovered:JobView){
        if(recovered.phase!=='unaccepted'||recovered.retrySafe!==true||(recovered.operation!=='mint'&&recovered.operation!=='day'))return;
        const previous=context.current.selected,player=context.current.account,kit=[...context.current.delivery],savedPage=page;
        const generation=++navigationGeneration.current;operationToken.current++;setJobId(undefined);setBusy(false);setBusyLabel('');setQuote(undefined);
        const journal=store.get<Submitted|undefined>(submittedKey(),undefined);
        if(journal&&(journal.tokenId===recovered.tokenId||journal.operation==='mint'&&recovered.operation==='mint'))forgetTransaction(journal);
        if(recovered.operation==='mint'){
            setOwned(all=>all.filter(r=>r.id!==recovered.tokenId));setSelected(undefined);setResult(undefined);setCompactOutcome(undefined);setCanonicalStale(false);menuTrail.current=[];setModal(null);
            if(previous){setName(previous.state.name);setStats({...previous.state.stats});}
            setScreen('mint');setError('Request not confirmed. You can review and try again.');
        }else{
            try{const fresh=(await api.rooster(recovered.tokenId)).rooster;if(navigationGeneration.current!==generation||context.current.account!==player)return;await chooseRooster(fresh);setDelivery(kit);setPage(savedPage);if(fresh.owner.toLowerCase()!==player?.toLowerCase())setOwnerLost(true);setError('Request not confirmed. Review before trying again.');}
            catch{if(navigationGeneration.current===generation){setCanonicalStale(true);setError('The saved day needs checking. Please refresh.');}}
        }
    }
    async function loadOwned(address:Address,preferred?:string){
        const generation=++walletGeneration.current,readValid=beginReadScope('owned',undefined,address);setOwnedLoading(true);setOwnershipRead('loading');setBusyLabel('Finding roosters');
        const relevant=()=>generation===walletGeneration.current&&context.current.account?.toLowerCase()===address.toLowerCase()&&readValid();
        try{
            const all=(await api.roosters(address)).roosters,query=new URLSearchParams(location.search).get('rooster');
            if(query&&/^[1-9]\d{0,19}$/.test(query)&&!all.some(r=>r.id===query)){try{const linked=(await api.rooster(query)).rooster;if(linked.owner.toLowerCase()===address.toLowerCase())all.push(linked);}catch{}}
            if(!relevant())return;setResult(undefined);setReceipt(undefined);setOwned(all);setOwnershipRead('ready');
            const currentConfig=context.current.config;
            const r=all.find(r=>r.id===(preferred||query))||all.find(r=>r.id===store.get('nh:selected:'+currentConfig?.chainId,''))||all[0];
            const pending=store.get<Submitted|undefined>('nh:submitted:'+currentConfig?.chainId+':'+address.toLowerCase(),undefined);
            if(pending?.hash||pending?.permitId){setSelected(pending.tokenId?all.find(r=>r.id===pending.tokenId):undefined);setSubmitted(pending);setScreen('processing');void trackTransaction(pending);}
            else if(connectionIntent.current==='mint'){connectionIntent.current='home';setSelected(r);beginMint();}
            else if(r)await chooseRooster(r);else{setSelected(undefined);setScreen('entry');}
        }catch(e){if(relevant()){setOwnershipRead('error');setError(humanError(e));}}
        finally{if(generation===walletGeneration.current&&context.current.account?.toLowerCase()===address.toLowerCase())setOwnedLoading(false);}
    }
    async function chooseRooster(r: Rooster) { freshDay.current=undefined;archiveReturn.current=undefined;setHistoricalDay(undefined);setCanonicalStale(false);operationToken.current++;setBusy(false);setBusyLabel('');setCompactOutcome(undefined);navigationGeneration.current++;menuTrail.current=[];setJobId(undefined); setSelected(r); setOwnerLost(false); setResult(undefined); setPacketMissing(false); setJob(undefined); setModal(null); setQuote(undefined); setReceipt(undefined); setReplayIndex(0); setDelivery(r.state.day ? store.get<ItemId[]>(scope(r.id) + ':kit', []).filter((id, i, a) => ITEM_IDS.includes(id) && a.indexOf(id) === i && r.state.inventory[id] < 65535).slice(0, 3) : []); setPage(0); store.set('nh:selected:' + config?.chainId, r.id); if (r.pending) {
        setJobId(r.pending.id);
        setScreen('processing');
    }
    else if (r.latestDay && !watched(r)) {
        setScreen('ready');
        await loadReplay(r, false);
    }
    else {
        setScreen(terminalScreen(r));

    } }
    async function reconcileToken(id:string,notice:string,known?:Rooster){
        const generation=navigationGeneration.current,player=context.current.account,kit=[...context.current.delivery],catalogPage=page;
        setCanonicalStale(true);setQuote(undefined);
        try{
            const fresh=known||(await api.rooster(id)).rooster;
            if(generation!==navigationGeneration.current||context.current.account!==player||context.current.selected?.id!==id)return;
            const reading=context.current.modal,trail=[...menuTrail.current],selection=chooseRooster(fresh),chosenGeneration=navigationGeneration.current;
            if(reading){menuTrail.current=trail;setModal(reading);}
            await selection;if(navigationGeneration.current!==chosenGeneration||context.current.selected?.id!==fresh.id||context.current.account!==player)return;setDelivery(kit);setPage(catalogPage);setError(notice);
            if(fresh.owner.toLowerCase()!==player?.toLowerCase()){setOwned(all=>all.filter(r=>r.id!==fresh.id));setOwnerLost(true);setJobId(undefined);}
        }catch{if(generation===navigationGeneration.current&&context.current.account===player)setError('The saved day needs checking. Please refresh.');}
    }
    async function loadReplay(r: Rooster, forceReady: boolean,completedRequest?:string) { const generation=navigationGeneration.current,player=context.current.account,readValid=beginReadScope('replay',r.id);const relevant=()=>navigationGeneration.current===generation&&context.current.account===player&&context.current.selected?.id===r.id&&readValid();setReplayLoading(true);try {
        const packet = await api.replay(r.id, r.latestDay);if(!relevant())return;
        setResult(packet.result);
        setPacketMissing(false);
        const intent=freshDay.current,c=context.current;
        if(forceReady&&intent&&intent.tokenId===r.id&&intent.requestId===completedRequest&&intent.account===c.account?.toLowerCase()&&c.screen==='processing'&&!document.hidden&&(!c.modal||c.modal.kind==='birth'))intent.readyDay=packet.result.day;
        else if(intent)freshDay.current=undefined;
        setScreen(forceReady || !watched(r) ? 'ready' : terminalScreen(r));
    }
    catch {
        if(!relevant())return;setResult(undefined);
        setPacketMissing(true);
        setScreen('ready');
    }finally{if(relevant())setReplayLoading(false);} }
    async function connect(entry?: WalletEntry) { setError(''); if (!config) {
        try {
            setConfig(await api.config());
        }
        catch (e) {
            setError(humanError(e));
            return;
        }
    } const use = entry || wallets[0]; if (!use) {
        open({ kind: 'wallet' });
        return;
    } setBusy(true); setBusyLabel('Check your wallet'); try {
        const addresses = await use.provider.request({ method: 'eth_requestAccounts' }) as string[];
        if (!addresses[0])
            throw Error('No wallet selected');
        const a = getAddress(addresses[0]);
        const chain = parseInt(await use.provider.request({ method: 'eth_chainId' }) as string, 16);
        setProvider(use.provider);
        setAccount(a);
        setNetwork(chain);
        setModal(null);
        await new Promise(requestAnimationFrame);await loadOwned(a);
    }
    catch (e) {
        setError(humanError(e));
    }
    finally {
        setBusy(false);
        setBusyLabel('');
    } }
    function startGuestDay(){
        const visit=guestRef.current,renderer=world.current;if(openingPhase.current!=='closed'||!visit||!renderer)return;const ticket=++guestPlaybackTicket.current;
        void renderer.ready.then(()=>{const c=context.current;if(openingPhase.current!=='closed'||ticket!==guestPlaybackTicket.current||c.selected||c.modal||!['entry','discover','visit'].includes(c.screen))return;
            freshDay.current=undefined;archiveReturn.current=undefined;setHistoricalDay(undefined);playbackPacket.current=visit.result;snapshotCursor.current=undefined;setMeterCue(undefined);setResult(visit.result);setReceipt(undefined);setReplayIndex(0);setHud(visit.result.receipts[0]?.decisionSnapshot||visit.result.receipts[0]?.before||visit.result.finalState);setPaused(false);setModal(null);setScreen('discover');renderer.playDay(visit.result,{startIndex:0,skipDelivery:true});
        });
    }
    function startOpeningGame(){
        if(openingPhase.current==='closed'||openingPhase.current==='leaving')return;
        openingPhase.current='leaving';setOpening('leaving');
        try{sessionStorage.setItem(OPENING_SEEN,'1');}catch{}
        if(openingStarted.current)world.current?.finishOpening();
    }
    function enterHome(intent:'mint'|'home'){
        guestPlaybackTicket.current++;connectionIntent.current=intent;freshDay.current=undefined;world.current?.pause();if(isFilm(context.current.screen))setPaused(true);
        if(account&&ownershipRead==='ready'){
            connectionIntent.current='home';if(intent==='mint')beginMint();else void loadOwned(account);return;
        }
        if(wallets.length>1)open({kind:'wallet'});else void connect();
    }
    async function switchNetwork() { if (!provider || !cfg || !account)
        return; setBusy(true); try {
        await createOwnerWallet(provider, cfg, account).switchNetwork();
        setNetwork(config!.chainId);
        setError('');
    }
    catch (e) {
        setError(humanError(e));
    }
    finally {
        setBusy(false);
    } }
    async function authenticate() {
        const { account: a, provider: p, config: c, network: n } = context.current;
        if (!a || !p || !c)
            throw Error('Connect a wallet first');
        const collection: CollectionConfig = { chainId: c.chainId as 46630 | 4663, address: c.collection, rpcUrl: c.rpcUrl };
        if (n !== c.chainId) {
            await createOwnerWallet(p, collection, a).switchNetwork();
            setNetwork(c.chainId);
        }
        if (session.current?.account === a.toLowerCase() && session.current.chain === c.chainId && session.current.expires > Date.now() + 5000) {
            setSession(session.current.token);
            return;
        }
        setBusyLabel('Sign in · no payment');
        const challenge = await api.challenge(a);
        const signature = await createOwnerWallet(p, collection, a).client.signMessage({ message: challenge.message });
        const auth = await api.authenticate(a, challenge.id, signature);
        if (context.current.account?.toLowerCase() !== a.toLowerCase()||context.current.network!==c.chainId)throw new PlayerMessage('Your wallet changed. Review the new connection.');
        session.current = { account: a.toLowerCase(), chain: c.chainId, token: auth.token, expires: asTime(auth.expiresAt) };
        setSession(auth.token);
    }
    async function requestDay(mint = false) {
        if (busy || submitted)
            return;
        if (!provider || !account) {
            await connect();
            return;
        }
        const op=++operationToken.current;const player = account,startingGeneration=navigationGeneration.current,mintName=name,mintStats={...stats},selectedToken=selected?.id,selectedRevision=selected?.revision,selectedDelivery=delivery.join();
        const sameRequestScope=()=>{const c=context.current;return c.account?.toLowerCase()===player.toLowerCase()&&c.config?.chainId===config?.chainId&&c.network===config?.chainId&&navigationGeneration.current===startingGeneration&&(mint?c.name===mintName&&JSON.stringify(c.stats)===JSON.stringify(mintStats):c.selected?.id===selectedToken&&c.selected?.revision===selectedRevision&&c.delivery.join()===selectedDelivery);};
        const requireRequestScope=()=>{if(!sameRequestScope())throw new PlayerMessage('Your selection changed. Review before continuing.');};
        let sending: Submitted | undefined;
        setError('');
        setBusy(true);
        setBusyLabel('Checking estimate');
        try {
            if (!config || !cfg)
                throw Error('Connection interrupted');
            if (mint)
                normalizeName(name);
            else if (!selected || !eligible||canonicalStale)
                throw Error('This rooster is not ready for another day');
            await authenticate();requireRequestScope();
            const q = await api.quote(mint ? { operation: 'mint', name: normalizeName(name), stats } : { operation: 'day', tokenId: selected!.id, delivery: selected!.state.day === 0 ? [] : delivery });
            requireRequestScope();setQuote(q);
            const p = permitFromJSON(q.permit), fromBlock = await createChainReader(cfg).client.getBlockNumber();
            if(p.player.toLowerCase()!==player.toLowerCase()||p.operation!==(mint?0:1)||p.tokenId!==(mint?0n:BigInt(selectedToken!)))throw new PlayerMessage('The estimate changed. Please try again.');
            if(!mint&&p.baseRevision!==selectedRevision){
                if(sameRequestScope())await reconcileToken(selectedToken!,'This rooster changed. Review the saved day before preparing again.');
                return;
            }
            const marker: Submitted = { operation: mint ? 'mint' : 'day', tokenId: mint ? undefined : selected!.id, chainId: config.chainId, account: player, permitId: p.id, expiresAt: Number(p.expiresAt), fromBlock: fromBlock.toString() };
            const guarded = { request: async (args: any) => { if (args.method === 'eth_sendTransaction'||args.method==='wallet_sendTransaction') {
                    requireRequestScope();sending = marker;
                    store.set(submittedKey(marker), marker);
                    if (context.current.account === player) {
                        setSubmitted(marker);
                        setScreen('processing');
                    }
                } return provider.request(args); } } as WalletProvider;
            setBusyLabel('Check your wallet');
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            requireRequestScope();const owner = createOwnerWallet(guarded, cfg, player);
            const hash = mint ? await owner.mint(normalizeName(name), stats, p, q.signature) : await owner.requestDay(BigInt(selected!.id), p, q.signature);
            const tx: Submitted = { ...marker, hash };
            store.set(submittedKey(tx), tx);
            if (context.current.account !== player)
                return;
            setSubmitted(tx);
            if(operationToken.current===op&&navigationGeneration.current===startingGeneration){setScreen('processing');setBusyLabel('Waiting for confirmation');}
            await trackTransaction(tx, mint,startingGeneration,true);
        }
        catch(e){
            const causes=[e,(e as any)?.cause,(e as any)?.cause?.cause],declined=causes.some(x=>(x as any)?.code===4001||(x as any)?.name==='UserRejectedRequestError');
            if(sending&&declined)forgetTransaction(sending);
            if(context.current.account!==player||operationToken.current!==op||navigationGeneration.current!==startingGeneration)return;
            if(!sending&&!mint&&selectedToken&&e instanceof ApiError&&['ownership','pending','memorial','trial','delivery'].includes(e.code)){await reconcileToken(selectedToken,humanError(e));return;}
            if(!sending&&!sameRequestScope()){setError('Your selection changed. Review before continuing.');return;}
            if(sending&&!declined){setScreen('processing');setError('Checking your submission. No new request is needed.');}
            else{setScreen(mint?'mint':selected?.state.day===0?'firstRetry':'care');setError(humanError(e));}
        }
        finally {
            if(operationToken.current===op){setBusy(false);setBusyLabel('');}
        }
    }
    async function trackTransaction(tx: Submitted, mint = tx.operation === 'mint',viewGeneration=navigationGeneration.current,autoStart=false):Promise<void> {
 const visible=()=>viewGeneration===navigationGeneration.current&&(!tx.account||tx.account.toLowerCase()===context.current.account?.toLowerCase());
        if (!cfg || tx.account && tx.account.toLowerCase() !== context.current.account?.toLowerCase())
            return;
        try {
            if (!tx.hash) {
                if (!tx.permitId || tx.fromBlock === undefined || tx.expiresAt === undefined)
                    throw Error('Checking submission');
                const resolution = await createChainReader(cfg).resolvePermitSubmission(tx.permitId, (tx.account || account) as Address, BigInt(tx.fromBlock), BigInt(tx.expiresAt));
                if (resolution.hash) {
                    const recovered = { ...tx, hash: resolution.hash };
                    if(visible())setSubmitted(recovered);
                    store.set(submittedKey(recovered), recovered);
                    return await trackTransaction(recovered, mint,viewGeneration,autoStart);
                }
                if (resolution.expiredUnused) {
                    forgetTransaction(tx);
                    if(visible()){setScreen(mint?'mint':selected?.state.day===0?'firstRetry':'care');setError('No request was confirmed. You can try again.');}
                    return;
                }
                if (resolution.nextBlock !== undefined) {
                    tx = { ...tx, fromBlock: resolution.nextBlock.toString() };
                    if(visible())setSubmitted(tx);
                    store.set(submittedKey(tx), tx);
                }
                if(visible())setError('Your wallet submission is still being checked.');
                return;
            }
            const receipt = await createChainReader(cfg).wait(tx.hash);
            if (receipt.transactionHash !== tx.hash) {
                tx = { ...tx, originalHash: tx.originalHash || tx.hash, hash: receipt.transactionHash, replacementReason: receipt.replacementReason };
                if(!tx.account||tx.account.toLowerCase()===context.current.account?.toLowerCase())setSubmitted(tx);
                store.set(submittedKey(tx), tx);
            }
            if (tx.account && tx.account.toLowerCase() !== context.current.account?.toLowerCase())
                return;
            if (receipt.status !== 'success') {
                forgetTransaction(tx);
                if(visible())setScreen(mint?'mint':context.current.selected?.state.day===0?'firstRetry':'care');
                throw Error('Transaction was not accepted');
            }
            if (tx.operation === 'release') {
                const r = (await api.rooster(tx.tokenId!)).rooster;
                if(visible())setSelected(r);
                forgetTransaction(tx);
                setExpiryAvailable(false);
                if(visible())setScreen(terminalScreen(r));
                return;
            }
            if (!acceptedRequest(receipt)) {
                forgetTransaction(tx);
                if(visible()){setScreen(mint ? 'mint' : selected?.state.day === 0 ? 'firstRetry' : 'care');setError(receipt.replacementReason === 'cancelled' ? 'Cancelled in your wallet. No day was requested.' : receipt.replacementReason ? 'Transaction replaced. No day was requested.' : 'No day request was accepted.');}
                return;
            }
            await authenticate();
            const accepted = await api.accept(tx.hash!);
            const r = (await api.rooster(accepted.tokenId)).rooster;
            if (tx.account && tx.account.toLowerCase() !== context.current.account?.toLowerCase())
                return;
            setOwned(all => all.some(x => x.id === r.id) ? all.map(x => x.id === r.id ? r : x) : [...all, r]);
            if(visible())setResult(undefined);setSelected(current=>current?.id===r.id?r:current);
            forgetTransaction(tx);
            if(visible()&&(mint||context.current.selected?.id===accepted.tokenId)){if(autoStart)freshDay.current={account:context.current.account!.toLowerCase(),tokenId:r.id,requestId:accepted.requestId};setSelected(r);setJobId(accepted.requestId);setScreen('processing');if(mint)openRef.current?.({kind:'birth'});}
        }
        catch (e) {
            if (visible()) {
                setError(humanError(e));
                setBusyLabel('Checking transaction');
            }
        }
    }
    function toggleItem(id: ItemId,source?:HTMLElement) { if (!eligible || selected?.state.day === 0)
        return;const adding=!context.current.delivery.includes(id)&&context.current.delivery.length<3&&selected!.state.inventory[id]<65535,origin=source?.querySelector('img')?.getBoundingClientRect(),token=selected!.id,generation=navigationGeneration.current;supplyFlight.current?.();setDelivery(all => all.includes(id) ? all.filter(x => x !== id) : all.length < 3 && selected!.state.inventory[id] < 65535 ? [...all, id] : all); clearQuote();
        if(adding&&origin)requestAnimationFrame(()=>{const c=context.current;if(c.screen!=='care'||c.selected?.id!==token||c.modal||navigationGeneration.current!==generation||!c.delivery.includes(id))return;const image=[...document.querySelectorAll<HTMLButtonElement>('.delivery-slot.filled')].find(node=>node.getAttribute('aria-label')==='Remove '+catalog(id).name)?.querySelector('img');if(image)supplyFlight.current=showSupplyTransfer(origin,image,itemImageUrl(id));});
    }
    async function checkStatus() { setError(''); setBusy(true); try {
        if (submitted)
            await trackTransaction(submitted);
        else if (jobId) {
            await authenticate();
            setJob(await api.wake(jobId));
            if (selected) {
                const r = (await api.rooster(selected.id)).rooster;
                if (r.owner.toLowerCase() !== account?.toLowerCase()) {
                    setOwnerLost(true);
                    setModal({ kind: 'owner' });
                }
                setSelected(r);
            }
        }
        else if (selected) {
            const r = (await api.rooster(selected.id)).rooster;
            await chooseRooster(r);
        }
    }
    catch (e) {
        setError(humanError(e));
    }
    finally {
        setBusy(false);
    } }
    async function checkRecovery() { if (!cfg || !selected?.pending)
        return; setBusy(true); try {
        const available = await createChainReader(cfg).expiryAvailable(selected.pending.id as Hex);
        setExpiryAvailable(available);
        if (!available)
            setError('This request is still preparing.');
    }
    catch (e) {
        setError(humanError(e));
    }
    finally {
        setBusy(false);
    } }
    async function release() { if (!provider || !cfg || !account || !selected?.pending || !expiryAvailable)
        return; setBusy(true); setError(''); try {
        const reader = createChainReader(cfg);
        if (!await reader.expiryAvailable(selected.pending.id as Hex)) {
            setExpiryAvailable(false);
            await checkStatus();
            return;
        }
        const hash = await createOwnerWallet(provider, cfg, account).releaseExpired(selected.pending.id as Hex);
        const tx: Submitted = { hash, operation: 'release', tokenId: selected.id, chainId: config!.chainId, account };
        setSubmitted(tx);
        store.set(submittedKey(tx), tx);
        await trackTransaction(tx, false);
    }
    catch (e) {
        setError(humanError(e));
    }
    finally {
        setBusy(false);
    } }
    function presentSavedResult(packet:DayResult,index=0){playbackPacket.current=packet;snapshotCursor.current=undefined;setMeterCue(undefined);navigationGeneration.current++;setJobId(undefined);setResult(packet);setHud(packet.receipts[index]?.decisionSnapshot||packet.receipts[index]?.before||packet.finalState);setReceipt(undefined);setReplayIndex(index);setReplayLoading(false);setModal(null);setPaused(false);setScreen('replay');world.current?.playDay(packet,{startIndex:index});}
    function startPlayback(start?: number) { archiveReturn.current=undefined;setHistoricalDay(undefined);if (!result)
        return; const remembered = store.get(scope() + ':play:' + result.day, 0); const index = start ?? (watched(selected!) ? 0 : Math.max(0, Math.min(result.receipts.length - 1, remembered)));presentSavedResult(result,index); }
    function returnFromArchive(){
        const saved=archiveReturn.current;archiveReturn.current=undefined;setHistoricalDay(undefined);if(!saved||context.current.selected?.id!==saved.tokenId)return;
        navigationGeneration.current++;operationToken.current++;setBusy(false);setBusyLabel('');setPaused(false);setResult(saved.result);setCompactOutcome(saved.compact);setDelivery(saved.delivery);setPage(saved.page);
        const current=context.current.selected;setHud(current.state);world.current?.showSave(current.state,{sleep:true});
        const target=current.pending?'processing':saved.latestDay!==current.latestDay?!watched(current)?'ready':terminalScreen(current):saved.screen==='replay'?terminalScreen(current):saved.screen;
        setScreen(target);setReplayLoading(false);menuTrail.current=saved.trail;setModal(saved.modal);if(current.pending)setJobId(current.pending.id);
        if(target==='ready'&&saved.result?.day!==current.latestDay)void loadReplay(current,true);
        requestAnimationFrame(()=>{if(panelScroll.current)panelScroll.current.scrollTop=saved.scroll;const row=document.querySelector('[data-saved-day="'+historyFocusDay.current+'"] button') as HTMLElement|null;row?.focus({preventScroll:true});});
    }
    async function watchSaved(day:SavedDay){
        const current=context.current.selected;if(!current)return;const op=++operationToken.current,generation=navigationGeneration.current,reading=context.current.modal;
        setBusy(true);setBusyLabel('Opening day '+day.day);setError('');
        try{const packet=await api.replay(current.id,day.day);if(op!==operationToken.current||generation!==navigationGeneration.current||context.current.selected?.id!==current.id||context.current.modal!==reading)return;
            if(day.day!==current.latestDay||current.pending){const previous=archiveReturn.current;archiveReturn.current={tokenId:current.id,screen:previous?previous.screen:screen,result:previous?previous.result:result,compact:previous?previous.compact:compactOutcome,delivery:[...delivery],page,modal:reading||{kind:'savedDays'},trail:[...menuTrail.current],scroll:panelScroll.current?.scrollTop||0,latestDay:current.latestDay};setHistoricalDay(day.day);historyFocusDay.current=day.day;}
            else{archiveReturn.current=undefined;setHistoricalDay(undefined);}
            setPacketMissing(false);menuTrail.current=[];presentSavedResult(packet.result,0);
        }catch(e){if(op===operationToken.current&&generation===navigationGeneration.current)setError(humanError(e));}
        finally{if(op===operationToken.current){setBusy(false);setBusyLabel('');}}
    }
    async function openSavedActions(day:SavedDay){
        const current=context.current.selected;if(!current)return;const op=++operationToken.current,generation=navigationGeneration.current,reading=context.current.modal;setBusy(true);setBusyLabel('Reading saved actions');setError('');
        try{const outcome=await api.outcome(current.id,day.day);if(op!==operationToken.current||generation!==navigationGeneration.current||context.current.selected?.id!==current.id||context.current.modal!==reading)return;open({kind:'compactHistory',entries:cloneState(outcome.history),day:day.day});}
        catch(e){if(op===operationToken.current&&generation===navigationGeneration.current)setError(humanError(e));}
        finally{if(op===operationToken.current){setBusy(false);setBusyLabel('');}}
    }
    useEffect(()=>{
        if(modal?.kind!=='details')return;const id=modal.view?.tokenId||selected?.id;if(!id)return;let disposed=false;setDetailDay(undefined);
        const readingDay=modal.view?.readingDay??modal.view?.state?.day??selected?.state.day??0,cached=daysCache.current[id];if(cached)setDetailDay(cached.days.find(day=>day.day===readingDay));
        if(readingDay>0)void api.outcome(id,readingDay).then(outcome=>{if(!disposed)setDetailDay(outcome.savedDay);}).catch(()=>{});
        return()=>{disposed=true;};
    },[modal?.kind,modal?.view?.tokenId,selected?.id]);
    async function watchLatest(){
        const current=context.current.selected;if(!current||busy)return;const generation=navigationGeneration.current,op=++operationToken.current;setBusy(true);setBusyLabel('Opening saved day');setError('');
        try{const packet=await api.replay(current.id,current.latestDay);if(generation!==navigationGeneration.current||operationToken.current!==op||context.current.selected?.id!==current.id)return;archiveReturn.current=undefined;setHistoricalDay(undefined);setPacketMissing(false);presentSavedResult(packet.result);}
        catch{if(generation===navigationGeneration.current&&operationToken.current===op&&context.current.selected?.id===current.id){setPacketMissing(true);setReplayLoading(false);setScreen('ready');setError('The saved replay is unavailable.');}}
        finally{if(operationToken.current===op){setBusy(false);setBusyLabel('');}}
    }
    async function savedOutcome(){
        const current=context.current.selected;if(!current)return;const generation=navigationGeneration.current,op=++operationToken.current;setBusy(true);setBusyLabel('Reading saved day');setError('');
        try{
            let rooster=current;
            if(packetMissing||!result){const outcome=await api.outcome(current.id);if(generation!==navigationGeneration.current||operationToken.current!==op||context.current.selected?.id!==current.id)return;setCompactOutcome(outcome);rooster=outcome.rooster;setSelected(rooster);setOwned(all=>all.map(r=>r.id===rooster.id?rooster:r));}
            navigationGeneration.current++;setJobId(undefined);setReplayLoading(false);store.set(scope(rooster.id)+':watched',rooster.latestDay);setScreen(!rooster.state.alive?'memorial':config?.testnet&&rooster.state.day>=3?'trial':'summary');setHud(rooster.state);world.current?.showSave(rooster.state);
        }catch(e){if(generation===navigationGeneration.current&&operationToken.current===op)setError(humanError(e));}finally{if(operationToken.current===op){setBusy(false);setBusyLabel('');}}
    }
    const savedActions=()=>compactOutcome?.history.length?<button className="text-button" onClick={()=>open({kind:'compactHistory',entries:cloneState(compactOutcome.history),day:compactOutcome.savedDay?.day||compactOutcome.rooster.state.day})}>View saved actions</button>:null;
    function pause() { world.current?.pause(); setMeterCue(undefined);setPaused(true); }
    function resume() { menuTrail.current=[];setModal(null); world.current?.resume(); setPaused(false); }
    function brain() { const c = context.current; open({ kind: 'brain', choice: (isFilm(c.screen) ? c.receipt?.choice : c.job?.latestChoice) ? cloneState(isFilm(c.screen) ? c.receipt!.choice : c.job!.latestChoice) : undefined, receipt: isFilm(c.screen) && c.receipt ? cloneState(c.receipt) : undefined, preparing: c.screen === 'processing',planPacket:isFilm(c.screen)?c.result:undefined,planIndex:replayIndex,atImpact:!!c.receipt&&c.hud===c.receipt.snapshot }); setChoiceNotice(false); }
    function beginMint() { freshDay.current=undefined;setTraitsOpen(false);setResult(undefined);setReceipt(undefined);setCompactOutcome(undefined);archiveReturn.current=undefined;setHistoricalDay(undefined);operationToken.current++;navigationGeneration.current++;setJobId(undefined);setJob(undefined);setBusy(false);setBusyLabel('');menuTrail.current=[];setError(''); setQuote(undefined); setScreen('mint'); setModal(null); setName(store.get('nh:name:' + context.current.account, '')); setStats(store.get('nh:stats:' + context.current.account, initialStats)); }
    const deadlineConditions=(selected?.state.conditions.filter(c=>!c.resolved&&c.dueDay>0)||[]).sort((a,b)=>a.dueDay-b.dueDay);
    const warnings:Array<{label:string;due?:number;item:ItemId}>=deadlineConditions.map(c=>({label:conditionLabel(c.kind,c.severity),due:c.dueDay,item:c.kind==='wound'?'bandage':c.kind==='illness'||c.kind==='infection'?'medicine':c.kind==='waterDeficit'?'water':'bread'}));
    if(selected?.state.needs.nutrition!==undefined&&selected.state.needs.nutrition<=3000&&!deadlineConditions.some(c=>c.kind==='foodDeficit'))warnings.push({label:'Low food',item:'bread'});
    if(selected?.state.needs.hydration!==undefined&&selected.state.needs.hydration<=3000&&!deadlineConditions.some(c=>c.kind==='waterDeficit'))warnings.push({label:'Low water',item:'water'});
    const remaining = 5 - stats.body - stats.wits - stats.spirit;
    const displayState = hud || selected?.state || guest?.rooster.state;
    const visiting=screen==='discover'||screen==='visit',film=isFilm(screen);
 const mintIdentity=screen==='mint'||screen==='processing'&&submitted?.operation==='mint';
 const headerRooster=mintIdentity?undefined:selected||(visiting?guest?.rooster:undefined);
 const processTitle=submitted?(submitted.hash?'Checking transaction':busy?'Check your wallet':'Checking submission'):job?.phase==='queued'?'Waiting to begin':job?.phase==='checking'?'Checking saved day':job?.phase==='unaccepted'?'Checking request':job?.phase==='saving'?'Saving day':job?.phase==='recording_failure'?'Recording the attempt':'Preparing day '+((selected?.state.day||0)+1);
 const processCaption=submitted?(submitted.hash?'Waiting for confirmation':'Your request has not been confirmed'):job?.phase==='queued'?'Your request is saved':job?.phase==='checking'||job?.phase==='unaccepted'?'Checking the same request':job?.phase==='saving'?'Planning is complete':job?.phase==='recording_failure'?'Your last save is safe':'The day is taking shape';
    function primary(label: string, onClick: () => void, disabled = false) { return <button className="button primary main-action" disabled={disabled || busy} onClick={onClick}><FitText min={10}>{busy ? busyLabel || 'One moment…' : label}</FitText></button>; }
    function itemsRow(items: ItemId[], empty = true) { return <div className="delivery-slots" aria-label={'Delivery ' + items.length + ' of3'}>{[0, 1, 2].map(i => <button key={i} className={'delivery-slot ' + (items[i] ? 'filled' : '')} aria-label={items[i] ? 'Remove ' + catalog(items[i]).name : 'Add a supply to slot '+(i+1)} onClick={() => items[i] ? toggleItem(items[i]) : open({kind:'supplies'})} disabled={!eligible || screen !== 'care'}>{items[i] ? <><img src={itemImageUrl(items[i])} alt=""/><span>+1</span></> : empty ? <span className="empty-plus">+</span> : null}</button>)}</div>; }
    const savedDaysLink=()=>selected?.latestDay?<button className="text-button saved-days-link" onClick={()=>open({kind:'savedDays'})}>Saved days</button>:null;
    function renderScreen(): ReactNode {
 if(ownerLost)return <Panel title="A new owner" footer={primary('Choose rooster',()=>open({kind:'selector'}))}><p className="short-copy">This rooster has a new owner.</p></Panel>;
        if (network && config && network !== config.chainId)
            return <Panel title="Switch network" footer={<>{primary('Switch network', () => void switchNetwork())}<button className="text-button" onClick={() => open({ kind: 'wallet' })}>Choose wallet</button></>}><p className="short-copy">Your home is on<br /><strong>{config.chainName}</strong></p></Panel>;
        if (screen === 'entry'||screen==='discover'||screen==='visit')return null;
        if (screen === 'mint')
            return <Panel title="Hatch a rooster" kind="mint" back={() => selected?void chooseRooster(selected):setScreen('entry')} footer={<><div className="mint-meta"><span>First day included</span><button className="fee-button" onClick={() => open({ kind: 'fee' })}>{quote ? fee(quote.totalEstimate) : config?.testnet ? 'Test ETH' : '≈ $1 + fee'} <Icon name="info" size={12}/></button></div>{primary('Hatch rooster', () => void requestDay(true), remaining !== 0 || !name.trim() || !/^[A-Z0-9 ]{1,8}$/.test(name.trim()))}</>}><label className="name-label" htmlFor="rooster-name">Name <small>8 max</small></label><input id="rooster-name" value={name} maxLength={8} placeholder="BOK" autoComplete="off" onFocus={e => setTimeout(() => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 180)} onChange={e => { const v = e.target.value.toUpperCase(); setName(v); store.set('nh:name:' + account, v); clearQuote(); }}/>{name && !/^[A-Z0-9 ]{1,8}$/.test(name.trim()) && <p className="field-error">Letters, numbers and spaces</p>}<details className="trait-disclosure" open={traitsOpen} onToggle={e=>setTraitsOpen(e.currentTarget.open)}><summary>Traits</summary><div className="stat-allocation">{(['body', 'wits', 'spirit'] as const).map((k, i) => <div className="stat-row" key={k}><Icon name={(['heart', 'book', 'leaf'] as const)[i]} color={['#ed5652', '#d9e4cf', '#7fac58'][i]} size={20}/><div><strong>{k}</strong><small>{['Resist harm', 'Task skill', 'Keep spirits'][i]}</small></div><button className="step-button" disabled={!stats[k]} onClick={() => { setStats(s => { const n = { ...s, [k]: s[k] - 1 }; store.set('nh:stats:' + account, n); return n; }); clearQuote(); }}>−</button><b>{stats[k]}</b><button className="step-button" disabled={!remaining} onClick={() => { setStats(s => { const n = { ...s, [k]: s[k] + 1 }; store.set('nh:stats:' + account, n); return n; }); clearQuote(); }}>+</button></div>)}</div><p className="allocation-left">{remaining} point{remaining === 1 ? '' : 's'} left</p></details></Panel>;
        if(homeVisit)return <Panel title="Home" kind="care" accessory={<button className="care-stock" onClick={()=>open({kind:'status'})}>Stock ›</button>} footer={<>{primary('Explore house',()=>setRoomsOpen(true))}<div className="home-visit-links"><button className="text-button" onClick={()=>void watchLatest()}>Watch day {selected?.latestDay}</button>{savedDaysLink()}</div></>}/>;
        if (screen === 'care')
            return <Panel title="Prepare day" kind="care" accessory={<button className="care-stock" onClick={() => open({ kind: 'status' })}><FitText min={8}>Stock ›</FitText></button>} footer={<><div className="action-fee">{primary(canonicalStale?'Refresh saved day':'Prepare day',()=>canonicalStale?void reconcileToken(selected!.id,'Saved day refreshed.'):void requestDay(),!eligible||!canonicalStale&&delivery.some(id=>selected!.state.inventory[id]>=65535))}<button className="fee-button" onClick={() => open({ kind: 'fee' })}>{quote ? fee(quote.totalEstimate) : 'Estimate'} <Icon name="info" size={13}/></button></div>{savedDaysLink()}</>}>
   {warnings.length > 0 && <button className="priority-warning" onClick={() => open({ kind: 'status' })}>{warnings.slice(0, 1).map(w => <span key={w.label}><img src={itemImageUrl(w.item)} alt=""/>{w.label}{w.due?' · Day '+w.due:''}</span>)}{warnings.length>1&&<small>+{warnings.length-1} more ›</small>}</button>}
   <div className="care-rail"><div className="delivery-reference">{itemsRow(delivery)}<span className="selection-count"><FitText min={8}>{'Delivery ' + delivery.length + '/3'}</FitText></span></div>
    <div className="catalog-row">{ITEM_CATALOG.slice(page * catalogSize, page * catalogSize + catalogSize).map(item => <div className={'catalog-item ' + (delivery.includes(item.id) ? 'selected' : '')} key={item.id}><button className="item-tile" disabled={!eligible || (!delivery.includes(item.id) && (delivery.length === 3 || selected!.state.inventory[item.id] === 65535))} aria-label={(delivery.includes(item.id) ? 'Remove ' : 'Add ') + item.name} onClick={event => toggleItem(item.id,event.currentTarget)}><img src={itemImageUrl(item.id)} alt=""/>{delivery.includes(item.id) && <i aria-hidden="true">✓</i>}{(selected?.state.inventory[item.id] || 0) > 0 && <b className="stock-count">{selected?.state.inventory[item.id]}</b>}</button><button className="item-detail-button" aria-label={'Details: ' + item.name} onClick={() => open({ kind: 'item', item: item.id })}>Info</button></div>)}<button className="catalog-next" onClick={() => setPage(p => (p + 1) % Math.ceil(ITEM_CATALOG.length/catalogSize))} aria-label="Next supply page"><span className="catalog-position">{page+1}/{Math.ceil(ITEM_CATALOG.length/catalogSize)}</span>›</button></div>
   </div><div className="care-hint"><span>{delivery.some(id=>selected!.state.inventory[id]>=65535)?'Remove a full supply':delivery.length === 0 ? 'Stored supplies only' : delivery.length + '/3 supplies'}</span>{config?.testnet && <span>{Math.max(0, 3 - (selected?.state.day || 0))} day{selected?.state.day===2?'':'s'} left</span>}</div>
  </Panel>;
        if (screen === 'processing')
            return <Panel title={processTitle} kind="progress" footer={<><div className="progress-actions">{submitted || error || !job || ['queued', 'checking', 'unaccepted'].includes(job.phase) || Date.now() - job.updatedAt > 25000 ? <button className="button primary main-action" onClick={() => void checkStatus()} disabled={busy}>{!submitted && job && (['queued', 'checking', 'unaccepted'].includes(job.phase) || Date.now() - job.updatedAt > 25000) ? job.phase==='queued'?'Resume preparation':'Check status' : 'Check status'}</button> : <button className="text-button" onClick={brain}>Inspect choice</button>}<button className="button secondary" onClick={() => open({ kind: 'details' })}>Details</button></div>{expiryAvailable && primary('Release expired request', () => void release())}</>}><div className="phase-track">{['Request', 'Jev', 'Save'].map((p, i) => { const done = i === 0 && !submitted || i === 1 && ['saving', 'ready'].includes(job?.phase || ''); const current = submitted ? i === 0 : job?.phase === 'saving' ? i === 2 : job?.phase==='preparing' ? i === 1 : false; return <span className={(done ? 'done ' : '') + (current ? 'current' : '')} key={p}><i>{done ? '✓' : i + 1}</i>{p}</span>; })}</div><p className="progress-caption">{processCaption}</p><p className="leave-copy">You can leave and return.</p></Panel>;
        if (screen === 'firstRetry')
            return <Panel title="Day one is still yours" footer={<><div className="mint-meta">{config?.testnet&&<span>{3-(selected?.state.day||0)} days left</span>}<button className="fee-button" onClick={()=>open({kind:'fee'})}>{quote?fee(quote.totalEstimate):'Estimate'} <Icon name="info" size={12}/></button></div>{primary(canonicalStale?'Refresh saved day':'Retry day 1',()=>canonicalStale?void reconcileToken(selected!.id,'Saved day refreshed.'):void requestDay(),!eligible)}<button className="text-button" onClick={() => open({ kind: 'status' })}>Starting supplies</button></>}><p className="short-copy">Original starter supplies.<br />No new mint charge.</p></Panel>;
        if (screen === 'ready')
            return <Panel title={'Day ' + (selected?.latestDay || result?.day || 1) + ' saved'} kind="ready" footer={<>{replayLoading?primary('Opening replay',()=>{},true):!packetMissing && result ? primary(store.get(scope() + ':play:' + result.day, 0) > 0 ? 'Resume day '+result.day : 'Watch day '+result.day, () => startPlayback()) : primary('View saved outcome', savedOutcome)}<button className="text-button" onClick={() => packetMissing ? void loadReplay(selected!, true) : savedOutcome()}>{packetMissing ? 'Retry replay' : 'View saved outcome'}</button></>}><p className="saved-line"><Icon name="check" color="#8ac05c"/>Saved onchain</p>{selected && !selected.state.alive && <span className="life-badge dead">Final day</span>}{packetMissing && <p className="short-copy">The replay is unavailable.<br />Your saved outcome remains.</p>}</Panel>;
        if (screen === 'summary')
            return <Panel title={'Day ' + selected?.state.day + ' survived'} kind="summary" footer={<>{primary(config?.testnet && selected!.state.day >= 3 ? 'Visit home' : 'Next day', () => setScreen('care'))}{selected?.latestDay ? <button className="text-button" onClick={() => void watchLatest()}>Watch again</button> : null}{savedDaysLink()}</>}><p className="level-result">Level {Math.max(0, (selected?.state.level || 1) - 1)} <span>→</span> <strong>{selected?.state.level}</strong></p>{warnings.length > 0&&<div className="summary-warnings">{warnings.map(w => <button key={w.label} onClick={() => open({ kind: 'status' })}><img src={itemImageUrl(w.item)} alt=""/>{w.label}{w.due&&<small>Day {w.due}</small>}</button>)}</div>}<ul className="day-highlights">{dayHighlights(result).map(line => <li key={line}>{line}</li>)}</ul>{savedActions()}</Panel>;
        if (screen === 'memorial')
            return <Panel title={selected?.state.name + ' · Memorial'} kind="memorial" footer={<>{primary('Choose rooster', () => open({ kind: 'selector' }))}<button className="text-button" onClick={beginMint}>Hatch another</button></>}><div className="memorial-content"><img className="memorial-portrait" src={roosterImageUrl(selected?.state.seed || '0x0')} alt={selected?.state.name}/><div><p>Level {selected?.state.level}</p><p>Final day {selected?.state.day}</p><p className="death-cause">{selected?.state.deathCause?deathNames[selected.state.deathCause]:'This life ended'}</p></div></div>{selected?.state.deathContributors?.some(c=>c!==selected.state.deathCause)&&<p className="reading-context">Also: {[...new Set(selected.state.deathContributors.filter(c=>c!==selected.state.deathCause))].map(c=>deathNames[c]).join(' · ')}</p>}<p className="retained-line">The NFT remains in your wallet.</p>{selected?.latestDay ? <button className="text-button" onClick={() => void watchLatest()}>Watch final day</button> : null}{savedActions()}</Panel>;
        if (screen === 'trial')
            return <Panel title="Trial complete" kind="summary" footer={<>{primary('Visit home', () => setScreen('care'))}<button className="text-button" onClick={() => setScreen('summary')}>View summary</button></>}><p className="short-copy">3 of 3 days saved.<br />{selected?.state.name} is still alive.</p>{selected?.latestDay ? <button className="button secondary" onClick={() => void watchLatest()}>Watch day 3</button> : null}{savedActions()}</Panel>;
        return null;
    }
    function renderModal(): ReactNode {
        if (!modal)
            return null;
        if(modal.kind==='savedDays'){
            const id=modal.view?.tokenId||selected?.id;if(!id)return <Panel title="Saved days" back={close} footer={primary('Back',close)}/>;
            return <Panel title="Saved days" kind="saved-days" back={close} footer={primary('Back',close)}><SavedDaysPanel tokenId={id} cached={daysCache.current[id]} onData={page=>{daysCache.current[id]=page;}} onWatch={day=>void watchSaved(day)} onActions={day=>void openSavedActions(day)}/></Panel>;
        }
        if(modal.kind==='supplies'){const same=!modal.view||(modal.view.tokenId===selected?.id&&modal.view.revision===selected?.revision);return <Panel title="Add a supply" kind="supplies" back={close} footer={primary('Back',close)}><p className="reading-context">{delivery.length}/3 selected</p><div className="supply-picker">{ITEM_CATALOG.map(item=>{const picked=delivery.includes(item.id),full=selected?.state.inventory[item.id]===65535;return <button key={item.id} className={picked?'selected':''} disabled={!eligible||screen!=='care'||!same||picked||full||delivery.length===3} onClick={()=>{toggleItem(item.id);close();}}><img src={itemImageUrl(item.id)} alt=""/><span>{item.name}</span>{(picked||full)&&<small>{picked?'Selected':'Full'}</small>}</button>;})}</div></Panel>;}
        if (modal.kind === 'item') {
            const item=catalog(modal.item),view=modal.view,saved=view?.state||selected?.state;
            const choices=view?.delivery||delivery,chosen=choices.includes(modal.item);
            const sameSave=!view||(view.tokenId===selected?.id&&view.revision===selected?.revision);
            const editable=screen==='care'&&view?.screen==='care'&&eligible&&sameSave;
            const full=saved?.inventory[modal.item]===65535,canAdd=editable&&(chosen||delivery.length<3)&&(!full||chosen);
            return <Panel title={item.name} kind="detail" back={close} footer={editable?primary(chosen?'Remove':'Add',()=>{toggleItem(modal.item);close();},!canAdd):primary('Back',close)}>
                {saved&&<p className="reading-context">{saved.name} · {view&&isFilm(view.screen)?'Recorded':'Saved'} day {view?.readingDay??saved.day}</p>}
                <div className="item-hero"><img src={itemImageUrl(modal.item)} alt=""/><span>Stored {saved?.inventory[modal.item]||0}{view?.screen==='care'&&!(config?.testnet&&(saved?.day||0)>=3)&&<><br/>Delivery +{chosen?'1':'0'}</>}</span></div>
                <p className="single-use">Single use</p><ul className="item-uses">{item.uses.split(' · ').map(x=><li key={x}>{x}</li>)}</ul>
                {!canAdd&&editable&&!chosen&&<p className="field-error">{full?'This supply is full':'Remove a supply first'}</p>}
                {!sameSave&&<p className="field-error">This day changed. Review your delivery.</p>}
            </Panel>;
        }
        if (modal.kind === 'help') return <Panel title="How to play" back={close} footer={primary(menuTrail.current.length?'Back':'Close',close)}>
            <ol className="help-steps"><li><b>1</b>Bring up to 3 supplies</li><li><b>2</b>Save the day</li><li><b>3</b>Watch it unfold</li></ol>
            <ul className="help-facts"><li>Jev decides how to use supplies.</li><li>The replay is already saved. Watching changes nothing.</li><li>No time passes while you are away.</li><li>A life can end. The NFT stays.</li>{config?.testnet&&<li>Testnet: 3 saved days, including the first. Failed attempts do not use a day.</li>}</ul>
        </Panel>;
        if (modal.kind === 'options')
            return <Panel title="Options" footer={primary('Close', close)}><button className="option-row" onClick={() => setMuted(m => !m)}><span>Sound</span><span className={'toggle ' + (!muted ? 'on' : '')}><i /></span></button><a className="option-row title-screen-link" href="/?intro=1">Title screen <span>›</span></a><button className="option-row" onClick={() => open({ kind: 'help' })}>How to play <span>›</span></button>{selected?.latestDay&&active?<button className="option-row" onClick={()=>open({kind:'savedDays'})}>Saved days <span>›</span></button>:null}<button className="option-row" onClick={() => open({ kind: 'details' })}>Transaction details <span>›</span></button><div className="network-line">{config?.chainName || 'Robinhood Chain'}{account && <small>{short(account)}</small>}{config?.testnet&&<a className="test-faucet-link" href="https://faucet.testnet.chain.robinhood.com/" target="_blank" rel="noreferrer">Get test ETH ↗</a>}</div></Panel>;
        if (modal.kind === 'selector') {
            const list = owned.filter(r => !tokenSearch || r.id.includes(tokenSearch));
            return <Panel title="Your roosters" kind="selector" back={close} footer={<button className="button secondary" onClick={beginMint}>+ Hatch another</button>}><form className="token-search" onSubmit={async (e) => { e.preventDefault(); if (!tokenSearch)
                return; setBusy(true); try {
                const r = (await api.rooster(tokenSearch)).rooster;
                if (r.owner.toLowerCase() !== account?.toLowerCase())
                    throw new PlayerMessage('That rooster belongs to another wallet.');
                setOwned(all => all.some(x => x.id === r.id) ? all : [...all, r]);
                await chooseRooster(r);
            }
            catch (e) {
                setError(humanError(e));
            }
            finally {
                setBusy(false);
            } }}><input value={tokenSearch} inputMode="numeric" placeholder="Token number" aria-label="Find token number" onChange={e => setTokenSearch(e.target.value.replace(/\D/g, ''))}/><button className="icon-button" aria-label="Find rooster" type="submit">›</button></form><div className="owned-list">{list.map(r => <button key={r.id} className={'owned-row ' + (r.id === selected?.id ? 'selected' : '')} onClick={() => void chooseRooster(r)}><img src={roosterImageUrl(r.state.seed)} alt=""/><span><strong>{r.state.name}</strong><small>#{r.id} · LV{String(r.state.level).padStart(2, '0')}</small></span><b className={'life-badge ' + (!r.state.alive ? 'dead' : r.pending ? 'pending' : 'alive')}>{!r.state.alive ? 'Memorial' : r.pending ? 'Preparing' : config?.testnet && r.state.day >= 3 ? 'Trial complete' : 'Alive'}</b></button>)}{!list.length && <p className="short-copy">{ownedLoading ? 'Finding your roosters…' : 'No matching rooster.'}</p>}</div></Panel>;
        }
        if (modal.kind === 'status') {
            const state=modal.view?.state||(film?hud:screen==='visit'?guest?.rooster.state:selected?.state);
            if(!state)return <Panel title="Status" footer={primary('Close',close)}/>;
            const replay=modal.view?.screen==='replay'||modal.view?.screen==='discover';
            return <Panel title={(replay?'Recorded':'Saved')+' day '+state.day} kind="status" back={close} footer={primary('Back',close)}>
                <p className="reading-context">{state.name}</p>
                <SavedStatus state={state} onItem={item=>open({kind:'item',item,view:modal.view})} onObject={target=>open({kind:'object',target,state,view:modal.view})}/>
            </Panel>;
        }
        if(modal.kind==='dayPlan'){
            const canResume=!!modal.view&&isFilm(modal.view.screen)&&isFilm(screen)&&result===modal.packet;
            return <Panel title="Morning plan" kind="brain" back={close} footer={primary(canResume?'Resume':menuTrail.current.length?'Back':'Close',canResume?resume:close)}><DayPlanDetails packet={modal.packet} index={modal.index} atImpact={modal.atImpact}/></Panel>;
        }
        if (modal.kind === 'brain') {
            const choice=modal.choice,canResume=!!modal.view&&isFilm(modal.view.screen)&&isFilm(screen);
            const planPacket=modal.planPacket?.dailyFocus?modal.planPacket:undefined;
            const planned=!!modal.receipt?.plan&&!!planPacket;
            const beforePlannedImpact=planned&&(modal.planIndex??modal.receipt!.index)===modal.receipt!.index&&!modal.atImpact;
            return <Panel title={modal.preparing?'Jev is choosing':choice?'Recorded choice':modal.receipt?'Recorded moment':'Recorded choice'} kind="brain" back={close} footer={primary(canResume?'Resume':menuTrail.current.length?'Back':'Close',canResume?resume:close)}>
                {planned&&<button className="planned-earlier-link" onClick={()=>open({kind:'dayPlan',packet:planPacket!,index:modal.planIndex??modal.receipt!.index,atImpact:!!modal.atImpact,view:modal.view})}><span>Planned earlier</span><Icon name="book" size={15}/></button>}
                {choice?<><p className="brain-caption">{modal.preparing?'Day spoilers':'Paused'}</p><small className="probability-label">Model choice probability</small><div className="choice-list">{choice.candidates.map(candidate=><div className={'choice-row '+(choice.selected===candidate.key?'picked':'')} key={candidate.key}><Icon name={choice.selected===candidate.key?'check':'play'} size={12}/><span>{candidate.label}</span><b>{choice.probabilities?.[candidate.key]!==undefined?Math.round(choice.probabilities[candidate.key]*100)+'%':'—'}</b></div>)}</div>{modal.preparing&&<p className="newer-choice">{choiceNotice?'Newer choices available':'Preparation continues'}</p>}</>:!modal.receipt?<p className="short-copy">No recorded choice yet.</p>:null}
                {modal.receipt&&(beforePlannedImpact?<p className="plan-morning">{modal.receipt.label}</p>:<RecordedStory receipt={modal.receipt}/>)}
            </Panel>;
        }
        if (modal.kind === 'birth') {
            const initial = createInitialState(selected?.state.seed || '0', selected?.state.stats, selected?.state.name);const birthStatus=job?.phase==='ready'||selected?.latestDay?'Day 1 saved':job?.phase==='recording_failure'?'Recording the attempt':job?.phase==='failed'?'Day 1 did not prepare':job?.phase==='preparing'?'Preparing day 1':job?.phase==='saving'?'Saving day 1':'Waiting to begin';
            return <Panel title={'Meet ' + selected?.state.name} kind="birth" footer={primary('Continue', close)}><img className="birth-rooster" src={roosterImageUrl(initial.seed)} alt={initial.name}/><p className="birth-preparing">{birthStatus}</p><div className="starter-row">{ITEM_IDS.filter(id => initial.inventory[id] > 0).map(id => <span key={id}><img src={itemImageUrl(id)} alt={catalog(id).name}/><b>×{initial.inventory[id]}</b></span>)}</div><p className="starter-caption">Starting supplies</p></Panel>;
        }
        if (modal.kind === 'wallet')
            return <Panel title="Connect wallet" back={close} footer={wallets.length ? undefined : <a className="button primary main-action" href={'https://link.metamask.io/dapp/' + location.host + location.pathname + location.search}>Open in wallet</a>}><div className="wallet-list">{wallets.map(w => <button className="button secondary" key={w.id} onClick={() => void connect(w)}><Icon name="wallet"/>{w.name}<span>›</span></button>)}</div>{!wallets.length && <p className="short-copy">Open this page in your wallet.</p>}</Panel>;
        if (modal.kind === 'object') {
            const { state: s, target } = modal;
            return <Panel title={TARGET_LABELS[target] || 'Your home'} back={close} footer={menuTrail.current.length?primary('Back',close):film ? primary('Resume', resume) : primary('Close', close)}><HouseDetails state={s} target={target} onItem={item=>open({kind:'item',item,view:modal.view})}/></Panel>;
        }
        if (modal.kind === 'fee')
            return <Panel title="Estimate details" back={close} footer={primary('Close', close)}>{quote ? <div className="fee-breakdown"><span>Network</span><b>{fee(quote.networkEstimate)}</b><span>Care</span><b>{fee(String(BigInt(quote.value) - BigInt(String(quote.permit.mintFee || 0))))}</b>{BigInt(String(quote.permit.mintFee||0))>0n&&<><span>Mint</span><b>{fee(String(quote.permit.mintFee))}</b></>}<span>Total</span><b>{fee(quote.totalEstimate)}</b></div> : <p className="short-copy">A fresh estimate is shown<br />before wallet approval.</p>}{config?.testnet && <p className="help-small">Test ETH has no real-world value.</p>}</Panel>;
        if(modal.kind==='compactHistory')return <Panel title={'Saved day '+modal.day} back={close} footer={primary('Back',close)}><ol className="compact-history">{modal.entries.map((entry,index)=>{const row=describeCompactAction(entry);return <li className={(row.terminal?'terminal ':row.failed?'failed ':'')+(row.quiet?'quiet':'')} key={index}><small>{index+1}</small><div><strong>{row.title}</strong><span>{row.detail}</span></div></li>;})}</ol></Panel>;
        if (modal.kind === 'history') {
            return <Panel title={'Day ' + result?.day} back={close} footer={primary('Resume', resume)}>{result&&<DayLog packet={result} index={replayIndex} atImpact={hud===result.receipts[replayIndex]?.snapshot} openGroups={logGroups} onGroupChange={(key,value)=>setLogGroups(previous=>({...previous,[key]:value}))} onInspect={(r,i)=>{world.current?.seek(i);setReceipt(r);setReplayIndex(i);open({kind:'brain',choice:r.choice?cloneState(r.choice):undefined,receipt:cloneState(r),preparing:false,planPacket:result,planIndex:i,atImpact:true});}}/>}</Panel>;
        }
        if (modal.kind === 'owner')
            return <Panel title="A new owner" footer={primary('Choose rooster', () => open({ kind: 'selector' }))}><p className="short-copy">This rooster has a new owner.</p></Panel>;
        const id=modal.view?.tokenId||selected?.id,sameJob=job?.tokenId===id?job:undefined,attempt=lastAttempt?.tokenId===id?lastAttempt:undefined;
        const sameSavedJob=sameJob?.requestId===detailDay?.requestId?sameJob:undefined;
        const requestHash=detailDay?.requestTx||sameSavedJob?.ownerTx;
        const saveHash=detailDay?.saveTx||sameSavedJob?.finalTx;
        const pendingHash=selected&&selected.id===id&&selected.pending?(submitted&&submitted.tokenId===id?submitted.hash:sameJob?.ownerTx):undefined;
        return <Panel title={detailDay?'Day '+detailDay.day+' details':'Day details'} back={close} footer={primary('Back',close)}><div className="detail-list"><p>{modal.view?.state?.name||selected?.state.name} {id?'#'+id:''}</p><p>{config?.chainName}</p>{pendingHash&&pendingHash!==requestHash&&<a href={explorerTransaction(config?.chainId||46630,pendingHash)} target="_blank" rel="noreferrer">Next day request ↗</a>}{requestHash&&<a href={explorerTransaction(config?.chainId||46630,requestHash)} target="_blank" rel="noreferrer">Request transaction ↗</a>}{saveHash&&<a href={explorerTransaction(config?.chainId||46630,saveHash)} target="_blank" rel="noreferrer">Saved day transaction ↗</a>}{config&&id&&<a href={config.explorerUrl+'/token/'+config.collection+'/instance/'+id} target="_blank" rel="noreferrer">NFT on explorer ↗</a>}{sameJob?.requestId&&<small>Request {short(sameJob.requestId)}</small>}{selected?.pending&&<button className="button secondary" onClick={()=>void checkRecovery()}>Check request recovery</button>}{expiryAvailable&&primary('Release expired request',()=>void release())}{id&&<button className="text-button" onClick={()=>open({kind:'savedDays'})}>Saved days</button>}{account&&<small>{short(account)}</small>}</div></Panel>;

    }
    const welcome=screen==='entry'||visiting;
    const sceneState=screen==='visit'?guest?.rooster.state:selected?.state;
    const dayLabel=film?'DAY':(screen==='care'&&!homeVisit)||screen==='processing'||screen==='firstRetry'?'NEXT':'SAVED';
    const dayNumber=film?receipt?.day||result?.day:(screen==='care'&&!homeVisit)||screen==='processing'||screen==='firstRetry'?(headerRooster?.state.day||0)+1:headerRooster?.state.day;
    return <PanelContext.Provider value={{error,body:panelScroll,onScroll:e=>{scrollMemory.current[(modal?'modal:'+modal.kind:screen)+':'+selected?.id]=e.currentTarget.scrollTop;}}}>
      <main className={'app-root screen-'+screen+(traveling&&film?' is-traveling':'')+(opening!=='closed'?' is-opening':'')} data-opening-phase={opening}>
       <div className={'game-composition '+(screen==='care'?'with-care':screen==='mint'?'with-form':welcome?'with-welcome':'')}>
        <div className={'game-frame '+(film?'is-replaying':'')} inert={!!modal}>
         <div className="world-mount" ref={host}/>
         <header className={'game-hud '+(!headerRooster?'unowned':'')}>
          <div className="identity-line">
           {headerRooster?visiting?<span className="identity-guest"><strong>{headerRooster.state.name}</strong><span>LV{String(displayState?.level||0).padStart(2,'0')}</span><small>VISIT</small></span>:<button className="identity-button" onClick={()=>open({kind:'selector'})}>{headerRooster.state.name}<span>LV{String(displayState?.level||0).padStart(2,'0')}</span><span className="selector-caret" aria-hidden="true">▼</span></button>:<span className="entry-brand">{mintIdentity?screen==='processing'?'Hatching '+(name.trim()||'rooster'):'New rooster':'NEARlyHuman'}</span>}
           <div className="day-context">{headerRooster?<span>{dayLabel}{String(dayNumber||0).padStart(2,'0')}</span>:config?.testnet?<span className="network-badge">TESTNET</span>:null}<button className="icon-button options-button" aria-label="Options" onClick={()=>open({kind:'options'})}><Icon name="gear"/></button></div>
          </div>
          {headerRooster&&displayState&&<div className="meter-row">
           <button className="needs-button" aria-label="Open health and needs" onClick={()=>{if(film)pause();open({kind:'status'});}}>{needs.map(k=>{const delta=meterCue?.changes[k];return <span className={'need-meter need-'+k+(delta?' has-change':'')} key={k}><Icon name={needIcons[k]}/><span className="meter-pips">{[1,2,3,4,5].map(i=><i key={i} className={displayState.needs[k]>=i*2000?'on':''}/>)}</span>{delta&&<span className={'need-change '+(delta>0?'up':'down')} key={meterCue.sequence} aria-hidden="true">{signedNeed(delta)}</span>}</span>;})}</button>
           <button className={'brain-button '+(job?.phase==='preparing'?'thinking':'')} onClick={brain} aria-label="Inspect Jev choice"><Icon name="brain" size={19}/></button>
          </div>}
          {film&&result?.dailyFocus&&<DayFocusBadge packet={result} index={replayIndex} atImpact={hud===result.receipts[replayIndex]?.snapshot} onOpen={()=>{pause();open({kind:'dayPlan',packet:result,index:replayIndex,atImpact:hud===result.receipts[replayIndex]?.snapshot});}}/>}
         </header>
         {film&&!modal&&<div className="event-box">
          <button className="day-log-button" onClick={()=>{pause();open({kind:'history'});}}>Day log</button>
          <button className="event-lines" onClick={()=>{pause();open({kind:'history'});}}><span>{lines[0]}</span><span>{lines[1]}</span></button>
          <div className="replay-controls"><button className="icon-button" aria-label={paused?'Resume':'Pause'} onClick={paused?resume:pause}><Icon name={paused?'play':'pause'}/></button><button className="icon-button" aria-label={screen==='discover'?'Finish visit':historicalDay?'Back to saved days':'Skip to summary'} onClick={()=>world.current?.skip()}><Icon name="skip"/></button></div>
          {paused&&<button className="resume-label" onClick={resume}>Resume</button>}
         </div>}
         {(screen==='care'||screen==='visit')&&sceneState&&<HouseExplorer key={screen==='visit'?'guest':selected?.id} state={sceneState} view={houseView} peek={housePeek} roomsOpen={roomsOpen} onRoomsOpenChange={setRoomsOpen} onWatch={screen==='visit'?startGuestDay:!homeVisit&&selected?.latestDay?()=>void watchLatest():undefined} lines={[warnings[0]?.label||'Settled in for the night.',warnings[0]?.due?expiryText(warnings[0].due):warnings[0]?'A supply may help.':'Nearly human.']} onRoom={room=>{setHousePeek(undefined);world.current?.focusRoom(room);}} onFollow={()=>{setHousePeek(undefined);world.current?.followActor();}} onDetails={target=>open({kind:'object',target,state:cloneState(sceneState)})}/>}
         <div className="screen-overlay">{!modal&&!film&&!['entry','visit','care','mint'].includes(screen)?renderScreen():null}</div>
         {config?.testnet&&headerRooster&&<span className="corner-network">TESTNET</span>}
         {opening!=='closed'&&<CartridgeOpening phase={opening} onStart={startOpeningGame}/>}
        </div>
        {welcome&&<div className="welcome-wrap" inert={!!modal}><WelcomeDock busy={busy||ownedLoading} label={busyLabel} error={error} onHatch={()=>enterHome('mint')} onHome={()=>enterHome('home')}/></div>}
        {screen==='care'&&<div className="care-dock" inert={!!modal}>{renderScreen()}</div>}
        {screen==='mint'&&<div className="mint-dock" inert={!!modal}>{renderScreen()}</div>}
        {modal&&createPortal(<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="composition-modal" role="dialog" aria-modal="true" aria-label="Game details" onClick={e=>{if(e.target===e.currentTarget)close();}}>{renderModal()}</div></div>,document.body)}
       </div>
      </main>
    </PanelContext.Provider>;
}
