import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '../../app/Icons';
import { itemImage } from '../../art/items';
import record from './fern-day-two.json';
import './jev-article.css';

const images = '/site/blog/jev/';
const source = `https://github.com/alphastack1/NEARlyHuman/blob/${record.revision}`;
const calls = ['garden', 'meal'] as const;
type Call = typeof calls[number];
type Moment = typeof record.calls[number];
const [watering, breakfast] = record.calls;
const moments = { garden: watering, meal: breakfast };
const napKey = breakfast.actions.find(action => action.name === 'Nap')!.key;
const callLabels = { garden: 'Water the garden', meal: 'Have breakfast' };
const percent = (value: number) => `${Math.round(value * 100)}%`;
const trace = [
  ['state', 'The server reads Fern’s needs, pantry and garden.'],
  ['menu', 'The request includes those facts and the actions the rules allow.'],
  ['answer', 'Jev ranks the options and sends back one action ID.'],
  ['result', 'The game looks up the action and applies its rules.'],
] as const;

const fieldRows = [
  ['nutrition', 'Food', 'needs.nutrition', watering.request.state.needs.nutrition, breakfast.request.state.needs.nutrition, 100],
  ['hydration', 'Water', 'needs.hydration', watering.request.state.needs.hydration, breakfast.request.state.needs.hydration, 100],
  ['energy', 'Energy', 'needs.energy', watering.request.state.needs.energy, breakfast.request.state.needs.energy, 100],
  ['morale', 'Morale', 'needs.morale', watering.request.state.needs.morale, breakfast.request.state.needs.morale, 100],
  ['moisture', 'Daisy bed', 'garden[0].moisture', watering.request.state.garden[0].moisture, breakfast.request.state.garden[0].moisture, 2],
  ['ordinary_opportunities_left', 'Small actions left', 'ordinary_opportunities_left', watering.request.state.opportunities.ordinary_opportunities_left, breakfast.request.state.opportunities.ordinary_opportunities_left, 0],
] as const;
type Field = typeof fieldRows[number][0] | 'nap' | 'choice';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Sprite({ name }: { name: 'bread' | 'water' | 'sapling' | 'daisy' }) {
  return <img className="jev-sprite" src={itemImage({ water: 0, bread: 2, sapling: 21, daisy: 22 }[name])} width={28} height={28} alt=""/>;
}

function SectionTitle({ number, id, children }: { number: number; id: string; children: ReactNode }) {
  return <div className="jev-section-title"><span aria-hidden="true">{number}</span><h2 id={id}>{children}</h2></div>;
}

function Meter({ label, value, max = 100, before = value }: { label: string; value: number; max?: number; before?: number }) {
  return <div className="meter-row"><div><span>{label}</span><strong>{value}/{max}</strong></div><span className="meter-track" aria-hidden="true"><i style={{ '--current': `${value / max * 100}%`, '--initial': `${before / max * 100}%` } as CSSProperties}/></span></div>;
}

