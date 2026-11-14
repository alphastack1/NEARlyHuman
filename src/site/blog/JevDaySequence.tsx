import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../../app/Icons';
import { itemImage } from '../../art/items';
import day from './fern-day-sequence.json';
import './jev-day-sequence.css';

type OptionFacts = {
  action?: string;
  intention?: string;
  clipped_gain_on_success?: Record<string, number>;
  energy_cost?: number;
  use?: Record<string, number | undefined>;
  wood_target?: number;
  ordinary_opportunities_left_after_this_morning?: number;
};
type ChoiceQuestion = { criteria: Record<string, OptionFacts | undefined> };
type ChoiceReply = { choice: string; probabilities?: Record<string, number | undefined> };
type SavedCall = {
  slot: number;
  request: {
    questions: Record<string, ChoiceQuestion | undefined>;
  };
  answer: { answers: Record<string, ChoiceReply | undefined> };
};

const calls: readonly SavedCall[] = day.calls;
const callTabs: Record<number, { title: string; action: string; icon: IconName }> = {
  0: { title: 'Dawn', action: '3 choices', icon: 'mail' },
  21: { title: 'Midday', action: 'Water', icon: 'water' },
  31: { title: 'Afternoon', action: 'Eat', icon: 'food' },
  41: { title: 'Evening', action: 'Break', icon: 'morale' },
  51: { title: 'Bedtime', action: 'Nap', icon: 'energy' },
};

const dawnQuestions = [
  { key:'morning_order', title:'Morning', icon:'mail', effect:'Fern looks around, then collects the parcel.' },
  { key:'main_undertaking', title:'Main task', icon:'leaf', effect:'The game uses this answer at step 36 to plant the parcel’s sapling.' },
  { key:'long_intention', title:'Long-term goal', icon:'focus', effect:'Fern leaves the goal unset.' },
] as const;

const laterCalls: Record<number, { context: string; effect: string }> = {
  21: {
    context: 'The daisy bed has room for water. Fern is fully rested.',
    effect: 'The well filled the daisy bed. Fern kept all three bottles of drinking water.',
  },
  31: {
    context: 'The bed is full. Watering is off the menu, and a nap is available.',
    effect: 'One bread and one bottle brought food and hydration to 100.',
  },
  41: {
    context: 'Eating or drinking would restore less than 15 points. The game leaves both off this menu.',
    effect: 'Taking a break raised morale from 60.6 to 70.6 and used one energy.',
  },
  51: {
    context: 'The game offers the same three options as in the evening. This time, a nap can restore seven energy.',
    effect: 'Fern took a nap. Energy went from 93 to 100.',
  },
};

const labels: Record<string, string> = {
  'Plant Wood tree': 'Plant the sapling',
  'Have a drink water': 'Drink water',
  'Enjoy a little quiet': 'Take a break',
  'Take a quiet moment': 'Pass the turn',
};
const gainNames: Record<string, string> = { nutrition: 'food', hydration: 'water' };
const percent = (value: number) => `${Math.round(value * 100)}%`;
const optionLabel = (facts: OptionFacts) => labels[facts.action ?? ''] ?? facts.action ?? facts.intention ?? '';

function optionTradeoff(facts: OptionFacts) {
  if (facts.wood_target) return `${facts.wood_target} wood needed`;
  if (facts.ordinary_opportunities_left_after_this_morning !== undefined) {
    return `${facts.ordinary_opportunities_left_after_this_morning} small actions left`;
  }
  const recovery = Object.entries(facts.clipped_gain_on_success ?? {})
    .filter(([, amount]) => amount > 0)
    .map(([meter, amount]) => `+${amount} ${gainNames[meter] ?? meter}`);
  const supplies = Object.entries(facts.use ?? {}).map(([item, count]) => `−${count} ${item === 'water' ? 'bottle' : item}`);
  const energy = facts.energy_cost ? [`−${facts.energy_cost} energy`] : [];
  if (facts.action === 'Water the garden') return 'Fill the bed from the well · −1 energy';
  if (facts.action === 'Take a quiet moment') return 'Uses the turn · no meter changes';
  if (facts.action === 'Have an unhurried afternoon') return 'No supplies or meter changes';
  if (facts.action === 'Clear a planting') return 'Remove the plant · −3 energy';
  return [...recovery, ...supplies, ...energy].join(' · ');
}

