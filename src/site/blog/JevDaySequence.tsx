import { useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../../app/Icons';
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
const callTabs: Record<number, { title: string; icon: IconName }> = {
  0: { title: 'Dawn', icon: 'mail' },
  21: { title: 'Garden', icon: 'water' },
  31: { title: 'Breakfast', icon: 'food' },
  41: { title: 'Break', icon: 'morale' },
  51: { title: 'Nap', icon: 'energy' },
};

const dawnQuestions = [
  {
    key: 'morning_order',
    title: 'How should the morning start?',
    criteria: 'Balance a morning routine with the time left for small actions.',
    outcome: 'Fern looked around at step 1 and collected the parcel at step 2. That left four small actions for later.',
  },
  {
    key: 'main_undertaking',
    title: 'What should the main task be?',
    criteria: 'Use materials that will be available after pickup. Prefer useful progress and consider Fern’s tastes.',
    outcome: 'Planting took one sapling from the parcel and used the empty second bed at step 36.',
  },
  {
    key: 'long_intention',
    title: 'What should Fern work toward?',
    criteria: 'Choose a modest goal using real supplies, or leave the goal unset.',
    outcome: 'The saved day kept Fern’s long-term goal unset.',
  },
] as const;

const laterCalls: Record<number, { context: string; effect: string; then?: string }> = {
  21: {
    context: 'The daisy bed is at 1/2, so watering is available. Energy is full, so the menu has no nap.',
    effect: 'The well filled the daisy bed from 1/2 to 2/2. Fern kept all three bottles.',
  },
  31: {
    context: 'The bed is now full. Watering drops out, a nap becomes possible at 99/100 energy, and breakfast can refill both food and water.',
    effect: 'One bread and one bottle brought food and water to 100.',
    then: 'Fern planted the sapling using the main task chosen at dawn.',
  },
  41: {
    context: 'At 95 food and 93 water, eating or drinking would add less than 15 points. The game leaves those options out of this routine menu.',
    effect: 'Taking a break raised morale from 60.6 to 70.6 and used one energy.',
  },
  51: {
    context: 'Food and water are still high enough to leave meals and drinks off the menu. A nap can refill the seven missing energy points.',
    effect: 'Jev returned the nap key. Fern’s energy went from 93 to 100.',
    then: 'The game ran its bedtime rules and saved the day.',
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

function QuestionCard({ field, question, answer, title, prompt, outcome }: {
  field: string; question: ChoiceQuestion; answer: ChoiceReply; title: string; prompt: string; outcome?: string;
}) {
  const choices = Object.entries(question.criteria).filter((entry): entry is [string, OptionFacts] => entry[1] !== undefined);
  const scores = answer.probabilities;
  const chosenScore = scores?.[answer.choice];
  const tied = chosenScore !== undefined && choices.filter(([key]) => scores?.[key] === chosenScore).length > 1;
  if (scores) choices.sort(([a], [b]) => (scores[b] ?? 0) - (scores[a] ?? 0) || Number(b === answer.choice) - Number(a === answer.choice));
  return <section className="jev-day-question">
    <header className="jev-day-question-title">
      <div><h4>{title}</h4>{scores && <span>Jev’s scores</span>}</div>
      <p><strong>Task</strong> {prompt}</p>
    </header>
    <ul className="jev-day-options" aria-label="Offered options and Jev’s choice">
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
    </ul>
    <div className="jev-day-key">
      <span><code>{field}.criteria</code> <b aria-hidden="true">→</b> <code>{field}.choice</code></span>
      <code>{JSON.stringify(answer.choice)}</code>
    </div>
    {tied && <p className="jev-day-tie"><strong>{percent(chosenScore!)} each.</strong> The reply named the nap. It gave no tie-break explanation.</p>}
    {outcome && <p className="jev-day-outcome">{outcome}</p>}
  </section>;
}

function StateStrip({ call }: { call: SavedCall }) {
  const { needs, stock, garden, project_stock_after_collection: afterPickup } = call.request.state;
  const stats: { label: string; value: number; icon: IconName; max: number }[] = [
    { label: 'Food', value: needs.nutrition, icon: 'food', max: 100 },
    { label: 'Hydration', value: needs.hydration, icon: 'water', max: 100 },
    { label: 'Energy', value: needs.energy, icon: 'energy', max: 100 },
    { label: 'Morale', value: needs.morale, icon: 'morale', max: 100 },
    { label: 'Daisy bed', value: garden[0].moisture, icon: 'leaf', max: 2 },
  ];
  return <div className="jev-day-state">
    <h4>{call.slot === 0 ? 'One state shared by three questions' : 'State at this call'}</h4>
    <dl className="jev-day-stats">
      {stats.map(({ label, value, icon, max }) => <div key={label} data-meter={icon}>
        <dt><Icon name={icon} size={12}/> {label}</dt>
        <dd><strong>{value}</strong><small>/{max}</small>
          <span aria-hidden="true"><i style={{ width: percent(value / max) }}/></span>
        </dd>
      </div>)}
      <div className="jev-day-pantry">
        <dt><Icon name="house" size={12}/> Pantry</dt>
        <dd>{stock.bread ?? 0} bread · {stock.water ?? 0} bottles{stock.sapling ? ` · ${stock.sapling} sapling` : ''}</dd>
      </div>
    </dl>
    {afterPickup && <p className="jev-day-parcel"><Icon name="mail" size={16}/><span><strong>In the parcel</strong> {afterPickup.bread - (stock.bread ?? 0)} bread · {afterPickup.water - (stock.water ?? 0)} bottle · {afterPickup.sapling} sapling. After pickup, the pantry has {afterPickup.bread} bread and {afterPickup.water} bottles, plus the sapling.</span></p>}
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

export default function JevDaySequence({ number = 2 }: { number?: number }) {
  const [current, setCurrent] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const call = calls[current];
  const isDawn = call.slot === 0;
  const later = laterCalls[call.slot];
  const chosenKeys = new Set(Object.values(call.answer.answers).map(reply => reply!.choice));
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
    <div className="jev-section-title"><span aria-hidden="true">{number}</span><h2 id="day-title">Follow all five calls</h2></div>
    <p className="jev-section-copy">At dawn, Jev answers three questions in one request. Later, it answers one at a time using Fern’s updated state. Each step number marks a point in the game’s timeline.</p>
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
          <small>Step {slot}</small>
        </button>)}
      </div>
      <div role="tabpanel" id="jev-day-call" aria-labelledby={`jev-day-tab-${call.slot}`} tabIndex={0}>
        <div className="jev-day-call-heading">
          <h3>Call {current + 1} · {call.request.state.phase}</h3>
          <span>{isDawn ? '3 questions' : '1 question'} <b aria-hidden="true">→</b> {isDawn ? '3 choices' : '1 choice'}</span>
        </div>
        <div className="jev-day-call-body">
          <StateStrip call={call}/>
          {isDawn ? <>
            <p className="jev-day-context">The saved plan preserves which option Jev chose for each question. It doesn’t include dawn scores.</p>
            <div className="jev-day-dawn">
              {dawnQuestions.map(({ key, title, criteria, outcome }) => <QuestionCard
                key={key} field={key} question={call.request.questions[key]!} answer={call.answer.answers[key]!}
                title={title} prompt={criteria} outcome={outcome}
              />)}
            </div>
          </> : <>
            <p className="jev-day-context">{later.context}</p>
            <QuestionCard field="next_action" question={call.request.questions.next_action!} answer={call.answer.answers.next_action!}
              title="What should Fern do next?" prompt="Choose one small action around the main task. Put urgent care first and weigh the cost of using supplies."/>
            <p className="jev-day-effect"><Icon name="check" size={16}/><strong>What happened</strong><span>{later.effect}</span></p>
            {call.slot === 31 && later.then && <GameStep step={36} icon="leaf">{later.then}</GameStep>}
            {call.slot === 51 && later.then && <GameStep step={60} icon="house">{later.then}</GameStep>}
          </>}
          <details key={call.slot} className="jev-day-json">
            <summary>Inspect request and reply JSON</summary>
            <div className="jev-day-json-body">
              <p>The reconstructed request includes the full prompts. The reply shows the fields the game kept.</p>
              <div className="jev-payload-columns">
                <Payload id={`jev-call-${call.slot}-request`} title="Reconstructed request" data={call.request} keys={chosenKeys} showQuestions/>
                <Payload id={`jev-call-${call.slot}-answer`} title="Recorded reply fields" data={call.answer} keys={chosenKeys}/>
              </div>
            </div>
          </details>
          {(call.slot === 21 || call.slot === 31) && <a href="#exchange" className="jev-day-closeup">Compare the watering and breakfast calls ↓</a>}
          <nav className="jev-day-step-controls" aria-label="Read the previous or next call">
            {current > 0 && <button type="button" onClick={() => jumpTo(current - 1)}>← {callTabs[calls[current - 1].slot].title}</button>}
            {current < calls.length - 1 && <button type="button" data-next onClick={() => jumpTo(current + 1)}>{callTabs[calls[current + 1].slot].title} →</button>}
          </nav>
        </div>
      </div>
    </div>
  </section>;
}
