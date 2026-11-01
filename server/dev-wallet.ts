import { timingSafeEqual } from 'node:crypto';
import { createWalletClient, http, isHex, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { connection } from './chain';
import { serverConfig } from './config';

/** Opt-in, loopback-only test wallet. This module is absent from production functions. */
export async function devWallet(request: Request): Promise<Response> {
  const url = new URL(request.url), cfg = serverConfig();
  const supplied = request.headers.get('x-local-qa') || '';
  const a = Buffer.from(cfg.signingSecret), b = Buffer.from(supplied);
  if (process.env.NEARLYHUMAN_QA_WALLET !== '1' || cfg.chainId !== 46630 || url.hostname !== '127.0.0.1' || request.method !== 'POST' || !a.length || a.length !== b.length || !timingSafeEqual(a, b) || request.headers.get('origin') !== url.origin) return new Response(null, { status: 404 });
  try {
    const key = process.env.NEARLYHUMAN_QA_OWNER_KEY as Hex;
    if (!key) throw Error();
    const account = privateKeyToAccount(key), { chain, address } = connection();
    const wallet = createWalletClient({ account, chain, transport: http(cfg.rpcUrl) });
    const { method, params = [] } = await request.json(); let result: unknown;
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') result = [account.address];
    else if (method === 'eth_chainId') result = '0xb626';
    else if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') { if (params[0]?.chainId?.toLowerCase() !== '0xb626') throw Error(); result = null; }
    else if (method === 'personal_sign') {
      if (params[1]?.toLowerCase() !== account.address.toLowerCase() || !isHex(params[0])) throw Error();
      const message = Buffer.from(params[0].slice(2), 'hex').toString();
      if (!cfg.allowedOrigins.some(origin => message.startsWith(new URL(origin).host + ' wants you to sign in') && message.includes('URI: ' + origin + '\n')) || !message.includes('Care for your NEARlyHuman rooster.')) throw Error();
      result = await account.signMessage({ message: { raw: params[0] } });
    } else if (method === 'eth_sendTransaction') {
      const tx = params[0];
      if (tx?.from?.toLowerCase() !== account.address.toLowerCase() || tx?.to?.toLowerCase() !== address.toLowerCase() || !isHex(tx.data) || BigInt(tx.value || 0) > 100_000_000_000_000n || tx.gas && BigInt(tx.gas) > 2_000_000n) throw Error();
      result = await wallet.sendTransaction({ to: address, data: tx.data, value: BigInt(tx.value || 0), gas: tx.gas ? BigInt(tx.gas) : undefined });
    } else throw Error();
    return Response.json({ result });
  } catch { return Response.json({ error: { code: 4001, message: 'Local wallet request rejected.' } }, { status: 400 }); }
}