function CallPicture({ call, playback, paused }: { call: SavedCall; playback: number; paused: boolean }) {
  const dawn = call.slot===0;
  const later = laterCalls[call.slot];
  const questions = dawn ? dawnQuestions : [{key:'next_action', title:'Next action', icon:callTabs[call.slot].icon, effect:later.effect}];
  const [activeQuestion,setActiveQuestion] = useState<string>(questions[0].key);
  const [pinned,setPinned] = useState<string>();
  const [hovered,setHovered] = useState<string>();
  const [focused,setFocused] = useState<string>();
  const circuitRef = useRef<HTMLDivElement>(null);
  const [visible,setVisible] = useState(false);
  const active = questions.find(question => question.key===activeQuestion)!;
  const offered = call.request.questions[active.key]!;
  const reply = call.answer.answers[active.key]!;
  const inspected = hovered ?? focused ?? pinned ?? reply.choice;
  const inspectedFacts = offered.criteria[inspected]!;
  const tradeoff = optionTradeoff(inspectedFacts);
  const options = Object.entries(offered.criteria).filter((entry): entry is [string, OptionFacts] => entry[1] !== undefined);
  if(reply.probabilities) options.sort(([a],[b]) => (reply.probabilities?.[b] ?? 0)-(reply.probabilities?.[a] ?? 0));

  useEffect(()=>{
    const circuit = circuitRef.current;
    if(!circuit) return;
    const observer = new IntersectionObserver(([entry])=>setVisible(entry.intersectionRatio >= .25), {threshold:.25});
    observer.observe(circuit);
    return ()=>observer.disconnect();
  },[]);

  function selectQuestion(key: string) {
    setActiveQuestion(key);
    setPinned(undefined);
    setHovered(undefined);
    setFocused(undefined);
  }

  return <div className="jev-picture" data-flow-running={visible && !paused && !hovered && !focused || undefined}>
    <div className="jev-picture-state">
      <span className="jev-picture-state-icon" aria-hidden="true">
        {dawn ? [2,0,21].map(item => <img key={item} src={itemImage(item)} width={25} height={25} alt=""/>) : <Icon name={callTabs[call.slot].icon} size={25}/>}
      </span>
      <p><strong>{dawn ? 'Parcel at the door' : 'State at this call'}</strong>
        {dawn ? 'Bread, a bottle and a sapling wait in the parcel.' : later.context}</p>
    </div>

    <div className="jev-picture-packet">
      <span><strong>Request</strong><small>State + menu</small></span>
      <span className="jev-picture-calltag">1 call</span>
      <span><strong>Reply</strong><small>{dawn ? '3 selected IDs' : '1 selected ID'}</small></span>
    </div>
    <div className="jev-picture-circuit" ref={circuitRef} data-question-count={questions.length}>
      <div className="jev-picture-model"><Icon name="brain" size={21}/><strong>Jev</strong><i className="jev-model-glow" key={playback} aria-hidden="true"/></div>
      {questions.map(({key,title,icon}, index)=>{
        const menu = call.request.questions[key]!;
        const answer = call.answer.answers[key]!;
        const selected = optionLabel(menu.criteria[answer.choice]!);
        const route = <><span className="jev-picture-in"><Icon name={icon} size={15}/><span><strong>{title}</strong><small>{Object.keys(menu.criteria).length} options</small></span></span>
          <span aria-hidden="true" className="jev-picture-wire">
            <span className="jev-wire-in">{index===Math.floor(questions.length/2) && <i className="jev-input-packet" key={playback}/>}</span>
            <span className="jev-wire-out"><i className="jev-reply-packet" key={playback}/></span>
          </span>
          <span className="jev-picture-out"><strong>{selected}</strong>
            <code data-returned-id={answer.choice} data-id-match={(key===active.key && inspected===answer.choice) || undefined}>{answer.choice}<i className="jev-id-glow" key={playback} aria-hidden="true"/></code>
          </span></>;
        return dawn ? <button type="button" className="jev-picture-route" key={key} data-question-route={key}
          aria-pressed={key===active.key} aria-controls="jev-question-trace" onClick={()=>selectQuestion(key)}>{route}</button>
          : <div className="jev-picture-route" key={key} data-question-route={key}>{route}</div>;
      })}
    </div>

    <div className="jev-picture-result">
      <span className="jev-picture-result-mark"><Icon name="check" size={16}/></span>
      <div><p><strong>Game result</strong>{active.effect}</p>
        {call.slot===51 && <p className="jev-picture-note">Nap and Break tied at 47%. The reply named Nap.</p>}
        {call.slot===31 && <p className="jev-picture-note">At step 36, Fern plants the sapling using the dawn answer.</p>}
      </div>
    </div>

    <div className="jev-picture-trace" id="jev-question-trace">
      <div className="jev-picture-options">
        <div className="jev-picture-caption"><strong>{dawn ? `${active.title} options` : 'Offered options'}</strong>{reply.probabilities && <small>Jev’s scores</small>}</div>
        <ul aria-label="Options in this question">{options.map(([key,facts])=>{
          const value = reply.probabilities?.[key];
          const chosen = key===reply.choice;
          return <li key={key}><button type="button" data-option-id={key} data-preview={key===inspected || undefined}
            data-chosen={chosen || undefined} aria-pressed={key===(pinned ?? reply.choice)}
            onClick={()=>setPinned(key)}
            onPointerMove={event=>{if(event.pointerType==='mouse')setHovered(key);}} onPointerLeave={()=>setHovered(undefined)}
            onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))setFocused(key);}} onBlur={()=>setFocused(undefined)}>
            <span>{optionLabel(facts)} {chosen && <small className="jev-picture-chosen"><Icon name="check" size={10}/> Chosen</small>}</span>
            {value!==undefined && <span className="jev-picture-score"><i aria-hidden="true" style={{width:percent(value)}}/>{percent(value)}</span>}
          </button></li>;
        })}</ul>
      </div>
      <div className="jev-picture-code">
        <div className="jev-inspected-id"><code>criteria</code><code data-offered-id={inspected}>{inspected}</code>{tradeoff && <span>{tradeoff}</span>}</div>
        {reply.probabilities && <p className="jev-picture-legend">Scores rank options. Game rules decide success.</p>}
      </div>
    </div>
  </div>;
}

