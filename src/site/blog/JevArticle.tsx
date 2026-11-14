import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Icon } from '../../app/Icons';
import { itemImage } from '../../art/items';
import JevDaySequence from './JevDaySequence';
import sequence from './fern-day-sequence.json';
import record from './fern-day-two.json';
import './jev-article.css';

const images = '/site/blog/jev/';
const source = `https://github.com/alphastack1/NEARlyHuman/blob/${record.revision}`;
const calls = ['garden', 'meal'] as const;
type Call = typeof calls[number];
type RoutineCall = Extract<typeof sequence.calls[number], { receipt: object }>;
const routine = (slot:number) => sequence.calls.find((call): call is RoutineCall => call.slot===slot && !!call.receipt)!;
const watering = {...routine(21), asset:'fern-day2-21.png'};
const breakfast = {...routine(31), asset:'fern-day2-31.png'};
type Moment = typeof watering;
const moments = { garden: watering, meal: breakfast };
const napKey = Object.entries(breakfast.request.questions.next_action.criteria).find(([, option])=>option?.action==='Take a nap')![0];
const callLabels = { garden: 'Before watering', meal: 'After watering' };

const fieldRows = [
  ['nutrition', 'Food', 'needs.nutrition', watering.request.state.needs.nutrition, breakfast.request.state.needs.nutrition, 100],
  ['hydration', 'Hydration', 'needs.hydration', watering.request.state.needs.hydration, breakfast.request.state.needs.hydration, 100],
  ['energy', 'Energy', 'needs.energy', watering.request.state.needs.energy, breakfast.request.state.needs.energy, 100],
  ['morale', 'Morale', 'needs.morale', watering.request.state.needs.morale, breakfast.request.state.needs.morale, 100],
  ['moisture', 'Daisy bed', 'garden[0].moisture', watering.request.state.garden[0].moisture, breakfast.request.state.garden[0].moisture, 2],
  ['ordinary_opportunities_left', 'Small actions left', 'ordinary_opportunities_left', watering.request.state.opportunities.ordinary_opportunities_left, breakfast.request.state.opportunities.ordinary_opportunities_left, 0],
] as const;
const napField = `option:${napKey}` as const;
type Field = typeof fieldRows[number][0] | 'choice' | `option:${string}`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Sprite({ name }: { name: 'bread' | 'water' | 'sapling' | 'daisy' }) {
  return <img className="jev-sprite" src={itemImage({ water: 0, bread: 2, sapling: 21, daisy: 22 }[name])} width={28} height={28} alt=""/>;
}

function SectionTitle({ number, id, children }: { number: number; id: string; children: ReactNode }) {
  return <div className="jev-section-title"><span aria-hidden="true">{number}</span><h2 id={id}>{children}</h2></div>;
}

