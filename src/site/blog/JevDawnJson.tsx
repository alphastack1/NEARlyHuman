import { useState, type ReactNode } from 'react';
import day from './fern-day-sequence.json';
import './jev-dawn-json.css';

const dawn = day.calls[0];
const questions = [
  { id: 'morning_order', label: 'Morning' },
  { id: 'main_undertaking', label: 'Main task' },
  { id: 'long_intention', label: 'Long-term goal' },
] as const;
type QuestionId = typeof questions[number]['id'];

function ChoiceJson({ id, text, chosen }: { id: string; text: string; chosen: string }) {
  const key = JSON.stringify(chosen);
  const highlight = text.indexOf(key);
  return <pre tabIndex={0} aria-labelledby={`${id}-title`}><code id={id}>{text.slice(0, highlight)}<mark data-dawn-chosen-key={chosen}>{key}</mark>{text.slice(highlight + key.length)}</code></pre>;
}

export default function JevDawnJson({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<QuestionId>('morning_order');
  const question = dawn.request.questions[active]!;
  const answer = dawn.answer.answers[active]!;
  const { stock, delivery_waiting_outside, project_stock_after_collection } = dawn.request.state;
  const offered = Object.entries(question.criteria);
  const alternate = offered.find(([key]) => key !== answer.choice)?.[0];
  const shown = offered.filter(([key]) => key === answer.choice || key === alternate);
  const criteria = shown.map(([key, facts]) => `      ${JSON.stringify(key)}: ${JSON.stringify('action' in facts ? { action: facts.action } : { intention: facts.intention })}`).join(',\n');
  const request = `{
  "state": {
    "stock": ${JSON.stringify(stock)},
    "delivery_waiting_outside": ${JSON.stringify(delivery_waiting_outside)},
    "project_stock_after_collection": ${JSON.stringify(project_stock_after_collection)}
  },
  "questions": {
    ${JSON.stringify(active)}: {
      "type": ${JSON.stringify(question.type)},
      "criteria": {
${criteria}
      }
    }
  }
}`;
  const reply = JSON.stringify({ answers: { [active]: answer } }, null, 2);

  return <details className="jev-dawn-json">
    <summary>Trace the dawn answers in JSON</summary>
    <div className="jev-dawn-json-inner">
      <p>Match the offered ID in <code>criteria</code> to the returned ID in <code>choice</code>.</p>
      <div className="jev-dawn-json-controls" role="group" aria-label="Question to trace">
        {questions.map(({ id, label }) => <button type="button" key={id} data-dawn-question={id} aria-pressed={id === active} aria-controls="dawn-json-excerpts" onClick={() => setActive(id)}>{label}</button>)}
      </div>
      <div className="jev-dawn-json-pair" id="dawn-json-excerpts">
        <div className="jev-code-block">
          <div className="jev-code-title"><strong id="dawn-request-excerpt-title">Request excerpt</strong>{shown.length < offered.length && <small>{shown.length} of {offered.length} options</small>}</div>
          <ChoiceJson id="dawn-request-excerpt" text={request} chosen={answer.choice}/>
        </div>
        <div className="jev-code-block">
          <div className="jev-code-title"><strong id="dawn-reply-excerpt-title">Recorded reply excerpt</strong></div>
          <ChoiceJson id="dawn-reply-excerpt" text={reply} chosen={answer.choice}/>
        </div>
      </div>
      {children}
    </div>
  </details>;
}