function Payload({ title, data, id, keys, showQuestions = false }: {
  title: string; data: unknown; id: string; keys: Set<string>; showQuestions?: boolean;
}) {
  const [notice, setNotice] = useState('');
  const pane = useRef<HTMLPreElement>(null);
  const code = useRef<HTMLElement>(null);
  const questionField = useRef<HTMLSpanElement>(null);
  const text = JSON.stringify(data, null, 2);
  function jumpToQuestions() {
    const scroller = pane.current;
    const target = questionField.current;
    if (!scroller || !target) return;
    const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.focus({ preventScroll: true });
    scroller.scrollTop += offset - 10;
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied');
    } catch {
      const selection = window.getSelection();
      if (!selection || !code.current) return;
      const range = document.createRange();
      range.selectNodeContents(code.current);
      selection.removeAllRanges();
      selection.addRange(range);
      setNotice('Selected');
    }
  }
  return <section className="jev-code-block">
    <div className="jev-code-title">
      <h4>{title}</h4>
      <div className="jev-day-payload-controls">
        {showQuestions && <button type="button" onClick={jumpToQuestions}>Jump to questions ↓</button>}
        <button type="button" onClick={() => void copy()} aria-label={`Copy ${title.toLowerCase()} JSON`}>{notice || 'Copy JSON'}</button>
      </div>
    </div>
    <pre ref={pane} tabIndex={0} aria-label={`${title} JSON`}><code ref={code} id={id}>{text.split(/("(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b)/).map((part, i, parts) => {
      if (i % 2 === 0) return part;
      const isKey = part.startsWith('"') && parts[i + 1]?.startsWith(':');
      const isQuestions = isKey && part === '"questions"' && showQuestions;
      const style = keys.has(part.slice(1, -1)) ? 'selected-key' : isKey ? 'key' : part.startsWith('"') ? 'str' : 'val';
      return <span key={i} ref={isQuestions ? questionField : undefined} className={style}>{part}</span>;
    })}</code></pre>
  </section>;
}

