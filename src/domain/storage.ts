/** Visual homes for the one canonical inventory. This assigns no ownership,
 * capacity, consumption or economic rule; storage is a presentation concern. */
export type StorageKind = 'pantry' | 'supplies' | 'workshop';

export function itemStorage(item: number): StorageKind {
  if ([0, 1, 2, 3, 5, 26, 27, 28, 29].includes(item)) return 'pantry';
  return item === 6 || item >= 30 ? 'workshop' : 'supplies';
}
