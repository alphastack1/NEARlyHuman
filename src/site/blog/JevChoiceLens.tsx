import { Icon } from '../../app/Icons';
import { itemImage } from '../../art/items';
import day from './fern-day-sequence.json';
import './jev-choice-lens.css';

const midday = day.calls.find(call => call.slot === 21)!;
const afternoon = day.calls.find(call => call.slot === 31)!;
const daisyBed = itemImage(22);

function GardenState({ state, after = false }: { state: typeof midday.request.state; after?: boolean }) {
  const moisture = state.garden[0].moisture;
  return <div className="jev-garden-state">
    <p className="jev-garden-time">{after ? 'Afternoon' : 'Midday'} <span>· Step {state.slot}</span></p>
    <h3>{after ? 'After watering' : 'Before watering'}</h3>
    <div className="jev-garden-bed" aria-hidden="true">
      <img src={daisyBed} width={34} height={34} alt=""/>
      {[1, 2].map(drop => <Icon key={drop} name="water" size={18} color={drop <= moisture ? '#a4e3eb' : '#9e7955'}/>)}
    </div>
    <dl className="jev-garden-facts">
      <div><dt>Daisy bed</dt><dd>{moisture}/2 moisture</dd></div>
      <div><dt>Energy</dt><dd>{state.needs.energy}/100</dd></div>
    </dl>
  </div>;
}

export default function JevChoiceLens() {
  return <section className="jev-wrap jev-section jev-garden" id="exchange" aria-labelledby="jev-garden-heading">
    <div className="jev-section-title"><span aria-hidden="true">2</span><h2 id="jev-garden-heading">Why the next menu changes</h2></div>
    <figure className="jev-garden-figure">
      <div className="jev-garden-path">
        <GardenState state={midday.request.state}/>
        <div className="jev-garden-connector">
          <span aria-hidden="true"><Icon name="water" size={20}/></span>
          <strong>Fern waters<br/>from the well</strong>
        </div>
        <GardenState state={afternoon.request.state} after/>
      </div>
      <figcaption className="jev-garden-result">
        <div><Icon name="water" size={16}/><span><strong>Full bed</strong> <span aria-hidden="true">→</span> Watering leaves the menu</span></div>
        <div><Icon name="energy" size={16}/><span><strong>One energy spent</strong> <span aria-hidden="true">→</span> A nap becomes available</span></div>
      </figcaption>
    </figure>
  </section>;
}
