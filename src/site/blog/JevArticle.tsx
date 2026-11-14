import { Fragment, useRef, useState } from 'react';
import { JEV_POST } from '../blog-catalog';
import JevChoiceLens from './JevChoiceLens';
import JevDaySequence from './JevDaySequence';
import sequence from './fern-day-sequence.json';
import record from './fern-day-two.json';
import './jev-article.css';

const source = 'https://github.com/alphastack1/NEARlyHuman/blob/' + record.revision;
const wateringRequest = JSON.stringify(sequence.calls.find(call => call.slot === 21)!.request, null, 2);
const menuCode = 'criteria: Object.fromEntries(\n  offered.map(action => [\n    action.key,\n    facts(action, decision.state, memory, today),\n  ]),\n)';
const validateCode = "const answer = result.answers?.[name];\nif (answer?.type !== 'choice' || !keys.includes(answer.choice)) {\n  throw new InferenceError('invalid_choice', true);\n}";
const plantingId = sequence.calls[0].answer.answers.main_undertaking!.choice;
const plantingFields = [
  ['op', 'Plant'],
  ['arg', 'Bed 2 · zero-based index'],
  ['variant', 'Wood tree'],
  ['goods', 'Empty shipment slots'],
] as const;

function PlantingId() {
  const values = plantingId.split(':');
  return <figure className="jev-key-figure" aria-labelledby="jev-key-title">
    <figcaption id="jev-key-title"><strong>Plant the sapling in bed 2</strong><code className="jev-key-signature">{plantingFields.map(([field], index) => <Fragment key={field}>{index > 0 && ':'}<span>{values[index]}</span></Fragment>)}</code></figcaption>
    <dl>{plantingFields.map(([field, meaning], index) => <div key={field}>
      <dt><code className="jev-key-value">{values[index]}</code> <code>{field}</code></dt>
      <dd>{meaning}</dd>
    </div>)}</dl>
  </figure>;
}

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

function RunnableExample() {
  const [notice, setNotice] = useState('');
  const code = useRef<HTMLElement>(null);
  const requestUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(wateringRequest + '\n');

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(nodeExample);
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

  return <details className="jev-disclosure" id="run-example">
    <summary>Run the midday request with Node.js</summary>
    <div className="jev-detail">
      <ol className="jev-instructions">
        <li><a href={requestUrl} download="choice.json">Download choice.json ↓</a> and save the script as <code>choice.mjs</code> beside it.</li>
        <li>Set <code>NEAR_AI_API_KEY</code> to a NEAR AI Cloud key with Jev access.</li>
        <li>Run <code>node choice.mjs</code> on Node.js 20 or newer to print the returned ID and action.</li>
      </ol>
      <div className="jev-code-block">
        <div className="jev-code-title"><strong>choice.mjs</strong><button type="button" onClick={copyScript}>{notice || 'Copy script'}</button></div>
        <pre tabIndex={0} aria-label="Node.js runnable example"><code ref={code}>{nodeExample}</code></pre>
      </div>
    </div>
  </details>;
}

export default function JevArticle() {
  return <article className="jev-article">
    <header className="jev-hero jev-wrap">
      <div>
        <nav className="jev-breadcrumb" aria-label="Breadcrumb"><a href="/blog">Blog</a><span aria-hidden="true"> / </span><span>Jev</span></nav>
        <h1>How NEARlyHuman uses Jev</h1>
        <p className="jev-lede">The game sends Jev a snapshot of Fern’s world and a menu of options. TypeSafe’s model returns one option ID per question. The game checks the IDs and applies its own rules.</p>
        <a href="#whole-day" className="jev-primary">Follow Fern’s day <span aria-hidden="true">↓</span></a>
      </div>
      <div className="jev-hero-art"><img src={JEV_POST.image.href} width={JEV_POST.image.width} height={JEV_POST.image.height} decoding="async" fetchPriority="high" alt={JEV_POST.image.alt}/></div>
    </header>

    <JevDaySequence />
    <JevChoiceLens />

    <section className="jev-wrap jev-section jev-build" aria-labelledby="build-title">
      <div className="jev-section-title"><span aria-hidden="true">3</span><h2 id="build-title">Try a Jev request</h2></div>
      <RunnableExample />
      <details className="jev-disclosure" id="execution">
        <summary>How the game checks the returned ID</summary>
        <div className="jev-detail">
          <p>NEARlyHuman makes the IDs. Jev returns one from the menu it received.</p>
          <PlantingId />
          <div className="jev-payload-columns">
            <div className="jev-code-block"><div className="jev-code-title"><a href={source + '/server/evm/choices.ts#L245-L263'}>Build the menu · choices.ts ↗</a></div><pre tabIndex={0} aria-label="Candidate map snippet"><code>{menuCode}</code></pre></div>
            <div className="jev-code-block"><div className="jev-code-title"><a href={source + '/server/evm/jev.ts#L33-L43'}>Validate the key · jev.ts ↗</a></div><pre tabIndex={0} aria-label="Choice validation snippet"><code>{validateCode}</code></pre></div>
          </div>
          <p>Game rules apply the action to the simulation. The contract validates the day and saves Fern’s final state. <a href={record.proofs.acceptanceUrl}>Day accepted ↗</a> · <a href={record.proofs.settlementUrl}>Day saved ↗</a></p>
        </div>
      </details>
    </section>

    <nav className="jev-wrap jev-references" aria-label="Article references">
      <strong>Sources</strong><a href={record.proofs.replayUrl}>Fern’s saved replay ↗</a><a href="https://docs.typesafe.ai/primitives/choice">TypeSafe’s Choice API ↗</a><a href="https://typesafe.ai/blog/dont-call-it-a-decision-model">TypeSafe’s article on judgments ↗</a>
    </nav>
  </article>;
}