type FieldControl = (field: Field) => {
  'data-field': Field;
  'aria-pressed': boolean;
  className: string;
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  onFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur: () => void;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function stateExcerpt(moment: Moment) {
  const state = moment.request.state;
  return {
    needs: { nutrition: state.needs.nutrition, hydration: state.needs.hydration, energy: state.needs.energy, morale: state.needs.morale },
    stock: state.stock,
    garden: [{ plant: state.garden[0].plant, moisture: state.garden[0].moisture }],
    opportunities: { ordinary_opportunities_left: state.opportunities.ordinary_opportunities_left },
  };
}

type ActionFacts = { action: string; use: Record<string,number | undefined>; energy_cost: number; does?: string; clipped_gain_on_success?: Record<string,number | undefined> };
const factsOf = (moment: Moment, key: string) => (moment.request.questions.next_action.criteria as Record<string, ActionFacts | undefined>)[key]!;
const score = (probabilities:Record<string,number | undefined>, key:string) => probabilities[key]!;

function requestExcerpt(moment: Moment, id: Call) {
  const chosen = moment.answer.answers.next_action.choice;
  const keys = id === 'meal' ? [chosen, napKey] : [chosen];
  const pairs = keys.map(key => {
    const facts = factsOf(moment,key);
    return [key, { action:facts.action, use:facts.use, energy_cost:facts.energy_cost,
      ...(facts.does ? { does:facts.does } : {}),
      ...(facts.clipped_gain_on_success ? {clipped_gain_on_success:Object.fromEntries(Object.entries(facts.clipped_gain_on_success).filter(([,value])=>value !== undefined && value > 0))} : {}),
    }];
  });
  return {state:stateExcerpt(moment), questions:{next_action:{ type:'choice', instructions:moment.request.questions.next_action.instructions.split('. ')[0]+'.', criteria:Object.fromEntries(pairs) }}};
}

function compactJson(value: object) {
  return JSON.stringify(value, null, 2)
    .replace(/("(?:needs|stock|opportunities|use|clipped_gain_on_success|probabilities)": )\{\n([^{}]+?)\n\s*\}/g, (_,name,body)=>`${name}{ ${body.trim().replace(/\n\s*/g,' ')} }`)
    .replace(/"garden": \[\n\s*\{\n([^{}]+?)\n\s*\}\n\s*\]/, (_,body)=>`"garden": [{ ${body.trim().replace(/\n\s*/g,' ')} }]`);
}

function JsonCode({ id, label, text, chosen, active, preview, clear }: {id:string; label:string; text:string; chosen?:string; active?:Field; preview?:(field:Field)=>void; clear?:()=>void}) {
  const stateEnd = text.indexOf('"questions"');
  const matches = text.matchAll(/"(?:nutrition|hydration|energy|morale|moisture|ordinary_opportunities_left)"\s*:\s*-?\d+(?:\.\d+)?|"(?:\\.|[^"\\])*"\s*:?|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? 0;
    const token = match[0];
    const isKey = token.trimEnd().endsWith(':');
    const isSelected = !!chosen && (token === JSON.stringify(chosen) || token === `${JSON.stringify(chosen)}:`);
    const numeric = token.match(/^"(\w+)":\s*(-?\d+(?:\.\d+)?)$/);
    const field = numeric && stateEnd > index ? numeric[1] as Field : isSelected ? 'choice' : token === `${JSON.stringify(napKey)}:` ? 'nap' : undefined;
    const hit = field && (field === active || active === 'nap' && field === 'energy');
    const className = [isSelected ? 'selected-key' : isKey || numeric ? 'key' : token.startsWith('"') ? 'str' : 'val', hit ? 'field-focus' : ''].filter(Boolean).join(' ');
    nodes.push(text.slice(cursor,index));
    nodes.push(<span key={index} className={className} data-json-field={field === 'choice' ? undefined : field} onPointerEnter={field && preview ? event=>{if(event.pointerType==='mouse')preview(field)} : undefined} onPointerLeave={field && clear ?clear:undefined}>{numeric ? <>{`"${numeric[1]}": `}<span className="val">{numeric[2]}</span></> : token}</span>);
    cursor = index + token.length;
  }
  nodes.push(text.slice(cursor));
  return <pre tabIndex={0} aria-label={label}><code id={id}>{nodes}</code></pre>;
}

function CopyBlock({ title, id, value, chosen }: { title: string; id: string; value: object | string; chosen?: string }) {
  const [notice,setNotice] = useState('');
  const timer = useRef<number>(undefined);
  const text = typeof value === 'string' ? value : JSON.stringify(value,null,2);
  useEffect(()=>()=>window.clearTimeout(timer.current),[]);
  async function copy() {
    window.clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(text); setNotice('Copied'); }
    catch {
      const node = document.getElementById(id);
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange(); range.selectNodeContents(node);
        selection.removeAllRanges(); selection.addRange(range); setNotice('Selected');
      }
    }
    timer.current=window.setTimeout(()=>setNotice(''),2200);
  }
  return <div className="jev-code-block"><div className="jev-code-title"><strong>{title}</strong><button type="button" onClick={()=>void copy()} data-copy={id}>{notice || (typeof value === 'string' ? 'Copy script' : 'Copy JSON')}</button></div><JsonCode id={id} label={title} text={text} chosen={chosen}/></div>;
}

function Bed({ moisture }: { moisture:number }) {
  return <div className="jev-bed" aria-hidden="true"><Sprite name="daisy"/>{[1,2].map(level=><Icon key={level} name="water" size={17} color={level<=moisture?'#8ed1df':'#aa8a63'}/>)}</div>;
}

