import { createInitialState } from '../domain';

/** Cosmetic identity of the verified peep-day2-7c809055dc27 public visit.
 * Keeps its sprite/home art available during a slow preview read. This basis is
 * used only by the opening renderer; the recorded packet supplies all play facts.
 */
export function openingVisitorState() {
 return createInitialState('0x979865feead295b3add9300f03b7591f1c800ad7008c762121e70698a3ec7efa',{body:2,wits:2,spirit:1},'PEEP');
}
