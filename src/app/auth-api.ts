import { GameApiError } from './evm-api';

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch('/api/evm/auth/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let result: { error?: { message?: string; code?: string } };
  try { result = await response.json(); } catch { throw new GameApiError('Connection interrupted. Please try again.', 'connection', response.status); }
  if (!response.ok) throw new GameApiError(result.error?.message || 'Please try again.', result.error?.code || 'unavailable', response.status);
  return result as T;
}
export const authApi = {
  challenge: (address: string) => request<{ id: string; message: string }>('challenge', { address }),
  authenticate: (address: string, id: string, signature: string) => request<{ token: string; expiresAt: number }>('verify', { address, id, signature }),
};
