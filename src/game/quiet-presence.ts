import type { Phase, TargetId } from '../domain/types';

export interface QuietPresenceContext {
 seed:string;
 day:number;
 phase:Phase;
 target:TargetId;
 /** Actual renderer contact, rather than a benefit inferred from the target. */
 rest?:'bed'|'seat';
 continued?:boolean;
}

const phaseLines:Record<Phase,readonly string[]>={
 Dawn:['The house stirs.','Dawn at home.'],
 Morning:['The morning drifts by.','A morning pause.'],
 Midday:['A pause at midday.','Midday passes quietly.'],
 Afternoon:['The afternoon drifts.','An afternoon pause.'],
 Evening:['The day winds down.','Evening at home.'],
 Bedtime:['The house grows quiet.','Bedtime settles in.'],
};
const anchorLines:Partial<Record<TargetId,readonly string[]>>={
 store:['By the pantry.','A moment by the pantry.'],
 cupboard:['Beside the cupboard.','By the cupboard.'],
 window:['By the window.','A moment by the window.'],
 gardenView:['By the garden.','A moment in the garden.'],
 plot1:['Watching the garden.','A pause in the garden.'],
 plot2:['Watching the garden.','A pause in the garden.'],
 hall:['A moment in the hall.','The house carries on.'],
 bed:['By the bed.','A moment by the bed.'],
 baseSeat:['By the chair.','A moment by the chair.'],
 chair:['By the chair.','A moment by the chair.'],
 mailbox:['By the gate.','A little time outside.'],
 prep:['Beside the counter.','A moment by the counter.'],
 stove:['By the stove.','A moment by the stove.'],
};
function cosmeticHash(text:string):number {
 let hash=2166136261;
 for(let index=0;index<text.length;index++)hash=Math.imul(hash^text.charCodeAt(index),16777619);
 return hash>>>0;
}

/** Observational caption only. It neither selects an activity nor changes a save.
 * Stable per anchor/phase: an ordinary boundary must not restart a new sentence.
 */
export function quietPresenceLines(context:QuietPresenceContext):[string,string] {
 const identity=`quiet-presence-v1:${context.seed}:${context.day}:${context.phase}:${context.target}:${context.rest||''}:${!!context.continued}`;
 const first=context.rest==='bed'
  ?context.continued?['Still tucked in.','Resting at home.','A little rest in bed.']:['Resting at home.','A little rest in bed.']
  :context.rest==='seat'
   ?context.continued?['A little longer here.','The chair has company.','Settled in for a bit.']:['A moment in the chair.','The chair has company.']
   :anchorLines[context.target]||['A little time passes.','The house carries on.'];
 const second=phaseLines[context.phase];
 return[first[cosmeticHash(identity+':anchor')%first.length]!,second[cosmeticHash(identity+':phase')%second.length]!];
}
