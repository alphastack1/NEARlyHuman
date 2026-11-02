import { createInitialState, type TargetId } from '../domain';

export const OPENING_START_TARGET:TargetId='bed';

/** Cosmetic identity of the verified nori-day3-05de911accb2 public visit.
 * Keeps its sprite/home art available during a slow preview read. This basis is
 * used only by the opening renderer; the recorded packet supplies all play facts.
 */
export function openingVisitorState() {
 return createInitialState('0x77ae7453b80f6f6f0b2bed65a6bc351f7ee274bdfd3c32b84255eba45ab68157',{body:2,wits:2,spirit:1},'NORI');
}