function StateBoard({ id, active, control }: { id:Call; active:Field | undefined; control:FieldControl }) {
  const moment = moments[id];
  const stock = moment.request.state.stock;
  const readout = active === 'choice' ? `choice = ${JSON.stringify(moment.answer.answers.next_action.choice)}` : active === 'nap' ? `criteria = ${JSON.stringify(napKey)}` : fieldRows.find(([key])=>key===active);
  return <div className="jev-state-board" data-phase="state"><h3>{id==='garden' ? 'State for call 2' : 'Key changes since call 2'}</h3><div className="change-fields">{fieldRows.map(([field,label,,before,after,max])=>{
    const current = id==='garden' ? before : after;
    return <button type="button" key={field} {...control(field)}><span>{label}</span><strong>{id==='meal' && <span className="jev-old-value">{before} → </span>}{current}{max>0 && <small>/{max}</small>}</strong>{max>0 && <span className="jev-field-gauge" aria-hidden="true"><i style={{width:`${current/max*100}%`}}/>{id==='meal' && <b style={{left:`${before/max*100}%`}}/>}</span>}</button>;
  })}</div><div className="jev-stock"><Sprite name="bread"/><Sprite name="water"/><strong>{stock.bread} bread · {stock.water} bottles · {stock.sapling} sapling</strong><small>Same in both requests</small></div><div className="jev-readout"><span>JSON</span><code data-field-readout>{typeof readout==='string' ? readout : readout ? `${readout[2]} = ${id==='garden' ? readout[3] : readout[4]}` : 'Select a value to trace it into the request'}</code></div></div>;
}

function actionEffect(moment:Moment, action:Moment['actions'][number]) {
  const facts = factsOf(moment,action.key);
  const gains = facts.clipped_gain_on_success;
  switch (action.name) {
    case 'Water the garden': return 'Well water · no bottles · 1 energy';
    case 'Breakfast': return `+${gains?.nutrition} food, +${gains?.hydration} water · bread + bottle · 2 energy`;
    case 'Drink water': return `+${gains?.hydration} water · 1 bottle · 1 energy`;
    case 'Leisure': return '+10 morale · 1 energy';
    case 'Nap': return `+${gains?.energy} energy · no supplies`;
    default: return 'No meter gain · no supplies';
  }
}

