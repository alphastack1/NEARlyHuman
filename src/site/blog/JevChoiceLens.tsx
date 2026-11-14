import { useRef, useState } from 'react';
import { Icon, type IconName } from '../../app/Icons';
import { itemImage } from '../../art/items';
import day from './fern-day-sequence.json';
import './jev-choice-lens.css';

type Call = Extract<(typeof day.calls)[number], { receipt: object }>;
const at = (slot: 21 | 31) => day.calls.find((call): call is Call => call.slot === slot && !!call.receipt)!;
const garden = at(21);
const breakfast = at(31);
type Slot = 21 | 31;
const comparison = [
  { call: garden, slot: 21, label: 'Before watering', time: 'Midday' },
  { call: breakfast, slot: 31, label: 'After watering', time: 'Afternoon' },
] as const;
const art = '/site/blog/jev/';
const asPercent = (score: number) => `${Math.round(score * 100)}%`;
const scoreFor = (call: Call, key: string) => {
  const scores: Readonly<Record<string, number | undefined>> = call.answer.answers.next_action.probabilities;
  return scores[key]!;
};

const options: Record<string, { title: string; icon: IconName }> = {
  'Water the garden': { title: 'Water the garden', icon: 'leaf' },
  'Have breakfast': { title: 'Have breakfast', icon: 'food' },
  'Have a drink water': { title: 'Drink water', icon: 'water' },
  'Enjoy a little quiet': { title: 'Take a break', icon: 'morale' },
  'Take a quiet moment': { title: 'Pass the turn', icon: 'pause' },
  'Take a nap': { title: 'Take a nap', icon: 'energy' },
};
const meterNames: Readonly<Record<string, string>> = { nutrition: 'food', hydration: 'hydration' };

function SentOption({ action, gains, use, energy }: {
  action: string; gains?: Record<string, number>; use: Record<string, number | undefined>; energy: number;
}) {
  const effects = Object.entries(gains ?? {})
    .filter(([, value]) => value > 0)
    .map(([name, value]) => `+${value} ${meterNames[name] ?? name}`);
  const costs = Object.entries(use).map(([name, value]) => `${value} ${name === 'water' ? 'bottle' : name}`);
  if (energy) costs.push(`${energy} energy`);
  if (action === 'Water the garden') effects.push('Fills bed from the well');
  if (action === 'Take a quiet moment') effects.push('Uses a turn without changing meters');
  return <p className="jev-lens-tradeoff">
    <strong>{options[action].title}</strong>
    {effects.length > 0 && <span>{effects.join(' · ')}</span>}
    {costs.length > 0 && <span>Costs {costs.join(' + ')}</span>}
  </p>;
}

function ExchangeJson({ call, optionKey }: { call: Call; optionKey: string }) {
  const question = call.request.questions.next_action;
  const reply = call.answer.answers.next_action;
  const facts = question.criteria[optionKey as keyof typeof question.criteria]!;
  const key = JSON.stringify(optionKey);
  const choice = JSON.stringify(reply.choice);
  return <div className="jev-lens-json">
    <section aria-labelledby="lens-request-heading">
      <h4 id="lens-request-heading">Sent in <code>questions</code></h4>
      <pre aria-labelledby="lens-request-heading"><code>{'{\n  "next_action": {\n    "type": "choice",\n    "criteria": {\n      '}<mark data-lens-request-key={optionKey}>{key}</mark>{': {\n        "action": '}{JSON.stringify(facts.action)}{',\n        "use": '}{JSON.stringify(facts.use)}{',\n        "energy_cost": '}{facts.energy_cost}{'\n      }\n    }\n  }\n}'}</code></pre>
    </section>
    <section aria-labelledby="lens-reply-heading">
      <h4 id="lens-reply-heading">Returned in <code>answers</code></h4>
      <pre aria-labelledby="lens-reply-heading"><code>{'{\n  "next_action": {\n    "type": "choice",\n    "choice": '}<mark className="jev-lens-picked-key" data-lens-reply-choice={reply.choice}>{choice}</mark>{',\n    "probabilities": {\n      '}<mark data-lens-reply-key={optionKey}>{key}</mark>{': '}{scoreFor(call, optionKey)}{'\n    }\n  }\n}'}</code></pre>
    </section>
  </div>;
}

