/** NETLIFY alone is a build flag; the explicit runtime setting also covers Functions. */
export const isHosted = () => process.env.NEARLYHUMAN_RUNTIME === 'netlify' || !!process.env.NETLIFY_BLOBS_CONTEXT || !!process.env.NETLIFY;

export const envNumber = (name: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};

/** Deployed environment names remain accepted only at this configuration boundary.
 * Changing a source name must never create another runtime or funded campaign. */
export const evmConfig = () => {
  const read = (name: string) => process.env[`NEARLYHUMAN_EVM_${name}`] ?? process.env[`NEARLYHUMAN_V2_${name}`];
  return {
    runtimeJson: read('RUNTIME_JSON'), rpcUrl: read('RPC_URL'), campaign: read('CAMPAIGN'),
    guestId: read('GUEST_ID'), guestDay: read('GUEST_DAY'), local: read('LOCAL'),
    inferenceReserveWei: read('INFERENCE_RESERVE_WEI'), hostingReserveWei: read('HOSTING_RESERVE_WEI'),
  };
};

export const serverConfig = () => ({
  nearKey: process.env.NEAR_AI_API_KEY || '',
  model: 'typesafe/jev-1.13',
  endpoint: 'https://cloud-api.near.ai/v1/systemone',
  relayKey: process.env.NEARLYHUMAN_RELAY_KEY as `0x${string}` | undefined,
  chainId: envNumber('NEARLYHUMAN_EVM_CHAIN_ID', envNumber('NEARLYHUMAN_CHAIN_ID', 46630)),
  signingSecret: process.env.NEARLYHUMAN_SESSION_SECRET || '',
  // Preserve the original funded allocation guard; active campaigns have their own ledger.
  fundedMicroUSD: Math.round(envNumber('NEARLYHUMAN_AI_BUDGET_USD', .9) * 1_000_000),
  allowedOrigins: (process.env.NEARLYHUMAN_ORIGINS || 'https://nearlyhuman.netlify.app,http://127.0.0.1:5173,http://localhost:5173').split(','),
});