function Meter({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  return <div className="meter-row"><div><span>{label}</span><strong>{value}/{max}</strong></div><span className="meter-track" aria-hidden="true"><i style={{ '--current': `${value / max * 100}%` } as CSSProperties}/></span></div>;
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

function requestExcerpt(moment: Moment) {
  const question = moment.request.questions.next_action;
  const criteria = Object.fromEntries(Object.entries(question.criteria).map(([key, facts]) => [key, { action:facts.action }]));
  return {state:stateExcerpt(moment), questions:{next_action:{type:question.type,criteria}}};
}

function compactJson(value: object) {
  return JSON.stringify(value, null, 2)
    .replace(/("(?:needs|stock|opportunities|use|clipped_gain_on_success|probabilities)": )\{\n([^{}]+?)\n\s*\}/g, (_,name,body)=>`${name}{ ${body.trim().replace(/\n\s*/g,' ')} }`)
    .replace(/\{\n\s*("action": "[^"\n]+")\n\s*\}/g, '{ $1 }')
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
    const candidate = token.match(/^"(\d+:\d+:\d+:[\d,]+)"\s*:?$/)?.[1];
    const field = numeric && stateEnd > index ? numeric[1] as Field : isSelected ? 'choice' : candidate ? `option:${candidate}` as const : undefined;
    const hit = field && (field === active || active === napField && field === 'energy');
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
  const readout = active === 'choice' ? `choice = ${JSON.stringify(moment.answer.answers.next_action.choice)}` : active?.startsWith('option:') ? `criteria[${JSON.stringify(active.slice(7))}]` : fieldRows.find(([key])=>key===active);
  return <div className="jev-state-board"><h3>{id==='garden' ? 'State for call 2' : 'Key changes since call 2'}</h3><div className="change-fields">{fieldRows.map(([field,label,,before,after,max])=>{
    const current = id==='garden' ? before : after;
    return <button type="button" key={field} {...control(field)}><span>{label}</span><strong>{id==='meal' && <span className="jev-old-value">{before} → </span>}{current}{max>0 && <small>/{max}</small>}</strong>{max>0 && <span className="jev-field-gauge" aria-hidden="true"><i style={{width:`${current/max*100}%`}}/>{id==='meal' && <b style={{left:`${before/max*100}%`}}/>}</span>}</button>;
  })}</div><div className="jev-stock"><Sprite name="bread"/><Sprite name="water"/><strong>{stock.bread} bread · {stock.water} bottles · {stock.sapling} sapling</strong><small>Same in both requests</small></div><div className="jev-readout"><span>JSON</span><code data-field-readout>{typeof readout==='string' ? readout : readout ? `${readout[2]} = ${id==='garden' ? readout[3] : readout[4]}` : 'Select a value to trace it into the request'}</code></div></div>;
}

function Exchange({ id, current, pinned, setPinned, select }: { id:Call; current:Call; pinned?:Field; setPinned:(value?:Field)=>void; select:(call:Call, jump?:boolean)=>void }) {
  const moment=moments[id];
  const reply=moment.answer.answers.next_action;
  const [hover,setHover]=useState<Field>();
  const [focus,setFocus]=useState<Field>();
  const root=useRef<HTMLElement>(null);
  const active=hover || focus || pinned;
  useEffect(()=>{setHover(undefined);setFocus(undefined);},[current]);
  const control:FieldControl=(field)=>({
    'data-field':field,'aria-pressed':pinned===field,className:active===field?'field-linked':'',
    onPointerEnter:event=>{if(event.pointerType==='mouse')setHover(field)},onPointerLeave:()=>setHover(undefined),
    onFocus:event=>{if(event.currentTarget.matches(':focus-visible'))setFocus(field)},onBlur:()=>setFocus(undefined),
    onClick:event=>{
      if(pinned===field){setPinned(undefined);return;}
      setPinned(field);
      const selector=field==='choice'?'.paired .selected-key':'.paired [data-json-field="'+field+'"]';
      const target=root.current?.querySelector(selector);
      const bounds=target?.getBoundingClientRect();
      if(event.detail===0 && target) target.closest('pre')?.focus({preventScroll:true});
      if(bounds && (bounds.top<20 || bounds.bottom>innerHeight-16))target?.scrollIntoView({block:'center',behavior:reducedMotion()?'instant':'smooth'});
    },
  });
  const chosen=reply.choice;
  const result=moment.receipt;
  const preview=(field:Field)=>setHover(field);
  const clear=()=>setHover(undefined);
  return <section ref={root} className="exchange-moment" role="tabpanel" id={'moment-'+id} aria-labelledby={'tab-'+id} hidden={current!==id}>
    <div className="jev-phase"><StateBoard id={id} active={active} control={control}/></div>
    {id==='garden'?<div className="jev-menu-status"><div><strong>The bed has room for water.</strong><span>Watering is in the menu.</span></div><button type="button" aria-label="Trace Jev's chosen watering key" {...control('choice')}>Trace key ↓</button></div>:<div className="jev-menu-status menu-changes"><button type="button" {...control('moisture')}><b className="jev-minus">−</b><span><strong>Watering removed</strong><small>The bed is full at 2/2</small></span></button><button type="button" {...control(napField)}><b className="jev-plus">+</b><span><strong>Nap added</strong><small>Energy dropped to 99/100</small></span></button></div>}
    <div className="exchange-columns paired">
      <section className="jev-code-block"><div className="jev-code-title"><h3>Request excerpt</h3><small>All five options</small></div><JsonCode id={id+'-request-json'} label="Reconstructed request JSON excerpt" text={compactJson(requestExcerpt(moment))} chosen={chosen} active={active} preview={preview} clear={clear}/></section>
      <section className="jev-code-block"><div className="jev-code-title"><h3>Recorded reply</h3><small>One selected key</small></div><JsonCode id={id+'-choice-json'} label="Recorded Jev reply JSON" text={JSON.stringify({answers:moment.answer.answers},null,2)} chosen={chosen} active={active} preview={preview} clear={clear}/><button type="button" {...control('choice')} className={'jev-key-bridge '+control('choice').className}><strong><code>criteria</code> → <code>choice</code></strong><span>Find this action ID in the request.</span></button><p className="jev-reply-guide">The server checks that <code>choice</code> is on the menu, then runs that action.</p></section>
    </div>
    <figure className="jev-proof">
      <img src={images+moment.asset} width={840} height={700} loading="lazy" decoding="async" alt={id==='garden'?'Fern by the well and daisy bed':'Fern beside the pantry after breakfast'}/>
      <figcaption><h3>{id==='garden'?'The well fills the bed':'Breakfast fills both meters'}</h3><p>{id==='garden'?'Soil moisture rises from 1/2 to 2/2. The pantry still has three bread and three bottles.':'Fern spends one bread and one bottle, leaving two of each.'}</p>{id==='garden'?<Meter label="Soil moisture" value={result.after.beds[0].moisture} max={2}/>:<><Meter label="Food" value={result.after.needs.nutrition}/><Meter label="Water" value={result.after.needs.hydration}/></>}<a href={images+moment.asset} target="_blank" rel="noopener">{id==='garden'?'Full watering frame':'Full breakfast frame'} ↗</a></figcaption>
    </figure>
    <div className="step-switch"><button type="button" onClick={()=>select(id==='garden'?'meal':'garden',true)}>{id==='garden'?'See the next request →':'← Back to watering'}</button></div>
  </section>;
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
  function select(call:Call,jump=false) {
    if(call !== current) setPinned(undefined);
    setCurrent(call);
    if(jump){tabRef.current[call]?.focus({preventScroll:true});tabRef.current[call]?.scrollIntoView({block:'center',behavior:reducedMotion()?'instant':'smooth'});}
  }
  function tabKey(event:KeyboardEvent<HTMLButtonElement>,id:Call) {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?'garden':event.key==='End'?'meal':id==='garden'?'meal':'garden';
    select(next);tabRef.current[next]?.focus();
  }
  return <article className="jev-article">
    <header className="jev-hero jev-wrap">
      <div><nav className="jev-breadcrumb" aria-label="Breadcrumb"><a href="/blog">Blog</a><span aria-hidden="true"> / </span><span>Jev</span></nav>
        <h1>How NEARlyHuman uses Jev</h1>
        <p className="jev-lede">You pack a parcel for Fern, a rooster. The game builds a menu from Fern’s saved state. Jev, TypeSafe’s AI model, picks an action and sends its ID back for the game to run.</p>
        <a href="#whole-day" className="jev-primary">Follow Fern’s day <span aria-hidden="true">↓</span></a>
      </div>
      <img src={images+'fern-order-journal.webp'} width={1200} height={675} decoding="async" fetchPriority="high" alt="An illustrated journal with a pantry tray, an order slip and a marked receipt"/>
    </header>
    <section className="jev-setup jev-wrap" aria-labelledby="setup-heading">
      <SectionTitle number={1} id="setup-heading">What goes in, what comes back</SectionTitle>
      <ol className="jev-teaching-flow">
        <li><div><Icon name="house" size={16}/><strong>Game reads the save</strong></div><code>state</code><p>Needs, pantry, garden, and what Fern has already done.</p></li>
        <li><div><Icon name="book" size={16}/><strong>Game builds a menu</strong></div><code>questions → criteria</code><p>Each question sends instructions, with an ID and facts for every offered action.</p></li>
        <li><div><Icon name="brain" size={16}/><strong>Jev returns a choice</strong></div><code>answers → choice</code><p>The chosen ID tells the game what to run. The scores show how Jev weighed the options.</p></li>
        <li><div><Icon name="check" size={16}/><strong>Game applies the action</strong></div><code>choice → updated state</code><p>The server checks the ID against the menu. Game rules update Fern’s home and needs.</p></li>
      </ol>
    </section>
    <JevDaySequence />
    <section className="jev-wrap jev-section" id="exchange" aria-labelledby="exchange-heading">
      <SectionTitle number={3} id="exchange-heading">How one action changes the next request</SectionTitle>
      <p className="jev-section-copy">The well fills the daisy bed. The next menu drops watering and adds a nap. Choose a value to find it in the JSON. <span className="jev-desktop-hint">Hover to preview.</span></p>
      <div className="jev-exchange"><div className="jev-exchange-bar"><strong>Two consecutive calls</strong><a href="#whole-day">All five calls ↑</a></div>
        <div className="state-transition"><div className="moment-tabs" role="tablist" aria-label="Compare saved Jev calls">{calls.map((id,i)=><button type="button" key={id} ref={node=>{if(node)tabRef.current[id]=node}} role="tab" id={'tab-'+id} aria-selected={current===id} aria-controls={'moment-'+id} tabIndex={current===id?0:-1} onClick={()=>select(id)} onKeyDown={event=>tabKey(event,id)}><span>Call {i+2} · Step {moments[id].slot}</span><strong>{callLabels[id]}</strong><Bed moisture={moments[id].receipt.before.beds[0].moisture}/><small>{moments[id].receipt.before.beds[0].moisture}/2 soil moisture</small></button>)}</div></div>
        {calls.map(id=><Exchange key={id} id={id} current={current} pinned={pinned} setPinned={setPinned} select={select}/>)}
        <footer className="jev-exchange-foot"><code>POST /v1/systemone</code> · <code>{watering.request.model}</code> via NEAR AI Cloud. Request excerpts were rebuilt from the saved day. Jev’s <code>probabilities</code> rank the options. The game sets each action’s <code>success_chance</code> separately.</footer>
      </div>
      <details className="jev-disclosure" id="execution"><summary>Server code and onchain receipts</summary><div className="jev-detail"><p>The request builder pairs each offered action’s key with its costs and effects. The reply handler checks the answer type and verifies that the returned key was offered.</p><div className="jev-payload-columns"><div className="jev-code-block"><div className="jev-code-title"><a href={source+'/server/evm/choices.ts#L245-L263'}>Build the menu · choices.ts ↗</a></div><pre tabIndex={0}><code>{menuCode}</code></pre></div><div className="jev-code-block"><div className="jev-code-title"><a href={source+'/server/evm/jev.ts#L33-L43'}>Validate the key · jev.ts ↗</a></div><pre tabIndex={0}><code>{validateCode}</code></pre></div></div><p>The contract checks the submitted actions and saves Fern’s final state. <a href={record.proofs.acceptanceUrl}>Day accepted ↗</a> · <a href={record.proofs.settlementUrl}>Day saved ↗</a></p></div></details>
      <details className="jev-disclosure"><summary>Run the garden request with Node.js</summary><div className="jev-detail"><p>Use Node.js 20 or newer and a NEAR AI Cloud key with Jev access. In <a href="#whole-day">Fern’s day</a>, choose Garden and copy the reconstructed request into <code>choice.json</code>. Set <code>NEAR_AI_API_KEY</code> in your environment. Save this script beside the request as <code>choice.mjs</code> and run <code>node choice.mjs</code>.</p><CopyBlock id="client" title="choice.mjs" value={nodeExample}/></div></details>
    </section>
    <nav className="jev-wrap jev-references" aria-label="Article references"><strong>Sources</strong><a href={record.proofs.replayUrl}>Fern’s saved replay data ↗</a><a href="https://docs.typesafe.ai/primitives/choice">Jev’s Choice docs ↗</a><a href="https://typesafe.ai/blog/dont-call-it-a-decision-model">TypeSafe’s article on judgments ↗</a></nav>
  </article>;
}