function RequestSnapshot({ call, slot, label, time, onInspect }: typeof comparison[number] & { onInspect: (slot: Slot) => void }) {
  const { state, questions: { next_action: question } } = call.request;
  const { choice } = call.answer.answers.next_action;
  const moisture = state.garden[0].moisture;
  const picked = options[question.criteria[choice as keyof typeof question.criteria]!.action];
  const isBefore = slot === 21;
  return <section className="jev-lens-snapshot" aria-label={`${label} · Step ${slot}`}>
    <header><span>{time} · Step {slot}</span><h3>{label}</h3></header>
    <div className="jev-lens-bed" aria-hidden="true">
      <img src={itemImage(22)} width={28} height={28} alt=""/>
      {[1, 2].map(drop => <Icon name="water" key={drop} size={16} color={drop <= moisture ? '#a4e3eb' : '#9e7955'}/>)}
    </div>
    <dl className="jev-lens-snapshot-facts">
      <div><dt>Daisy bed</dt><dd>{moisture}/2 moisture</dd></div>
      <div><dt>Energy</dt><dd>{state.needs.energy}/100</dd></div>
    </dl>
    <ul className="jev-lens-delta" aria-label="Menu changes">
      <li className={isBefore ? 'is-in' : 'is-out'}><span aria-hidden="true">{isBefore ? '✓' : '−'}</span> Watering {isBefore ? 'offered' : 'removed'}</li>
      <li className={isBefore ? 'is-out' : 'is-in'}><span aria-hidden="true">{isBefore ? '−' : '+'}</span> {isBefore ? 'Nap unavailable' : 'Nap added'}</li>
    </ul>
    <div className="jev-lens-snapshot-choice"><small>Jev returned</small><strong>{picked.title}</strong><b>{asPercent(scoreFor(call, choice))} score</b></div>
    <button className="jev-lens-inspect-button" type="button" aria-label={`Inspect Step ${slot} menu and JSON`} aria-controls="jev-lens-inspector" onClick={() => onInspect(slot)}>Inspect call <span aria-hidden="true">↓</span></button>
  </section>;
}

