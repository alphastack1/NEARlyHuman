import { timingSafeEqual } from 'node:crypto';
import { isHosted, serverConfig } from './config';
import { ServiceError } from './support';

export async function dispatchBackground(body: unknown) {
  const secret = serverConfig().signingSecret, base = process.env.URL;
  if (!secret || !base) throw new ServiceError('Preparation is queued. Check again shortly.', 'queued', 503);
  const response = await fetch(new URL('/.netlify/functions/prepare-background', base), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-nearlyhuman-worker': secret }, body: JSON.stringify(body), signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new ServiceError('Preparation is queued. Check again shortly.', 'queued', 503);
}
export async function dispatchReconciliation() {
  if (isHosted()) return dispatchBackground({ task: 'reconcile' });
  const work: Promise<unknown>[] = [import('./evm/service').then(module => module.reconcileEvmService())];
  if (process.env.NEARLYHUMAN_NEAR_ENABLED === '1' && process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON) work.push(import('./near/service').then(module => module.reconcileNearService()));
  await Promise.allSettled(work);
}
export function validWorkerSecret(value: string | null) {
  const secret = serverConfig().signingSecret; if (!secret || !value) return false;
  const a = Buffer.from(secret), b = Buffer.from(value); return a.length === b.length && timingSafeEqual(a, b);
}