function Exchange({ id, current, pinned, setPinned, select }: { id:Call; current:Call; pinned?:Field; setPinned:(value?:Field)=>void; select:(call:Call, jump?:boolean)=>void }) {
  const moment=moments[id];
  const reply=moment.answer.answers.next_action;
  const [phase,setPhase]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [hover,setHover]=useState<Field>();
  const [focus,setFocus]=useState<Field>();
  const root=useRef<HTMLElement>(null);
  const loop=useRef<number>(undefined);
  const active=hover || focus || (pinned==='nap' && id==='garden' ? undefined : pinned);
  const probability=(key:string)=>score(reply.probabilities,key);
  useEffect(()=>{
    window.clearTimeout(loop.current);setPlaying(false);setPhase(-1);setHover(undefined);setFocus(undefined);
    return ()=>window.clearTimeout(loop.current);
  },[current]);
  useEffect(()=>{
    if(!playing)return;
    const stop=()=>{window.clearTimeout(loop.current);setPlaying(false);};
    window.addEventListener('wheel',stop,{passive:true});
    window.addEventListener('touchmove',stop,{passive:true});
    return ()=>{window.removeEventListener('wheel',stop);window.removeEventListener('touchmove',stop);};
  },[playing]);
  function stopReplay() {
    window.clearTimeout(loop.current);
    setPlaying(false);
  }
  function revealPhase(index: number) {
    setPhase(index);
    const target = root.current?.querySelector(`[data-phase="${trace[index][0]}"]`);
    const top = target?.getBoundingClientRect().top;
    if(top !== undefined && (top < 0 || top > innerHeight - 180)) {
      target?.scrollIntoView({block:'start',behavior:reducedMotion()?'instant':'smooth'});
    }
  }
  function replay() {
    if(playing){stopReplay();setPhase(-1);return;}
    setPinned(undefined);setHover(undefined);setFocus(undefined);
    if(reducedMotion()){revealPhase((phase+1)%trace.length);return;}
    setPlaying(true);
    const show=(index:number)=>{
      revealPhase(index);
      if(index+1<trace.length) loop.current=window.setTimeout(()=>show(index+1),1800);
      else setPlaying(false);
    };
    show(0);
  }
  const control:FieldControl=(field)=>({
    'data-field':field,'aria-pressed':pinned===field,className:active===field?'field-linked':'',
    onPointerEnter:event=>{if(event.pointerType==='mouse')setHover(field)},onPointerLeave:()=>setHover(undefined),
    onFocus:event=>{if(event.currentTarget.matches(':focus-visible'))setFocus(field)},onBlur:()=>setFocus(undefined),
    onClick:event=>{
      stopReplay();setPhase(-1);
      if(pinned===field){setPinned(undefined);return;}
      setPinned(field);
      const target=root.current?.querySelector(field==='choice'?'.paired .selected-key':`.paired [data-json-field="${field}"]`);
      const bounds=target?.getBoundingClientRect();
      if (event.detail === 0 && target) target.closest('pre')?.focus({preventScroll:true});
      if(bounds && (bounds.top<12 || bounds.bottom>innerHeight-10))target?.scrollIntoView({block:'nearest',behavior:reducedMotion()?'instant':'smooth'});
    },
  });
  const highlight=(step:typeof trace[number][0])=>phase>=0&&trace[phase][0]===step?' is-active':'';
  const chosen=reply.choice;
  const result=moment.receipt;
  const clearHover=()=>setHover(undefined);
  return <section ref={root} className="exchange-moment" role="tabpanel" id={`moment-${id}`} aria-labelledby={`tab-${id}`} hidden={current!==id}>
    <div className="jev-moment-bar"><p><strong>{callLabels[id]}</strong><small>{percent(probability(chosen))} · top-ranked by Jev</small></p><button type="button" data-trace onClick={replay}><Icon name={playing?'close':'play'} size={13}/> {playing?'Stop replay':'Follow the fields'}</button></div>
    <p className="jev-trace-status" role="status" aria-live="polite" data-status>{phase>=0&&trace[phase][1]}</p>
    <div className={`jev-phase${highlight('state')}`} data-phase="state"><StateBoard id={id} active={active} control={control}/></div>
    {id==='garden'?<div className="jev-menu-status"><div><strong>Watering is available</strong><span>The daisy bed can take more water.</span></div><button type="button" aria-label="Trace key for watering" {...control('choice')}>Trace key ↓</button></div>:<div className="jev-menu-status menu-changes"><button type="button" {...control('moisture')}><b className="jev-minus">−</b><span><strong>Watering removed</strong><small>The bed is full at 2/2</small></span></button><button type="button" {...control('nap')}><b className="jev-plus">+</b><span><strong>Nap added</strong><small>Energy dropped to 99/100</small></span></button></div>}
    <div className="exchange-columns paired">
      <section className={`jev-code-block${highlight('menu')}`} data-phase="menu"><div className="jev-code-title"><h3>Reconstructed request</h3><small>{id==='garden'?1:2} of 5 options shown</small></div><JsonCode id={`${id}-request-json`} label="Reconstructed request JSON" text={compactJson(requestExcerpt(moment,id))} chosen={chosen} active={active} preview={setHover} clear={clearHover}/></section>
      <section className={`jev-code-block${highlight('answer')}`} data-phase="answer"><div className="jev-code-title"><h3>Jev’s recorded reply</h3><small>Selected action excerpt</small></div><JsonCode id={`${id}-choice-json`} label="Recorded Jev reply JSON" text={compactJson({answers:{next_action:{type:'choice',choice:chosen,probabilities:{[chosen]:probability(chosen)}}}})} chosen={chosen} active={active} preview={setHover} clear={clearHover}/><button type="button" {...control('choice')} className={`jev-key-bridge ${control('choice').className}`}><strong><code>criteria</code> → <code>choice</code></strong><span>Find this action ID in the request.</span></button><p className="jev-reply-guide">The server checks that <code>choice</code> is on the menu, then runs that action.</p>
      <div className="jev-rank"><div className="jev-rank-heading"><h3>How Jev ranked the menu</h3><p>One turn per action</p></div><ul className="rank-list" aria-label="Recorded probabilities and action costs">{moment.actions.map(action=><li key={action.key} className={action.key===chosen?'chosen':undefined}><div><strong>{action.name}</strong><small>{actionEffect(moment,action)}</small></div><div className="rating"><b>{percent(probability(action.key))}</b><span aria-hidden="true"><i style={{width:percent(probability(action.key))}}/></span></div></li>)}</ul></div></section>
    </div>
    <figure className={`jev-proof${highlight('result')}`} data-phase="result">
      <img src={images+moment.asset} width={840} height={700} loading="lazy" decoding="async" alt={id==='garden'?'Fern by the well and daisy bed':'Fern beside the pantry after breakfast'}/>
      <figcaption><h3>{id==='garden'?'The well fills the bed':'Breakfast fills both meters'}</h3><p>{id==='garden'?'Soil moisture rises from 1/2 to 2/2. The pantry still has three bread and three bottles.':'Fern spends one bread and one bottle, leaving two of each.'}</p>{id==='garden'?<Meter label="Soil moisture" value={result.after.beds[0].moisture} max={2} before={result.before.beds[0].moisture}/>:<><Meter label="Food" value={result.after.needs.nutrition} before={result.before.needs.nutrition}/><Meter label="Water" value={result.after.needs.hydration} before={result.before.needs.hydration}/></>}<a href={images+moment.asset} target="_blank" rel="noopener">{id==='garden'?'Full watering frame':'Full breakfast frame'} ↗</a></figcaption>
    </figure>
    <div className="step-switch"><button type="button" data-open-call={id==='garden'?'meal':'garden'} onClick={()=>select(id==='garden'?'meal':'garden',true)}>{id==='garden'?'Compare call 3 →':'← Compare call 2'}</button></div>
  </section>;
}

