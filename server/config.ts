import { deployments } from '../src/chain/deployments';
import { chainFor } from '../src/chain/config';

/** NETLIFY alone is a build flag; the explicit runtime setting also covers Functions. */
export const isHosted = () => process.env.NEARLYHUMAN_RUNTIME === 'netlify' || !!process.env.NETLIFY_BLOBS_CONTEXT || !!process.env.NETLIFY;

export const envNumber = (name: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};
export const serverConfig = () => {
  const chainId = envNumber('NEARLYHUMAN_CHAIN_ID', 46630);
  const chain = chainFor(chainId);
  return {
  nearKey: process.env.NEAR_AI_API_KEY || '',
  model: 'typesafe/jev-1.13',
  endpoint: 'https://cloud-api.near.ai/v1/systemone',
  relayKey: process.env.NEARLYHUMAN_RELAY_KEY as `0x${string}` | undefined,
  chainId,
  collection: (process.env.NEARLYHUMAN_COLLECTION || deployments[chainId]?.address) as `0x${string}` | undefined,
  rpcUrl: process.env.NEARLYHUMAN_RPC_URL || chain.rpcUrls.default.http[0],
  signingSecret: process.env.NEARLYHUMAN_SESSION_SECRET || '',
  fundedMicroUSD: Math.round(envNumber('NEARLYHUMAN_AI_BUDGET_USD', .9) * 1_000_000),
  attemptReserveMicroUSD: 60_000,
  maxWalletAttempts: envNumber('NEARLYHUMAN_WALLET_ATTEMPTS', 12, 1, 100),
  maxGlobalAttempts: envNumber('NEARLYHUMAN_GLOBAL_ATTEMPTS', 100, 1, 10_000),
  maxConcurrentJobs: envNumber('NEARLYHUMAN_CONCURRENCY', 3, 1, 5),
  allowedOrigins: (process.env.NEARLYHUMAN_ORIGINS || 'https://nearlyhuman.netlify.app,http://127.0.0.1:5173,http://localhost:5173').split(','),
  };
};
