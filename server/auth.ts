import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { verifyMessage, type Address, type Hex } from 'viem';
import { checkedAddress, ServiceError } from './chain';
import { serverConfig } from './config';
import { storage, update } from './storage';

interface Challenge { address: Address; message: string; expiresAt: number; used: boolean }
interface Session { address: Address; chainId: number; expiresAt: number }
const now = () => Math.floor(Date.now() / 1000);
function secret() { const key = serverConfig().signingSecret; if (key.length < 32) throw new ServiceError('Wallet connection is resting. Try again shortly.', 'connection', 503); return key; }
const mac = (value: string) => createHmac('sha256', secret()).update(value).digest();

export async function challenge(addressValue: unknown, origin: string, client: string) {
  const address = checkedAddress(addressValue), cfg = serverConfig(); secret();
  if (!cfg.allowedOrigins.includes(origin)) throw new ServiceError('Open NEARlyHuman to connect.', 'origin', 403);
  const bucket = Math.floor(now() / 600);
  const rateKey = 'auth/rate/' + createHmac('sha256', secret()).update(client + ':' + bucket).digest('hex');
  await update(rateKey, () => ({ count: 0, expiresAt: (bucket + 2) * 600 }), v => {
    if (v.count >= 20) throw new ServiceError('Give your wallet a moment, then try again.', 'rate', 429);
    v.count++; return v;
  });
  const id = randomBytes(24).toString('hex'), expiresAt = now() + 300;
  const message = `${new URL(origin).host} wants you to sign in with your Ethereum account:\n${address}\n\nCare for your NEARlyHuman rooster. This signature does not spend funds.\n\nURI: ${origin}\nVersion: 1\nChain ID: ${cfg.chainId}\nNonce: ${id}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiresAt * 1000).toISOString()}`;
  await storage().put<Challenge>('auth/challenge/' + id, { address, message, expiresAt, used: false }, { isNew: true });
  return { id, message };
}

export async function authenticate(addressValue: unknown, id: unknown, signature: unknown) {
  const address = checkedAddress(addressValue);
  if (typeof id !== 'string' || !/^[a-f0-9]{48}$/.test(id) || typeof signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/.test(signature)) throw new ServiceError('Please sign in again.', 'signature', 401);
  const key = 'auth/challenge/' + id, saved = await storage().get<Challenge>(key);
  if (!saved || saved.value.used || saved.value.expiresAt <= now() || saved.value.address.toLowerCase() !== address.toLowerCase()) throw new ServiceError('Please sign in again.', 'signature', 401);
  let valid = false;
  try { valid = await verifyMessage({ address, message: saved.value.message, signature: signature as Hex }); } catch { /* invalid signatures stay unconsumed */ }
  if (!valid) throw new ServiceError('The signature did not match this wallet.', 'signature', 401);
  if (!await storage().put(key, { ...saved.value, used: true }, { etag: saved.etag })) throw new ServiceError('Please sign in again.', 'signature', 401);
  const expiresAt = now() + 12 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ address, chainId: serverConfig().chainId, expiresAt } satisfies Session)).toString('base64url');
  return { token: payload + '.' + mac(payload).toString('base64url'), expiresAt };
}

export function session(request: Request, required = true): Address | undefined {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  try {
    if (token.length > 1024) throw Error();
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) throw Error();
    const expected = mac(payload), actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error();
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    if (value.expiresAt <= now() || value.chainId !== serverConfig().chainId) throw Error();
    return checkedAddress(value.address);
  } catch {
    if (required) throw new ServiceError('Connect your wallet to continue.', 'session', 401);
    return undefined;
  }
}

export async function cleanAuth() {
  for (const prefix of ['auth/challenge/', 'auth/rate/']) {
    for (const key of await storage().list(prefix)) {
      const item = await storage().get<{ expiresAt: number }>(key);
      if (item && item.value.expiresAt + 3600 < now()) await storage().delete(key);
    }
  }
}
