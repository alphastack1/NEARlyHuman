import { hash32, seedHex } from './state';

export const PERSONALITY_VERSION = 'v2-personality-1';
export const INTERESTS = ['cooking', 'gardening', 'making', 'comfort', 'exploring'] as const;
export type Interest = typeof INTERESTS[number];
export interface LifePersonality {
  interest: Interest;
  secondaryInterest: Interest;
  mealStyle: 'simple' | 'ritual';
  rhythm: 'early' | 'late' | 'unhurried';
  signature: 'preen' | 'perk' | 'stretch' | 'breathe';
  tempo: 'unhurried' | 'measured' | 'brisk';
  curiosity: 'reserved' | 'inquisitive';
  resourceStyle: 'save-specials' | 'experiment';
  craftStyle: 'little-useful-things' | 'patient-projects';
}
const draw = (seed: string, label: string) => hash32(`${PERSONALITY_VERSION}:${seedHex(seed)}:${label}`);
const pick = <T>(values: readonly T[], n: number): T => values[n % values.length]!;

/** Stable tastes are presentation/choice context, never extra mechanical benefits. */
export function lifePersonality(seed: string): LifePersonality {
  const interest = pick(INTERESTS, draw(seed, 'interest'));
  return {
    interest, secondaryInterest: pick(INTERESTS.filter(x => x !== interest), draw(seed, 'secondary')),
    mealStyle: pick(['simple', 'ritual'] as const, draw(seed, 'meal')),
    rhythm: pick(['early', 'late', 'unhurried'] as const, draw(seed, 'rhythm')),
    signature: pick(['preen', 'perk', 'stretch', 'breathe'] as const, draw(seed, 'signature')),
    tempo: pick(['unhurried', 'measured', 'brisk'] as const, draw(seed, 'tempo')),
    curiosity: pick(['reserved', 'inquisitive'] as const, draw(seed, 'curiosity')),
    resourceStyle: pick(['save-specials', 'experiment'] as const, draw(seed, 'resources')),
    craftStyle: pick(['little-useful-things', 'patient-projects'] as const, draw(seed, 'craft')),
  };
}

export function dayInclination(seed: string, day: number) {
  const profile = lifePersonality(seed), index = Math.max(1, Math.floor(day)) - 1;
  const other = INTERESTS.filter(x => x !== profile.interest && x !== profile.secondaryInterest)
    .sort((a, b) => draw(seed, `order:${a}`) - draw(seed, `order:${b}`) || a.localeCompare(b));
  return {
    interest: [profile.interest, profile.secondaryInterest, ...other][index % INTERESTS.length]!,
    pace: profile.rhythm === 'unhurried' ? 'leave room for ordinary moments' : profile.rhythm === 'early' ? 'begin useful care early' : 'settle into the day before the afternoon project',
  };
}
