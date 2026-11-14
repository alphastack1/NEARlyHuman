import { useRef, useState } from 'react';
import { Icon, type IconName } from '../../app/Icons';
import day from './fern-day-sequence.json';
import './jev-choice-lens.css';

type Call = Extract<(typeof day.calls)[number], { receipt: object }>;
const at = (slot: 21 | 31) => day.calls.find((call): call is Call => call.slot === slot && !!call.receipt)!;
const garden = at(21);
const breakfast = at(31);
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

export default function JevChoiceLens() {
  const [slot, setSlot] = useState<21 | 31>(21);
  const [pinned, setPinned] = useState<string>();
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const nextTab = useRef<HTMLButtonElement>(null);
  const jsonHeading = useRef<HTMLHeadingElement>(null);
  const isGarden = slot === 21;
  const call = isGarden ? garden : breakfast;
  const { state, questions: { next_action: question } } = call.request;
  const answer = call.answer.answers.next_action;
  const entry = hovered ?? focused ?? pinned ?? answer.choice;
  const candidates = Object.entries(question.criteria).sort(([a], [b]) => scoreFor(call, b) - scoreFor(call, a));
  const fact = question.criteria[entry as keyof typeof question.criteria]!;
  const pinnedFact = question.criteria[(pinned ?? answer.choice) as keyof typeof question.criteria]!;
  const after = call.receipt.after;

  function selectCall(next: typeof slot) {
    setSlot(next);
    setPinned(undefined);
    setHovered(undefined);
    setFocused(undefined);
  }

  return <section className="jev-wrap jev-section jev-lens" id="exchange" aria-labelledby="jev-lens-heading">
    <div className="jev-section-title"><span aria-hidden="true">1</span><h2 id="jev-lens-heading">Follow one choice</h2></div>
    <p className="jev-section-copy">At midday, the game asks what Fern should do next. Follow the answer into the garden, then see how it changes the next request.</p>
    <div className="jev-lens-board">
      <div className="jev-lens-switch" role="group" aria-label="Compare two requests">
        <button type="button" aria-pressed={isGarden} onClick={() => selectCall(21)}><Icon name="leaf" size={16}/><span><strong>Before watering</strong><small>Call 2 · Step 21</small></span></button>
        <button ref={nextTab} type="button" aria-pressed={!isGarden} onClick={() => selectCall(31)}><Icon name="food" size={16}/><span><strong>After watering</strong><small>Call 3 · Step 31</small></span></button>
      </div>
      <div className="jev-lens-state-heading"><strong>State excerpt</strong><code>state.garden[0].moisture</code></div>
      <dl className="jev-lens-state" aria-label="Part of the state sent to Jev">
        <div><dt><Icon name="leaf" size={14}/> Daisy bed</dt><dd>{state.garden[0].moisture}/2 moisture</dd></div>
        <div><dt><Icon name="energy" size={14}/> Energy</dt><dd>{state.needs.energy}/100</dd></div>
        <div><dt><Icon name="food" size={14}/> Food · Hydration</dt><dd>{state.needs.nutrition}/100 · {state.needs.hydration}/100</dd></div>
      </dl>
      <p className="jev-lens-change">
        {isGarden ? <>The bed has room for water. Fern has full energy.</> : <><span>− <strong>Watering</strong> at 2/2 moisture</span><span>+ <strong>Nap</strong> at 99/100 energy</span></>}
      </p>
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
          <p className="jev-lens-note">Jev’s <code>probabilities</code> rank the options. The game sets the chance each action succeeds.</p>
        </div>
        <figure className="jev-lens-result">
          <a href={art + (isGarden ? 'fern-day2-21.png' : 'fern-day2-31.png')} target="_blank" rel="noopener" aria-label={isGarden ? 'Open the watering scene' : 'Open the breakfast scene'}>
            <img width={840} height={700} src={art + (isGarden ? 'fern-day2-21.png' : 'fern-day2-31.png')} decoding="async" loading="lazy" alt="" />
          </a>
          <figcaption>
            <strong><Icon name="check" size={13}/> {isGarden ? 'Fern waters the bed' : 'Fern has breakfast'}</strong>
            <p>{isGarden ? <>The well fills the bed from {call.receipt.before.beds[0].moisture}/2 to {after.beds[0].moisture}/2. Fern keeps all {after.stock.water} bottles.</> : <>Fern spends one bread and one bottle to refill both meters. Drinking would only refill hydration.</>}</p>
            {isGarden && <button type="button" className="jev-lens-next-request" onClick={() => {
              selectCall(31);
              nextTab.current?.focus({ preventScroll: true });
              nextTab.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
            }}>See the next request <span aria-hidden="true">↑</span></button>}
          </figcaption>
        </figure>
        <div className="jev-lens-trace">
          <div className="jev-lens-trace-heading"><h3 ref={jsonHeading} id="jev-lens-json" tabIndex={-1}>Match the ID in JSON</h3><p className="jev-lens-note">Select an option to trace it.</p></div>
          <SentOption action={fact.action} gains={'clipped_gain_on_success' in fact ? fact.clipped_gain_on_success : undefined} use={fact.use} energy={fact.energy_cost}/>
          <ExchangeJson call={call} optionKey={entry}/>
          <p className="jev-lens-note">Excerpts from the reconstructed request and saved reply.</p>
        </div>
      </div>
      <footer className="jev-lens-footer">
        <a href="#whole-day">See all five calls and the full JSON <span aria-hidden="true">↓</span></a>
      </footer>
    </div>
  </section>;
}
