import { useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../../app/Icons';
import { itemImage } from '../../art/items';
import JevDawnJson from './JevDawnJson';
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
type ChoiceQuestion = { instructions: string; criteria: Record<string, OptionFacts | undefined> };
type ChoiceReply = { type: string; choice: string; probabilities?: Record<string, number | undefined> };
type SavedCall = {
  slot: number;
  request: {
    state: {
      phase: string;
      needs: { nutrition: number; hydration: number; energy: number; morale: number };
      stock: { bread?: number; water?: number; sapling?: number };
      project_stock_after_collection?: { bread: number; water: number; sapling: number };
      garden: { moisture: number }[];
    };
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
  {
    key: 'morning_order',
    title: 'How should Fern start?',
    criteria: 'Decide whether a quiet look is worth using one of the day’s small actions before pickup.',
  },
  {
    key: 'main_undertaking',
    title: 'What should Fern work on?',
    criteria: 'Choose a main task from the materials Fern will have after pickup.',
  },
  {
    key: 'long_intention',
    title: 'What should Fern work toward?',
    criteria: 'Choose a goal to work toward over several days, or leave it open.',
  },
] as const;

const laterCalls: Record<number, { context: string; effect: string; then?: string }> = {
  21: {
    context: 'The daisy bed has room for water. Fern is fully rested, so the game leaves naps off the menu.',
    effect: 'The well filled the daisy bed. Fern kept all three bottles of drinking water.',
  },
  31: {
    context: 'Watering filled the bed and used one energy. The game removes watering and adds a nap. Breakfast is still available.',
    effect: 'One bread and one bottle brought food and hydration to 100.',
    then: 'The game plants the sapling using the dawn answer.',
  },
  41: {
    context: 'Fern is still well fed. Eating or drinking could restore less than 15 points, so the game leaves those options out of this menu.',
    effect: 'Taking a break raised morale from 60.6 to 70.6 and used one energy.',
  },
  51: {
    context: 'The game offers the same three options as in the evening. This time, a nap can restore seven energy.',
    effect: 'Fern took a nap. Energy went from 93 to 100.',
    then: 'The game applies its bedtime rules and saves the day.',
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

function OptionList({ question, answer }: { question: ChoiceQuestion; answer: ChoiceReply }) {
  const choices = Object.entries(question.criteria).filter((entry): entry is [string, OptionFacts] => entry[1] !== undefined);
  const scores = answer.probabilities;
  if (scores) choices.sort(([a], [b]) => (scores[b] ?? 0) - (scores[a] ?? 0) || Number(b === answer.choice) - Number(a === answer.choice));
  return <ul className="jev-day-options" aria-label="Offered options and Jev’s choice">
    {choices.map(([key, facts]) => {
      const chosen = key === answer.choice;
      const score = scores?.[key];
      const tradeoff = optionTradeoff(facts);
      return <li key={key} data-picked={chosen || undefined}>
        <div>
          <strong>{optionLabel(facts)}</strong>
          {tradeoff && <small>{tradeoff}</small>}
        </div>
        <div className="jev-day-option-result">
          {chosen && <span className="jev-day-picked"><Icon name="check" size={10}/> Chosen</span>}
          {score !== undefined && <span className="jev-day-score">
            <b>{percent(score)}</b>
            <span aria-hidden="true"><i style={{ width: percent(score) }}/></span>
          </span>}
        </div>
      </li>;
    })}
  </ul>;
}

function DawnQuestion({ question, answer, title, prompt }: {
  question: ChoiceQuestion; answer: ChoiceReply; title: string; prompt: string;
}) {
  const optionCount = Object.keys(question.criteria).length;
  return <section className="jev-day-dawn-card">
    <header>
      <h4>{title}</h4>
      <div><Icon name="check" size={12}/><strong>{optionLabel(question.criteria[answer.choice]!)}</strong></div>
    </header>
    <details>
      <summary aria-label={`${title} Show ${optionCount} options`}>Show {optionCount} options</summary>
      <p className="jev-day-dawn-task">{prompt}</p>
      <OptionList question={question} answer={answer}/>
    </details>
  </section>;
}

function RoutineQuestion({ question, answer }: { question: ChoiceQuestion; answer: ChoiceReply }) {
  const chosenScore = answer.probabilities?.[answer.choice];
  const tied = chosenScore !== undefined && Object.values(answer.probabilities ?? {}).filter(score => score === chosenScore).length > 1;
  return <section className="jev-day-question">
    <header className="jev-day-question-title">
      <div><h4>Options sent to Jev</h4><span>Jev’s scores</span></div>
    </header>
    <OptionList question={question} answer={answer}/>
    {tied && <p className="jev-day-tie"><strong>Nap and Break both scored {percent(chosenScore)}.</strong> Jev returned Nap’s ID, which the game used. The reply gives no reason for the tie-break.</p>}
  </section>;
}

function DawnHandoff({ state }: { state: SavedCall['request']['state'] }) {
  const { stock, project_stock_after_collection: afterPickup } = state;
  if(!afterPickup) return null;
  return <div className="jev-day-handoff">
    <div className="jev-dawn-parcel">
      <div aria-hidden="true">{[2,0,21].map(item=><img key={item} src={itemImage(item)} width={25} height={25} alt=""/>)}</div>
      <span><strong>Parcel outside</strong><small>One bread, one bottle, one sapling</small></span>
    </div>
    <span className="jev-dawn-handoff-arrow" aria-hidden="true">→</span>
    <div className="jev-dawn-packet">
      <Icon name="mail" size={24}/><span><strong>One request to Jev</strong><small>One shared <code>state</code> · three questions</small></span>
    </div>
    <p>The pantry has {stock.bread} bread and {stock.water} bottles. The game includes the parcel supplies when it offers tasks for later.</p>
  </div>;
}

function RoutineState({ call }: { call: SavedCall }) {
  const { needs, garden } = call.request.state;
  const meters = {
    nutrition: {label:'Food', value:needs.nutrition, max:100, icon:'food'},
    hydration: {label:'Hydration', value:needs.hydration, max:100, icon:'water'},
    energy: {label:'Energy', value:needs.energy, max:100, icon:'energy'},
    morale: {label:'Morale', value:needs.morale, max:100, icon:'morale'},
    bed: {label:'Daisy bed', value:garden[0].moisture, max:2, icon:'leaf'},
  } satisfies Record<string, {label:string; value:number; max:number; icon:IconName}>;
  const relevant = call.slot === 21 ? [meters.bed,meters.energy] : call.slot === 31 ? [meters.bed,meters.energy,meters.nutrition,meters.hydration] : call.slot === 41 ? [meters.nutrition,meters.hydration,meters.morale] : [meters.energy,meters.morale];
  return <div className="jev-routine-state">
    <p>{laterCalls[call.slot].context}</p>
    <dl aria-label="State fields relevant to this call">{relevant.map(({label,value,max,icon})=><div key={label}>
      <dt><Icon name={icon} size={13}/> {label}</dt><dd>{value}<small>/{max}</small></dd>
    </div>)}</dl>
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

function GameStep({ step, icon, children }: { step: number; icon: IconName; children: string }) {
  return <p className="jev-day-game-step"><Icon name={icon} size={15}/><strong>Game only · Step {step}</strong><span>{children}</span></p>;
}

export default function JevDaySequence() {
  const [current, setCurrent] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const call = calls[current];
  const isDawn = call.slot === 0;
  const later = laterCalls[call.slot];
  const routineQuestion = call.request.questions.next_action;
  const routineAnswer = call.answer.answers.next_action;
  const chosenKeys = new Set(Object.values(call.answer.answers).map(reply => reply!.choice));
  const fullPayload = <details key={call.slot} className="jev-day-json">
    <summary>Open the full request and saved reply</summary>
    <div className="jev-day-json-body">
      <p>Reconstructed request and saved reply fields.{isDawn && ' The replay did not store dawn scores.'}</p>
      <div className="jev-payload-columns">
        <Payload id={`jev-call-${call.slot}-request`} title="Reconstructed request" data={call.request} keys={chosenKeys} showQuestions/>
        <Payload id={`jev-call-${call.slot}-answer`} title="Recorded reply fields" data={call.answer} keys={chosenKeys}/>
      </div>
    </div>
  </details>;
  function jumpTo(next: number) {
    setCurrent(next);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({ block: 'nearest' });
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const last = calls.length - 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? last :
      event.key === 'ArrowLeft' ? (current === 0 ? last : current - 1) :
      event.key === 'ArrowRight' ? (current === last ? 0 : current + 1) : undefined;
    if (next === undefined) return;
    event.preventDefault();
    jumpTo(next);
  }
  return <section className="jev-wrap jev-section jev-day" id="whole-day" aria-labelledby="day-title">
    <div className="jev-section-title"><span aria-hidden="true">1</span><h2 id="day-title">A plan at dawn, then four fresh choices</h2></div>
    <div className="jev-day-explorer">
      <div className="jev-day-banner"><strong>Fern · Day 2</strong><span>NEAR Testnet</span></div>
      <div className="jev-day-tabs" role="tablist" aria-label="Jev calls in order">
        {calls.map(({ slot }, index) => <button
          key={slot}
          ref={node => { buttons.current[index] = node; }}
          type="button"
          role="tab"
          id={`jev-day-tab-${slot}`}
          aria-controls="jev-day-call"
          aria-selected={index === current}
          tabIndex={index === current ? 0 : -1}
          onClick={() => setCurrent(index)}
          onKeyDown={onTabKey}
        >
          <Icon name={callTabs[slot].icon} size={16}/>
          <strong>{callTabs[slot].title}</strong>
          <small>{callTabs[slot].action}</small>
        </button>)}
      </div>
      <div role="tabpanel" id="jev-day-call" aria-labelledby={`jev-day-tab-${call.slot}`} tabIndex={0}>
        <div className="jev-day-call-heading">
          <h3>Call {current + 1} · {call.request.state.phase}</h3>
          <span>Step {call.slot}{!isDawn && ' · 1 question'}</span>
        </div>
        <div className="jev-day-call-body">
          {isDawn ? <>
            <DawnHandoff state={call.request.state}/>
            <h4 className="jev-day-reply-label">Jev picks one option per question</h4>
            <div className="jev-day-dawn">
              {dawnQuestions.map(({ key, title, criteria }) => <DawnQuestion
                key={key} question={call.request.questions[key]!} answer={call.answer.answers[key]!}
                title={title} prompt={criteria}
              />)}
            </div>
            <div className="jev-dawn-match">
              <span><strong>Offered ID</strong> <code>{call.answer.answers.morning_order?.choice}</code></span>
              <span aria-hidden="true">→</span>
              <span><strong>Jev returns</strong> <code>{call.answer.answers.morning_order?.choice}</code></span>
              <span aria-hidden="true">→</span>
              <span><strong>Game runs</strong> Look, then collect</span>
            </div>
            <JevDawnJson>{fullPayload}</JevDawnJson>
          </> : routineQuestion && routineAnswer && <>
            <RoutineState call={call}/>
            <RoutineQuestion question={routineQuestion} answer={routineAnswer}/>
            <p className="jev-day-game-result"><Icon name="check" size={14}/><span><strong>Game result</strong> {later.effect}</span></p>
            {call.slot === 31 && later.then && <GameStep step={36} icon="leaf">{later.then}</GameStep>}
            {call.slot === 51 && later.then && <GameStep step={60} icon="house">{later.then}</GameStep>}
          </>}
          {!isDawn && fullPayload}
          <nav className="jev-day-step-controls" aria-label="Read the previous or next call">
            {current > 0 && <button type="button" onClick={() => jumpTo(current - 1)}>← {callTabs[calls[current - 1].slot].title}</button>}
            {current < calls.length - 1 && <button type="button" data-next onClick={() => jumpTo(current + 1)}>{callTabs[calls[current + 1].slot].title} →</button>}
          </nav>
        </div>
      </div>
    </div>
    <p className="jev-day-bridge"><Icon name="leaf" size={17}/><span><strong>Step 36 · Plant the sapling</strong> The game uses the dawn answer here.</span></p>
  </section>;
}
