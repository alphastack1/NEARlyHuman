import type { Receipt, State } from '../v2/types';

/** An immutable, previously settled public film. This is not a new AI day. */
export const OPEN_HOUSE_SAMPLE = {
  name: 'MAPLE', id: '8', day: 1,
  chainId: 46630, collection: '0x30cb5213fa94020a95893ddb6b07470dbf7a9efc',
  commitment: '0x3b83641cc62cfd4f1ac8f4f9c013262885beaf2e66c9a975f1e29942b4287dae',
  asset: '/assets/preview/maple-open-house-day1-3b83641cc62c.json',
  href: '/?v2=1&chainId=46630&collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc&rooster=8',
} as const;

export interface OpenHouseReplay {
  version: 1; name: string; tokenId: string; day: number;
  world: { chainId: number; collection: string }; commitment: string;
  packet: { version: 2; requestId?: string; result: { state: State; receipts: Receipt[] } };
}
export type HouseFocus = 'home' | 'garden' | 'workshop' | 'mailbox';
export type HousePhase = 'idle' | 'playing' | 'paused' | 'ended';
export interface HouseInspect { kind: 'bed' | 'well' | 'workshop' | 'mailbox' | 'fixture'; index?: number; label?: string }
export interface OpenHouseEvents {
  onInspect(target: HouseInspect, state: State): void;
  onPhase(phase: HousePhase): void;
  onCaption(caption: string, progress: number): void;
  onState(state: State): void;
}
let cached: Promise<OpenHouseReplay> | undefined;
export function loadOpenHouseReplay(): Promise<OpenHouseReplay> {
  if (!cached) cached = fetch(OPEN_HOUSE_SAMPLE.asset, { signal: AbortSignal.timeout(15000) }).then(async response => {
    if (!response.ok) throw Error('This recorded day could not open. Try again.');
    const value = await response.json() as OpenHouseReplay, result = value.packet?.result;
    if (value.version !== 1 || value.tokenId !== OPEN_HOUSE_SAMPLE.id || value.name !== OPEN_HOUSE_SAMPLE.name || value.day !== 1
      || value.commitment !== OPEN_HOUSE_SAMPLE.commitment || value.world?.chainId !== 46630 || value.world.collection.toLowerCase() !== OPEN_HOUSE_SAMPLE.collection
      || value.packet.version !== 2 || result?.state?.version !== 2 || result.state.day !== 1 || !/^0x[\da-f]{64}$/i.test(result.state.seed)
      || !Array.isArray(result.receipts) || result.receipts.length < 1 || result.receipts.length > 100
      || result.receipts.some(receipt => receipt.before?.seed !== result.state.seed || receipt.snapshot?.seed !== result.state.seed)) throw Error('This recorded day needs another look. Try again.');
    return value;
  }).catch(error => { cached = undefined; throw error; });
  return cached;
}