export default function JevDaySequence() {
  const [current,setCurrent] = useState(0);
  const [playback,setPlayback] = useState(0);
  const [paused,setPaused] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const call = calls[current];
  const dawn = call.slot===0;
  const chosenKeys = new Set(Object.values(call.answer.answers).map(reply=>reply!.choice));

  function playCall(next: number) {
    setCurrent(next);
    setPlayback(count=>count+1);
  }

  function jumpTo(next: number) {
    playCall(next);
    buttons.current[next]?.focus({preventScroll:true});
    buttons.current[next]?.scrollIntoView({block:'nearest'});
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const last = calls.length-1;
    const next = event.key==='Home' ? 0 : event.key==='End' ? last
      : event.key==='ArrowLeft' ? (current===0 ? last : current-1)
      : event.key==='ArrowRight' ? (current===last ? 0 : current+1) : undefined;
    if(next===undefined) return;
    event.preventDefault();
    jumpTo(next);
  }

  return <section className="jev-wrap jev-section jev-day" id="whole-day" aria-labelledby="day-title">
    <div className="jev-section-title"><span aria-hidden="true">1</span><h2 id="day-title">Follow the call through Jev</h2></div>
    <div className="jev-day-explorer">
      <div className="jev-day-banner"><strong>Fern · Day 2</strong><div className="jev-day-banner-end"><span>NEAR Testnet</span>
        <button type="button" className="jev-flow-toggle" aria-label={paused ? 'Play animation' : 'Pause animation'} title={paused ? 'Play animation' : 'Pause animation'} onClick={()=>setPaused(value=>!value)}>
          <Icon name={paused ? 'play' : 'pause'} size={13}/>
        </button>
      </div></div>
      <div className="jev-day-tabs" role="tablist" aria-label="Jev calls in order">
        {calls.map(({slot},index)=><button key={slot}
          ref={node=>{buttons.current[index]=node;}}
          type="button" role="tab" id={'jev-day-tab-'+slot} aria-controls="jev-day-call"
          aria-selected={index===current} tabIndex={index===current ? 0 : -1} onClick={()=>playCall(index)} onKeyDown={onTabKey}>
          <Icon name={callTabs[slot].icon} size={16}/><strong>{callTabs[slot].title}</strong><small>{callTabs[slot].action}</small>
        </button>)}
      </div>
      <div className="jev-day-body" id="jev-day-call" role="tabpanel" aria-labelledby={'jev-day-tab-'+call.slot} tabIndex={0}>
        <CallPicture key={call.slot} call={call} playback={playback} paused={paused}/>
        <div className="jev-picture-foot">
          <small>Call {current+1} · Game step {call.slot}</small>
          <details key={call.slot} className="jev-day-json">
            <summary>Request &amp; reply JSON</summary>
            <div className="jev-day-json-body">
              <p>Reconstructed request and saved reply fields.{dawn && ' The replay did not store dawn scores.'}</p>
              <div className="jev-payload-columns">
                <Payload id={'jev-call-'+call.slot+'-request'} title="Reconstructed request" data={call.request} keys={chosenKeys} showQuestions/>
                <Payload id={'jev-call-'+call.slot+'-answer'} title="Recorded reply fields" data={call.answer} keys={chosenKeys}/>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </section>;
}
