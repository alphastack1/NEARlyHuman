import { hash32, seedHex } from './state';

export const V2_PERSONALITY_VERSION = 'v2-personality-1';
export const V2_INTERESTS = ['cooking', 'gardening', 'making', 'comfort', 'exploring'] as const;
export type V2Interest = typeof V2_INTERESTS[number];
export interface V2Personality {
  interest: V2Interest;
  secondaryInterest: V2Interest;
  mealStyle: 'simple' | 'ritual';
  rhythm: 'early' | 'late' | 'unhurried';
  signature: 'preen' | 'perk' | 'stretch' | 'breathe';
  tempo: 'unhurried' | 'measured' | 'brisk';
  curiosity: 'reserved' | 'inquisitive';
  resourceStyle: 'save-specials' | 'experiment';
  craftStyle: 'little-useful-things' | 'patient-projects';
}
const draw = (seed: string, label: string) => hash32(`${V2_PERSONALITY_VERSION}:${seedHex(seed)}:${label}`);
const pick = <T>(values: readonly T[], n: number): T => values[n % values.length]!;

/** Stable tastes are presentation/choice context, never extra mechanical benefits. */
export function v2Personality(seed: string): V2Personality {
  const interest = pick(V2_INTERESTS, draw(seed, 'interest'));
  return {
    interest, secondaryInterest: pick(V2_INTERESTS.filter(x => x !== interest), draw(seed, 'secondary')),
    mealStyle: pick(['simple', 'ritual'] as const, draw(seed, 'meal')),
    rhythm: pick(['early', 'late', 'unhurried'] as const, draw(seed, 'rhythm')),
    signature: pick(['preen', 'perk', 'stretch', 'breathe'] as const, draw(seed, 'signature')),
    tempo: pick(['unhurried', 'measured', 'brisk'] as const, draw(seed, 'tempo')),
    curiosity: pick(['reserved', 'inquisitive'] as const, draw(seed, 'curiosity')),
    resourceStyle: pick(['save-specials', 'experiment'] as const, draw(seed, 'resources')),
    craftStyle: pick(['little-useful-things', 'patient-projects'] as const, draw(seed, 'craft')),
  };
}

export function v2DayInclination(seed: string, day: number) {
  const profile = v2Personality(seed), index = Math.max(1, Math.floor(day)) - 1;
  const other = V2_INTERESTS.filter(x => x !== profile.interest && x !== profile.secondaryInterest)
    .sort((a, b) => draw(seed, `order:${a}`) - draw(seed, `order:${b}`) || a.localeCompare(b));
  return {
    interest: [profile.interest, profile.secondaryInterest, ...other][index % V2_INTERESTS.length]!,
    pace: profile.rhythm === 'unhurried' ? 'leave room for ordinary moments' : profile.rhythm === 'early' ? 'begin useful care early' : 'settle into the day before the afternoon project',
  };
}
