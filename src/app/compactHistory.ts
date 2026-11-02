import { OUTCOME, isDeliveryCollection, type ActionId, type TargetId } from '../domain';
import type { CompactHistoryEntry } from './api';

const actionNames: Record<ActionId, string> = {
  K01:'Make toast', K02:'Cook steak', K03:'Make a comfort bowl', K04:'Make a steak sandwich',
  K05:'Make coffee', K06:'Make milk coffee', K07:'Eat emergency steak',
  H01:'Eat or drink', H02:'Treatment', H03:'Rest in bed', H04:'Relax', H05:'Tidy the kitchen',
  H06:'Deep-clean the mess', H07:'Wash or clean', H08:'Repair', H09:'Build', H10:'Patch with wood',
  H11:'Brace the chair', H12:'Brace the window', H13:'Divert a drip', H14:'Cover against weather',
  H15:'Light backup heat', H16:'Douse the stove', H17:'Shut down the stove', H18:'Divert a visitor',
  H19:'Shoo a visitor', H20:'Move the chair', G01:'Plant seeds', G02:'Water a plot', G03:'Fertilize a plot',
  G04:'Restore the soil', G05:'Harvest', G06:'Cover a plot', G07:'Clear a plot', T01:'A quiet moment',
};
const targetNames: Record<TargetId, string> = {
  store:'Supplies', prep:'Kitchen counter', stove:'Stove', window:'Window', bed:'Bed', baseSeat:'Living room',
  chair:'Chair', chairA:'Chair corner', chairB:'Other chair corner', cupboard:'Cupboard', body:'Washroom',
  surface:'Kitchen counter', plot1:'Plot 1', plot2:'Plot 2', gardenShelter:'Garden shelter', gardenView:'Garden',
  pest:'Visitor', cutoff:'Stove', mailbox:'Front-yard mailbox', hall:'Hall',
};

/** Describe only the compact chain facts: no reconstructed film, probabilities or numeric effects. */
export function describeCompactAction(record: CompactHistoryEntry) {
  const { action, variant, target, outcome } = record;
  const delivery=isDeliveryCollection(record);
  let title = actionNames[action];
  if(delivery)title='Collect delivery';
  if (action === 'H01') title = ({water:'Drink water',milk:'Drink milk',bread:'Eat bread',quickCoffee:'Drink coffee'} as Record<string,string>)[variant] || title;
  if (action === 'H02') title = variant === 'wound' ? 'Bandage a wound' : variant === 'infection' ? 'Treat infection' : 'Treat illness';
  if (action === 'H04') title = variant === 'chair' ? 'Enjoy the crafted chair' : variant === 'garden' ? 'Enjoy the garden' : 'Relax in the living room';
  if (action === 'H07') title = target === 'body' ? 'Wash up' : 'Wipe the counter';
  if (action === 'H08') title = 'Repair the ' + (target === 'window' ? 'window' : target === 'chair' ? 'chair' : 'stove');
  if (action === 'H09') title = target === 'gardenShelter' ? 'Build a garden shelter' : 'Build a chair';
  if (action === 'G01') title = variant === 'apple' ? 'Plant apple seeds' : 'Plant rose seeds';
  if (action === 'G05') title = variant === 'apple' ? 'Harvest an apple' : 'Harvest a rose';
  const terminal = !!(outcome & OUTCOME.terminal);
  const quiet = action === 'T01' && !terminal && !delivery;
  if (action === 'T01' && terminal && !delivery) title = 'Final moment';
  const details = [targetNames[target]];
  if (!quiet && !(action === 'T01' && terminal && !delivery)) details.push(record.success ? 'Completed' : 'Unsuccessful');
  if (outcome & OUTCOME.wound) details.push('Wound');
  if (outcome & OUTCOME.illness) details.push('Illness');
  if (outcome & OUTCOME.surfaceContamination) details.push('Counter contamination');
  if (outcome & OUTCOME.bodyContamination) details.push('Body contamination');
  if (outcome & OUTCOME.fire) details.push('Stove flare');
  if (outcome & OUTCOME.mess) details.push('Mess');
  if (terminal) details.push('Life ended');
  return { title, detail:details.join(' · '), terminal, quiet, failed:!record.success && !quiet };
}