export default function JevChoiceLens() {
  const [slot, setSlot] = useState<Slot>(21);
  const [pinned, setPinned] = useState<string>();
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const inspector = useRef<HTMLDetailsElement>(null);
  const controls = useRef<Partial<Record<Slot, HTMLButtonElement>>>({});
  const jsonHeading = useRef<HTMLHeadingElement>(null);
  const call = slot === 21 ? garden : breakfast;
  const { state, questions: { next_action: question } } = call.request;
  const answer = call.answer.answers.next_action;
  const entry = hovered ?? focused ?? pinned ?? answer.choice;
  const candidates = Object.entries(question.criteria).sort(([a], [b]) => scoreFor(call, b) - scoreFor(call, a));
  const fact = question.criteria[entry as keyof typeof question.criteria]!;
  const pinnedFact = question.criteria[(pinned ?? answer.choice) as keyof typeof question.criteria]!;

  function selectCall(next: Slot) {
    setSlot(next);
    setPinned(undefined);
    setHovered(undefined);
    setFocused(undefined);
  }

  function inspectCall(next: Slot) {
    selectCall(next);
    if (inspector.current) inspector.current.open = true;
    controls.current[next]?.focus({ preventScroll: true });
    controls.current[next]?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  return <section className="jev-wrap jev-section jev-lens" id="exchange" aria-labelledby="jev-lens-heading">
    <div className="jev-section-title"><span aria-hidden="true">2</span><h2 id="jev-lens-heading">Why watering leaves the menu</h2></div>
    <p className="jev-section-copy">The next call gets fresh options because Fern’s actions change what the game allows.</p>
    <div className="jev-lens-board">
      <div className="jev-lens-snapshots" aria-label="How the menu changes from Step 21 to Step 31">
        {comparison.map(snapshot => <RequestSnapshot key={snapshot.slot} {...snapshot} onInspect={inspectCall}/>)}
      </div>
      <figure className="jev-lens-result">
        <a href={art + 'fern-day2-21.png'} target="_blank" rel="noopener" aria-label="Open the saved watering scene">
          <img width={840} height={700} src={art + 'fern-day2-21.png'} decoding="async" loading="lazy" alt=""/>
        </a>
        <figcaption>
          <strong><Icon name="water" size={13}/> Between the calls</strong>
          <p>The well fills the bed and uses one energy. Breakfast stays available.</p>
        </figcaption>
      </figure>
      <details className="jev-lens-inspector" id="jev-lens-inspector" ref={inspector}>
      <summary>Compare the menus and JSON</summary>
      <div className="jev-lens-switch" role="group" aria-label="Compare two requests">
        {comparison.map(({ slot: step, label }) => <button key={step} type="button" aria-pressed={step === slot} onClick={() => selectCall(step)} ref={node => { controls.current[step] = node ?? undefined; }}><span>{label} <small>Step {step}</small></span></button>)}
      </div>
      <div className="jev-lens-state-heading"><strong>Daisy bed · {state.garden[0].moisture}/2 moisture</strong><code>state.garden[0].moisture</code></div>
      <div className="jev-lens-choice">
        <div className="jev-lens-menu">
          <div className="jev-lens-menu-heading"><h3>What should Fern do next?</h3><p><span>Instruction excerpt</span> “{question.instructions.split('. ')[0]}.”</p><span>Jev’s scores</span></div>
          <ol className="jev-lens-options" aria-label="All five offered options">
            {candidates.map(([key, candidate]) => {
              const { title, icon } = options[candidate.action];
              const chosen = answer.choice === key;
              const score = asPercent(scoreFor(call, key));
              return <li key={key}>
                <button type="button" aria-pressed={key === (pinned ?? answer.choice)}
                  data-lens-option={key} data-active={key === entry || undefined} data-chosen={chosen || undefined}
                  onClick={() => setPinned(key)}
                  onPointerMove={event => { if (event.pointerType === 'mouse') setHovered(key); }}
                  onPointerLeave={() => setHovered(undefined)}
                  onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFocused(key); }}
                  onBlur={() => setFocused(undefined)}>
                  <Icon name={icon} size={16}/>
                  <span>{title}{chosen && <small><Icon name="check" size={10}/> Chosen</small>}</span>
                  <span className="jev-lens-score">{score}<span aria-hidden="true"><i style={{ width: score }}/></span></span>
                </button>
              </li>;
            })}
          </ol>
          <a className="jev-lens-code-jump" href="#jev-lens-json" onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            jsonHeading.current?.focus({ preventScroll: true });
            jsonHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
          }}><span>See JSON <span aria-hidden="true">·</span> <strong>{options[pinnedFact.action].title}</strong></span> <span aria-hidden="true">↓</span></a>
          <p className="jev-lens-note">The scores compare options. Game rules determine whether an action succeeds.</p>
        </div>
        <div className="jev-lens-trace">
          <div className="jev-lens-trace-heading"><h3 ref={jsonHeading} id="jev-lens-json" tabIndex={-1}>Match the ID in JSON</h3><p className="jev-lens-note">Select an option to trace it.</p></div>
          <SentOption action={fact.action} gains={'clipped_gain_on_success' in fact ? fact.clipped_gain_on_success : undefined} use={fact.use} energy={fact.energy_cost}/>
          <ExchangeJson call={call} optionKey={entry}/>
          <p className="jev-lens-note">Excerpts from the reconstructed request and saved reply.</p>
        </div>
      </div>
      </details>
    </div>
  </section>;
}
