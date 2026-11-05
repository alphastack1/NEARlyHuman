import type { CSSProperties } from 'react';
import { Op, type Receipt } from '../../domain/types';
import './needFeedback.css';

const CARE = new Set([Op.Breakfast, Op.Eat, Op.Drink, Op.Treat, Op.Wash, Op.Rest,
  Op.Leisure, Op.Coffee, Op.Toast, Op.CookSteak, Op.Bowl, Op.Sandwich, Op.RawSteak, Op.EnjoyFlower]);

/** Actual displayed change, shown only when a care result or important loss
 * explains it. Ordinary decay and work energy costs do not produce HUD noise. */
export function visibleNeedChanges(receipt: Receipt, displayedBefore: readonly number[]): number[] {
  const care = CARE.has(receipt.op) || receipt.events.some(e => e.kind === 'bedtime');
  const incident = receipt.events.some(e => e.kind === 'incident' || e.kind === 'condition' || e.kind === 'death');
  return receipt.snapshot.needs.map((value, i) => {
    const actual = value - displayedBefore[i]!, intrinsic = value - receipt.before.needs[i]!;
    if (actual > 0 && intrinsic > 0 && care) return actual;
    if (actual < 0 && (i === 0 && intrinsic < 0 || incident && intrinsic <= -1000)) return actual;
    return 0;
  });
}

/** No state interpolation: the enclosing meter already shows its canonical
 * snapshot. This transient layer only makes the exact impact easier to notice. */
export function NeedFeedback({ delta, color, paused }: { delta: number; color: string; paused: boolean }) {
  if (!Number.isInteger(delta) || delta === 0) return null;
  const amount = Number((Math.abs(delta) / 100).toFixed(2)).toString();
  const style = { '--need-effect-color': color, animationPlayState: paused ? 'paused' : 'running' } as CSSProperties;
  return <span className="life-need-feedback" data-direction={delta > 0 ? 'gain' : 'loss'} data-delta={delta} style={style} aria-hidden="true">
    <i className="life-need-impact" style={{ animationPlayState: style.animationPlayState }}/>
    <span className="life-need-delta" style={{ animationPlayState: style.animationPlayState }}>{delta > 0 ? '+' : '−'}{amount}%</span>
  </span>;
}