type SelectCall = (call: Call, jump?: boolean) => void;
function RuleFlow({ select }: { select:SelectCall }) {
  const {before,after} = breakfast.receipt;
  return <figure className="rule-flow" aria-labelledby="rule-flow-caption"><figcaption id="rule-flow-caption"><strong>Call 3 · From state to action</strong><a href="#exchange" data-open-call="meal" onClick={event=>{event.preventDefault();select('meal',true)}}>Open call 3 ↑</a></figcaption><ol className="rule-flow-steps">
    <li><h3>Build the menu</h3><div className="rf-inside rf-soil"><Meter label="Daisy bed" value={before.beds[0].moisture} max={2}/><div className="rf-omitted"><span>Water the garden</span><strong>Omitted</strong></div></div><p>The bed is full, so the game leaves watering out of <code>criteria</code>.</p></li>
    <li><h3>Check Jev’s answer</h3><div className="rf-inside rf-reply"><code>choice</code><strong><code>{breakfast.answer.answers.next_action.choice}</code></strong><span><Icon name="check" size={12}/> Breakfast is on the menu</span></div><p>The server checks the key against the options it sent.</p></li>
    <li><h3>Run the action</h3><div className="rf-inside rf-result"><div className="rf-spent"><span><Sprite name="bread"/><Sprite name="water"/> Bread and bottles</span><strong>{before.stock.bread} → {after.stock.bread} each</strong></div><dl><div><dt>Food meter</dt><dd>{before.needs.nutrition} → {after.needs.nutrition}</dd></div><div><dt>Water meter</dt><dd>{before.needs.hydration} → {after.needs.hydration}</dd></div></dl></div><p>Breakfast spends one of each and fills both meters.</p></li>
  </ol></figure>;
}

const timeline = [
  { tone:'water', time:'Call 2 · Step 21', action:'Water the garden', result:'Soil moisture 1 → 2', call:'garden' },
  { tone:'meal', time:'Call 3 · Step 31', action:'Have breakfast', result:'Food and water meters fill', call:'meal' },
  { tone:'sapling', time:'Game action · Step 36', action:'Plant the sapling', result:'Uses the dawn answer' },
  { tone:'leisure', time:'Call 4 · Step 41', action:'Take a break', result:'Morale rises' },
  { tone:'rest', time:'Call 5 · Step 51', action:'Take a nap', result:'Energy recovers' },
] as const;

