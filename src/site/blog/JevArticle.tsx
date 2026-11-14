import { useRef, useState } from 'react';
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
    <summary>Run the garden request with Node.js</summary>
    <div className="jev-detail">
      <ol className="jev-instructions">
        <li><a href={requestUrl} download="choice.json">Download choice.json ↓</a> with the reconstructed Step 21 request.</li>
        <li>Save the script as <code>choice.mjs</code> beside it. Set <code>NEAR_AI_API_KEY</code> to a NEAR AI Cloud key with Jev access.</li>
        <li>Run <code>node choice.mjs</code> with Node.js 20 or newer. It prints the returned key and its action name.</li>
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
        <p className="jev-lede">What should Fern do with the day ahead? The game works out what the rooster can do. Jev, TypeSafe’s AI model, picks from those options.</p>
        <a href="#whole-day" className="jev-primary">Start at dawn <span aria-hidden="true">↓</span></a>
      </div>
      <img src={JEV_POST.image.href} width={JEV_POST.image.width} height={JEV_POST.image.height} decoding="async" fetchPriority="high" alt={JEV_POST.image.alt}/>
    </header>

    <JevDaySequence />
    <JevChoiceLens />

    <section className="jev-wrap jev-section jev-build" aria-labelledby="build-title">
      <div className="jev-section-title"><span aria-hidden="true">3</span><h2 id="build-title">Try a Jev request</h2></div>
      <p className="jev-section-copy">Give Jev the facts that matter, a question, and a short list of options. Check the returned ID before your code acts on it.</p>
      <RunnableExample />
      <details className="jev-disclosure" id="execution">
        <summary>See how the game checks the answer</summary>
        <div className="jev-detail">
          <p>The game maps each option’s ID to its costs and effects. For each question, the server validates the answer type and checks the selected ID against the options it sent.</p>
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
