import { keccak256, type Hex } from 'viem';
import { Op, type Trace } from './types';
import { encodeTrace } from './codec';

export const HISTORY_CODEC = 1;

/** One goal byte followed by eight bytes per canonical semantic action. */
export function compactHistory(trace: Trace): Hex {
  encodeTrace(trace); // Enforce the same unsigned ABI field ranges.
  const bytes = [trace.goal]; let previous = 0;
  for (const a of trace.steps) {
    if (!Number.isInteger(a.slot) || a.slot <= previous || a.slot > 60 || a.op > Op.EnjoyFlower
      || a.goods.some(n => n > 34) || a.op !== Op.Ship && a.goods.some(Boolean)) throw new Error('Invalid compact history.');
    previous = a.slot;
    bytes.push(a.slot, a.op, a.arg, a.variant, ...a.goods);
  }
  return `0x${bytes.map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

export function expandHistory(history: Hex): Trace {
  if (!/^0x(?:[0-9a-f]{2})+$/i.test(history)) throw new Error('Invalid compact history.');
  const b = Array.from(history.slice(2).match(/../g)!, v => parseInt(v, 16));
  if ((b.length - 1) % 8 || b.length > 129) throw new Error('Invalid compact history.');
  const trace: Trace = { goal: b[0]!, steps: [] };
  for (let i = 1; i < b.length; i += 8) trace.steps.push({ slot: b[i]!, op: b[i + 1]!, arg: b[i + 2]!, variant: b[i + 3]!, goods: b.slice(i + 4, i + 8) });
  if (compactHistory(trace) !== history.toLowerCase()) throw new Error('Noncanonical compact history.');
  return trace;
}

export const historyTraceHash = (history: Hex): Hex => keccak256(encodeTrace(expandHistory(history)));
