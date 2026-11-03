import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createTransaction, actions, encodeTransaction, decodeSignedTransaction, KeyPairSigner, baseDecode, baseEncode, type Action } from 'near-api-js';
import { nearWalletMetadata, unlockNearWallet, type NearRole } from './local-wallet';

const RPC = 'https://test.rpc.fastnear.com';
export async function operatorRpc<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'nearlyhuman-operator', method, params }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Native testnet RPC is temporarily unavailable.');
  const result = await response.json() as { result?: T; error?: { cause?: { name?: string } } };
  if (result.error || result.result === undefined) { const error = new Error('Check the original native operation before another write.') as Error & { rpcCode?: string }; error.rpcCode = result.error?.cause?.name; throw error; }
  return result.result;
}
export async function operatorView<T>(accountId: string, method: string, args: unknown = {}): Promise<T> {
  const result = await operatorRpc<{ result: number[] }>('query', { request_type: 'call_function', finality: 'final', account_id: accountId, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') });
  return JSON.parse(Buffer.from(result.result).toString('utf8')) as T;
}
interface Outcome { final_execution_status?: string; status?: { Failure?: unknown; SuccessValue?: string }; transaction?: { hash: string }; receipts_outcome?: unknown[] }
interface Entry { signer: string; receiver: string; fingerprint: string; hash: string; raw: string; nonce: string; status: 'prepared' | 'confirmed' | 'failed'; createdAt: string }
interface Book { version: 1; networkId: 'near-testnet'; entries: Record<string, Entry> }
export async function nativeOperationInfo(id: string): Promise<Pick<Entry, 'signer' | 'receiver' | 'hash' | 'status' | 'nonce'> | undefined> {
  const filename = path.join(os.homedir(), '.codex', 'data', 'nearlyhuman', 'near-ops', 'testnet.json');
  try { const book = JSON.parse(await fs.readFile(filename, 'utf8')) as Book; if (book.version !== 1 || book.networkId !== 'near-testnet') throw new Error('Native journal scope changed.'); const entry = book.entries[id]; return entry ? { signer: entry.signer, receiver: entry.receiver, hash: entry.hash, status: entry.status, nonce: entry.nonce } : undefined; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
}
/** Root-only, exact-byte native operations with a private durable pre-broadcast
 * journal. Unknown sends retain their original bytes and never create a retry. */
export async function executeNearOperation(input: { id: string; role: NearRole; receiver: string; actions: Action[] }): Promise<{ hash: string; outcome: Outcome }> {
  if (process.env.NEARLYHUMAN_NEAR_QA_WALLET !== '1' || !/^[a-z\d][a-z\d:._-]{0,100}$/i.test(input.id) || !input.receiver.endsWith('.testnet')) throw new Error('An exact native testnet operator scope is required.');
  const status = await operatorRpc<{ chain_id: string }>('status', []); if (status.chain_id !== 'testnet') throw new Error('Only native NEAR testnet is authorized.');
  const metadata = nearWalletMetadata(input.role), key = unlockNearWallet(input.role), signer = new KeyPairSigner(key);
  const directory = path.join(os.homedir(), '.codex', 'data', 'nearlyhuman', 'near-ops'); await fs.mkdir(directory, { recursive: true });
  const filename = path.join(directory, 'testnet.json'), lock = filename + '.lock', token = randomUUID();
  const handle = await fs.open(lock, 'wx', 0o600); await handle.writeFile(JSON.stringify({ pid: process.pid, token, at: new Date().toISOString() })); await handle.close();
  const release = () => { try { const held = JSON.parse(fsSync.readFileSync(lock, 'utf8')); if (held.pid === process.pid && held.token === token) fsSync.unlinkSync(lock); } catch { /* Never erase another operator lock. */ } };
  process.once('exit', release);
  try {
    let book: Book; try { book = JSON.parse(await fs.readFile(filename, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; book = { version: 1, networkId: 'near-testnet', entries: {} }; }
    if (book.version !== 1 || book.networkId !== 'near-testnet') throw new Error('Native operator journal has another scope.');
    const save = async () => { const temporary = filename + '.tmp'; await fs.writeFile(temporary, JSON.stringify(book), { mode: 0o600 }); await fs.rename(temporary, filename); };
    // Serialize a nonce-zero transaction to fingerprint precisely the immutable
    // action bytes, including WASM or function arguments, without printing them.
    const skeleton = createTransaction(metadata.accountId, key.getPublicKey(), input.receiver, 0n, input.actions, new Uint8Array(32));
    const fingerprint = createHash('sha256').update(encodeTransaction(skeleton)).digest('hex');
    let entry = book.entries[input.id];
    if (entry && (entry.signer !== metadata.accountId || entry.receiver !== input.receiver || entry.fingerprint !== fingerprint)) throw new Error('The original native operation changed. Preserve its signed intent.');
    if (!entry) {
      if (Object.values(book.entries).some(value => value.signer === metadata.accountId && value.status === 'prepared')) throw new Error('An earlier native operation is unresolved.');
      const block = await operatorRpc<{ header: { hash: string } }>('block', { finality: 'final' });
      const access = await operatorRpc<{ nonce: number; permission: unknown }>('query', { request_type: 'view_access_key', account_id: metadata.accountId, public_key: metadata.publicKey, block_id: block.header.hash });
      if (!Number.isSafeInteger(access.nonce) || access.permission !== 'FullAccess') throw new Error('The prepared native signer has unexpected authority.');
      const transaction = createTransaction(metadata.accountId, key.getPublicKey(), input.receiver, BigInt(access.nonce) + 1n, input.actions, baseDecode(block.header.hash));
      const signed = await signer.signTransaction(transaction);
      entry = { signer: metadata.accountId, receiver: input.receiver, fingerprint, hash: baseEncode(signed.txHash), raw: Buffer.from(signed.signedTransaction.encode()).toString('base64'), nonce: transaction.nonce.toString(), status: 'prepared', createdAt: new Date().toISOString() };
      book.entries[input.id] = entry; await save();
    }
    const decoded = decodeSignedTransaction(Buffer.from(entry.raw, 'base64')), encoded = encodeTransaction(decoded.transaction);
    // SDK decoding returns nested signature data without class getters.
    const decodedSignature = decoded.signature.ed25519Signature?.data ?? decoded.signature.data;
    const signature = Array.isArray(decodedSignature) ? Uint8Array.from(decodedSignature) : decodedSignature;
    const decodedSkeleton = createTransaction(metadata.accountId, key.getPublicKey(), input.receiver, 0n, decoded.transaction.actions, new Uint8Array(32));
    if (decoded.transaction.signerId !== metadata.accountId || decoded.transaction.receiverId !== input.receiver || decoded.transaction.nonce.toString() !== entry.nonce
      || decoded.transaction.publicKey.toString() !== metadata.publicKey || createHash('sha256').update(encodeTransaction(decodedSkeleton)).digest('hex') !== fingerprint
      || !(signature instanceof Uint8Array) || signature.length !== 64
      || baseEncode(createHash('sha256').update(encoded).digest()) !== entry.hash || !key.verify(createHash('sha256').update(encoded).digest(), signature)) throw new Error('The exact native signed operation failed verification.');
    if (entry.status === 'failed') throw new Error('The earlier native operation failed; inspect it before preparing another.');
    let outcome: Outcome | undefined;
    try { outcome = await operatorRpc<Outcome>('tx', { tx_hash: entry.hash, sender_account_id: metadata.accountId, wait_until: 'NONE' }); }
    catch (error) { if ((error as { rpcCode?: string }).rpcCode !== 'UNKNOWN_TRANSACTION') throw error; }
    if (!outcome && entry.status !== 'confirmed') {
      try { outcome = await operatorRpc<Outcome>('send_tx', { signed_tx_base64: entry.raw, wait_until: 'NONE' }); }
      catch { throw new Error('The native send is uncertain. Its exact journal is preserved.'); }
    }
    const until = Date.now() + 150000;
    while ((!outcome || outcome.final_execution_status !== 'FINAL') && Date.now() < until) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      outcome = await operatorRpc<Outcome>('tx', { tx_hash: entry.hash, sender_account_id: metadata.accountId, wait_until: 'NONE' });
    }
    if (!outcome || outcome.final_execution_status !== 'FINAL') throw new Error('Native receipt is still pending. Preserve the original operation.');
    if (outcome.status?.Failure) { entry.status = 'failed'; await save(); throw new Error('Native execution failed. Its original receipt is retained.'); }
    entry.status = 'confirmed'; await save(); return { hash: entry.hash, outcome };
  } finally { release(); process.removeListener('exit', release); }
}
export { actions };