function DayFlow({select}:{select:SelectCall}) {
  return <figure className="day-flow" aria-label="The five Jev calls and seven questions in Fern’s second day">
    <div className="day-flow__dawn"><div className="day-flow__state"><Icon name="house" size={24}/><div><strong>One starting state</strong><span>Pantry, needs, garden and parcel</span></div></div><span className="day-flow__bridge" aria-hidden="true">→</span><div className="day-flow__batch"><div className="day-flow__batch-label"><strong>Call 1 · Dawn</strong><span>Three questions share one state</span></div><div className="day-flow__fork" aria-hidden="true"/><dl className="day-flow__answers"><div><dt>Morning order</dt><dd><Icon name="mail" size={17}/> Look around, then collect the parcel</dd></div><div className="day-flow__saved-plan"><dt>Main task</dt><dd><Sprite name="sapling"/> Plant the sapling</dd></div><div><dt>Longer-term goal</dt><dd>Leave it unset</dd></div></dl></div></div>
    <div className="day-flow__handoff"><span aria-hidden="true">↓</span><Icon name="mail" size={17}/><span><strong>Game action</strong> · Fern collects the parcel</span></div>
    <div className="day-flow__later"><div className="day-flow__later-title"><strong>After dawn</strong><span>Each call reads the state left by the previous actions.</span></div><ol className="day-flow__timeline" aria-label="Later steps in order">{timeline.map(entry=>{
      const icon = entry.tone==='water'?<Icon name="water" size={17}/>:entry.tone==='meal'?<Sprite name="bread"/>:entry.tone==='sapling'?<Sprite name="sapling"/>:<Icon name={entry.tone==='rest'?'energy':'morale'} size={17}/>;
      const card=<><span className="day-flow__badge" aria-hidden="true">{icon}</span><span className="day-flow__timing">{entry.time}</span><strong>{entry.action}</strong><small>{entry.result}</small></>;
      return <li className={entry.tone==='sapling'?'day-flow__reuse':undefined} data-tone={entry.tone} key={entry.time}>{'call' in entry?<a href="#exchange" className="day-flow__call day-flow__linked" data-open-call={entry.call} onClick={event=>{event.preventDefault();select(entry.call,true)}}>{card}<b className="day-flow__open" aria-hidden="true">↗</b></a>:<div className="day-flow__call">{card}</div>}</li>;
    })}</ol></div><figcaption>Select watering or breakfast to read its request and reply.</figcaption>
  </figure>;
}

const menuCode = `criteria: Object.fromEntries(\n  offered.map(action => [\n    action.key,\n    facts(action, decision.state, memory, today),\n  ]),\n)`;
const validateCode = `const answer = result.answers?.[name];\nif (answer?.type !== 'choice' || !keys.includes(answer.choice)) {\n  throw new InferenceError('invalid_choice', true);\n}`;
const nodeExample = [
  "import { readFile } from 'node:fs/promises';",
  '',
  'const apiKey = process.env.NEAR_AI_API_KEY;',
  "if (!apiKey) throw new Error('Set NEAR_AI_API_KEY in your environment.');",
  '',
  "const body = await readFile(new URL('./choice.json', import.meta.url), 'utf8');",
  'const request = JSON.parse(body);',
  "const response = await fetch('https://cloud-api.near.ai/v1/systemone', {",
  "  method: 'POST',",
  '  headers: {',
  '    Authorization: `Bearer ${apiKey}`,',
  "    'Content-Type': 'application/json',",
  '  },',
  '  body,',
  '  signal: AbortSignal.timeout(10_000),',
  '});',
  '',
  'if (!response.ok) throw new Error(`Jev returned HTTP ${response.status}`);',
  'const result = await response.json();',
  'const answer = result.answers?.next_action;',
  'const offered = request.questions.next_action.criteria;',
  '',
  "if (answer?.type !== 'choice' ||",
  "    typeof answer.choice !== 'string' ||",
  '    !Object.hasOwn(offered, answer.choice)) {',
  "  throw new Error('Jev did not return an offered choice.');",
  '}',
  '',
  'console.log(answer.choice, offered[answer.choice].action);',
].join('\n');

