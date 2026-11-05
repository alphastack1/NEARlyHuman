import {createHash} from 'node:crypto';
import type { GamePublicConfig, GameWorldDirectory, NearPublicConfig } from '../src/chain/game-types';
import { readEvmPublicConfig } from './evm/views';
import {evmConfig,serverConfig} from './config';

let cached: { key: string; until: number; value: GameWorldDirectory } | undefined;
/** A funded-credit pause does not remove an existing world. Only the static
 * service prerequisites and actual pinned contract identity gate discovery. */
export async function readAdvertisedNearWorld():Promise<NearPublicConfig|undefined>{
  if(process.env.NEARLYHUMAN_NEAR_ENABLED!=='1'||!process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON||!process.env.NEARLYHUMAN_NEAR_RELAY_KEY
    ||!/^[a-z0-9][a-z0-9-]{1,79}$/.test(process.env.NEARLYHUMAN_NEAR_CAMPAIGN||'')||serverConfig().signingSecret.length<32)return;
  try{
    const [{nearRuntime},{nativeRelaySigner},{readNearPublicConfig}]=await Promise.all([import('./near/rpc'),import('./near/relay'),import('./near/views')]);
    nativeRelaySigner(nearRuntime()); // Loaded key must match the pinned quote key.
    return await readNearPublicConfig();
  }catch{return undefined;}
}
/** The catalog is descriptive. Only a configured runtime whose actual contract
 * identity has just been checked is advertised as a playable world. */
export async function readGameWorlds(): Promise<GameWorldDirectory> {
  // An opaque fingerprint invalidates discovery after credential/configuration
  // changes without retaining secret strings in the cache key or public DTO.
  const key = createHash('sha256').update(JSON.stringify([evmConfig().runtimeJson || '',process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON || '',process.env.NEARLYHUMAN_NEAR_ENABLED || '',process.env.NEARLYHUMAN_NEAR_CAMPAIGN || '',process.env.NEARLYHUMAN_NEAR_RELAY_KEY || '',serverConfig().signingSecret])).digest('hex');
  if (cached?.key === key && cached.until > Date.now()) return cached.value;
  const readers: Promise<GamePublicConfig|undefined>[] = [readEvmPublicConfig().then(config => ({ ...config, version: 2 as const }))];
  if (process.env.NEARLYHUMAN_NEAR_ENABLED === '1' && process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON) {
    readers.push(readAdvertisedNearWorld());
  }
  const results = await Promise.allSettled(readers), worlds = results.flatMap(result => result.status === 'fulfilled'&&result.value ? [result.value] : []);
  if (!worlds.length) throw new Error('No verified game world is reachable.');
  const value: GameWorldDirectory = { version: 2, worlds, defaultNetworkId: worlds.some(world=>world.networkId!=='near-testnet')?'robinhood-testnet':'near-testnet' };
  cached = { key, until: Date.now() + 10000, value }; return value;
}
