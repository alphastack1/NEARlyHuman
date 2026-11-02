import { createInitialState, type TargetId } from '../domain';
import { PREVIEW_DAYS } from './previewData';

export const OPENING_START_TARGET:TargetId=PREVIEW_DAYS[0].startTarget;

/** Cosmetic identity of the first verified public visit.
 * Keeps its sprite/home art available during a slow preview read. This basis is
 * used only by the opening renderer; the recorded packet supplies all play facts.
 */
export function openingVisitorState() {
 const first=PREVIEW_DAYS[0];return createInitialState(first.seed,first.stats,first.name);
}