export default function JevArticle() {
  const [current,setCurrent]=useState<Call>('garden');
  const [pinned,setPinned]=useState<Field>();
  const tabRef=useRef<Partial<Record<Call,HTMLButtonElement>>>({});
  const fullRequests=useRef<HTMLDetailsElement>(null);
  function select(call:Call,jump=false) {
    setCurrent(call);
    if(jump){tabRef.current[call]?.focus({preventScroll:true});tabRef.current[call]?.scrollIntoView({block:'center',behavior:reducedMotion()?'instant':'smooth'});}
  }
  function tabKey(event:KeyboardEvent<HTMLButtonElement>,id:Call) {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?'garden':event.key==='End'?'meal':id==='garden'?'meal':'garden';
    select(next);tabRef.current[next]?.focus();
  }
  const parcels:{title:string;line:string;icon:IconName}[]=[
    {title:'You pack a parcel',line:'Bread, water and a sapling.',icon:'mail'},
    {title:'The game saves the parcel',line:'Confirming records the parcel onchain with Fern’s starting save.',icon:'book'},
    {title:'The server prepares the day',line:'It reads the save and adds the supplies when Fern collects them.',icon:'house'},
  ];
  return <article className="jev-article">
    <header className="jev-hero jev-wrap"><div><nav className="jev-breadcrumb" aria-label="Breadcrumb"><a href="/blog">Blog</a><span aria-hidden="true"> / </span><span>Jev</span></nav><h1>How NEARlyHuman uses Jev</h1><p className="jev-lede">Jev picks Fern the rooster’s next action from a menu the game builds. See how that menu changes between two calls from Fern’s second day on <strong>NEAR Testnet</strong>.</p><a href="#exchange" className="jev-primary">Compare the two calls <span aria-hidden="true">↓</span></a></div><img src={`${images}fern-order-journal.webp`} width={1200} height={675} decoding="async" fetchPriority="high" alt="An illustrated journal with a pantry tray, an order slip and a marked receipt"/></header>
    <section className="jev-setup jev-wrap" aria-labelledby="setup-heading"><SectionTitle number={1} id="setup-heading">From your parcel to Fern’s pantry</SectionTitle><ol className="jev-parcel-strip">{parcels.map(({title,line,icon},index)=><li key={title}><span className="jev-parcel-art">{index===0?<><Sprite name="bread"/><Sprite name="water"/><Sprite name="sapling"/></>:<Icon name={icon} size={26}/>}</span><div><strong>{title}</strong><span>{line}</span></div></li>)}</ol></section>
    <section className="jev-wrap jev-section" id="exchange" aria-labelledby="exchange-heading"><SectionTitle number={2} id="exchange-heading">How the next request changes</SectionTitle><p className="jev-section-copy">Choose a value to highlight its field in the request. <span className="jev-desktop-hint">Hover to preview it.</span></p>
      <div className="jev-exchange"><div className="jev-exchange-bar"><strong>Fern · Day 2</strong><a href="#whole-day">All five calls ↓</a></div>
        <div className="state-transition"><div className="moment-tabs" role="tablist" aria-label="Compare saved Jev calls">{calls.map((id,i)=><button type="button" key={id} ref={node=>{if(node)tabRef.current[id]=node}} role="tab" id={`tab-${id}`} aria-selected={current===id} aria-controls={`moment-${id}`} tabIndex={current===id?0:-1} onClick={()=>select(id)} onKeyDown={event=>tabKey(event,id)}><span>Call {i+2} · Step {moments[id].slot}</span><strong>{callLabels[id]}</strong><Bed moisture={moments[id].receipt.before.beds[0].moisture}/><small>{moments[id].receipt.before.beds[0].moisture}/2 soil moisture</small></button>)}</div><p><Icon name="water" size={15}/> <span>The well fills the bed without using pantry water. At 2/2, the game takes watering off the next menu.</span></p></div>
        {calls.map(id=><Exchange key={id} id={id} current={current} pinned={pinned} setPinned={setPinned} select={select}/>)}
        <footer className="jev-exchange-foot"><code>POST /v1/systemone</code> · <code>{watering.request.model}</code> via NEAR AI Cloud. Request excerpts are reconstructed from the saved game. Reply fields come from the recorded answers.</footer>
      </div>
      <RuleFlow select={select}/>
      <details className="jev-disclosure" ref={fullRequests} id="requests"><summary>Full requests and recorded answers</summary><div className="jev-detail"><p>We rebuilt both requests with the current game code from the saved state and available actions. The replies show the model ID, chosen key and probabilities from the saved day.</p><p><code>success_chance: 1</code> means the game gives an eligible action a 100% chance of succeeding. The numbers under <code>probabilities</code> show how Jev ranked the options.</p>{calls.map(id=><section className="jev-full-pair" key={id} id={id==='garden'?'watering-request':undefined}><h3>{callLabels[id]}</h3><div className="jev-payload-columns"><CopyBlock id={`${id}-full-request`} title="Request · reconstructed" value={moments[id].request} chosen={moments[id].answer.answers.next_action.choice}/><CopyBlock id={`${id}-full-answer`} title="Answer · saved fields" value={moments[id].answer} chosen={moments[id].answer.answers.next_action.choice}/></div></section>)}</div></details>
      <details className="jev-disclosure" id="execution"><summary>How the server builds the menu and applies a reply</summary><div className="jev-detail"><p>The game offers watering when a planted bed has room for more water. The request builder pairs each eligible action’s key with its costs and effects. Once the bed is full, the next menu leaves watering out.</p><div className="jev-code-block"><div className="jev-code-title"><a href={`${source}/server/evm/choices.ts#L245-L263`}>Build the offered menu · choices.ts ↗</a></div><pre tabIndex={0}><code>{menuCode}</code></pre></div><p>The server checks the answer type and the returned key, then looks up the action and runs the game rules.</p><div className="jev-code-block"><div className="jev-code-title"><a href={`${source}/server/evm/jev.ts#L34-L37`}>Validate the returned action · jev.ts ↗</a></div><pre tabIndex={0}><code>{validateCode}</code></pre></div><p>The server records the effect. The contract checks the submitted actions and saves Fern’s final state. <a href={record.proofs.acceptanceUrl}>Day accepted ↗</a> · <a href={record.proofs.settlementUrl}>Day saved ↗</a></p></div></details>
      <details className="jev-disclosure" id="run-comparison"><summary>Compare the saved answers with two fresh replies</summary><div className="jev-detail"><p>We sent each reconstructed request once to Jev. Both choices matched the saved day, and the probabilities changed.</p><div className="rerun-grid">{calls.map((id,index)=>{
        const fresh=record.freshReplies[index];const reply=fresh.answers.next_action;const saved=moments[id].answer.answers.next_action;
        return <section key={id}><p className="jev-kicker">Step {fresh.slot}</p><h3>{callLabels[id]}</h3><p><strong>{percent(score(saved.probabilities,saved.choice))}</strong> saved → <strong>{percent(score(reply.probabilities,reply.choice))}</strong> fresh</p><details><summary>Fresh answer JSON</summary><CopyBlock id={`fresh-${fresh.slot}`} title="New reply" value={{model:fresh.model,answers:fresh.answers}} chosen={reply.choice}/></details></section>;
      })}</div></div></details>
    </section>
    <section className="jev-section jev-wrap jev-whole-day" id="whole-day" aria-labelledby="day-title"><SectionTitle number={3} id="day-title">Five calls, seven questions</SectionTitle><p className="jev-section-copy">The day opens with three questions in one request. Four more calls choose what Fern does between her other activities.</p><DayFlow select={select}/>
      <details className="jev-disclosure"><summary>See the three dawn questions</summary><div className="jev-detail"><p>All three entries under <code>questions</code> use the same <code>state</code>. Jev replies under each question name.</p><dl className="jev-dawn-plan">{record.plan.map(({question,label})=><div key={question}><dt><code>{question}</code></dt><dd>{label}</dd></div>)}</dl><CopyBlock id="dawn-json" title="Dawn request · reconstructed" value={record.dawnRequest}/></div></details>
      <details className="jev-disclosure"><summary>Run the garden example with Node.js</summary><div className="jev-detail"><p>Use Node.js 20 or newer and a NEAR AI Cloud key with Jev access. Copy the <a href="#watering-request" onClick={()=>{if(fullRequests.current)fullRequests.current.open=true}}>full watering request</a> into <code>choice.json</code>. Set <code>NEAR_AI_API_KEY</code> in your environment. Save this script beside the request as <code>choice.mjs</code> and run <code>node choice.mjs</code>.</p><CopyBlock id="client" title="choice.mjs" value={nodeExample}/></div></details>
    </section>
    <nav className="jev-wrap jev-references" aria-label="Article references"><strong>Sources</strong><a href={record.proofs.replayUrl}>Fern’s saved replay data ↗</a><a href="https://docs.typesafe.ai/primitives/choice">Jev’s Choice docs ↗</a><a href="https://typesafe.ai/blog/dont-call-it-a-decision-model">TypeSafe’s article on judgments ↗</a></nav>
  </article>;
}
