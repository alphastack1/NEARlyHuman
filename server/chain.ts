import { randomUUID } from 'node:crypto';
import { BlockNotFoundError, ContractFunctionRevertedError, ExecutionRevertedError, createPublicClient, encodeFunctionData, http, keccak256, toHex, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { nearlyHumanAbi } from '../src/chain/abi';
import { chainFor, type CollectionConfig } from '../src/chain/config';
import { deployments } from '../src/chain/deployments';
import { acceptedRequest, type ChainRequest, type ChainRooster } from '../src/chain/client';
import { decodeHistory, unpackState } from '../src/domain/codec';
import type { Rooster, SavedOutcome } from '../src/app/api';
import { serverConfig } from './config';
import { storage, update } from './storage';

export class ServiceError extends Error {
  constructor(message: string, public code = 'unavailable', public status = 400) { super(message); }
}
export function checkedAddress(value: unknown): Address {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new ServiceError('Connect a wallet first.', 'wallet');
  return value as Address;
}
export function checkedRequest(value: unknown): Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new ServiceError('Please check this request again.', 'request');
  return value as Hex;
}
export function checkedToken(value: unknown): bigint {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') throw new ServiceError('Choose a rooster.', 'token');
  if (!/^[1-9][0-9]{0,19}$/.test(String(value))) throw new ServiceError('Choose a rooster.', 'token');
  return BigInt(value);
}
export function connection() {
  const cfg = serverConfig();
  const address = cfg.collection || deployments[cfg.chainId]?.address;
  if (!address) throw new ServiceError('The home connection is resting. Try again shortly.', 'connection', 503);
  const chain = chainFor(cfg.chainId);
  const config = { chainId: chain.id, address, rpcUrl: cfg.rpcUrl } as CollectionConfig;
  const client = createPublicClient({ chain, transport: http(cfg.rpcUrl, { retryCount: 2, timeout: 10_000 }), cacheTime: 0 });
  return { cfg, config, chain, address, client };
}
export function serviceAccount() {
  const key = serverConfig().relayKey;
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503);
  return privateKeyToAccount(key);
}
const verifiedConnections=new Map<string,{until:number;pending:Promise<void>}>();
/** Fail closed if an operator points a network configuration at the wrong RPC or collection. */
export async function verifyConnection() {
  const {client,chain,address,cfg}=connection(),key=`${chain.id}:${address.toLowerCase()}:${cfg.rpcUrl}`;
  const previous=verifiedConnections.get(key);if(previous&&previous.until>Date.now())return previous.pending;
  const pending=(async()=>{
    const [rpcChain,code,version,stateBytes,testnet]=await Promise.all([
      client.getChainId(),client.getCode({address}),
      client.readContract({address,abi:nearlyHumanAbi,functionName:'RULES_VERSION'}),
      client.readContract({address,abi:nearlyHumanAbi,functionName:'STATE_BYTES'}),
      client.readContract({address,abi:nearlyHumanAbi,functionName:'isTestnet'}),
    ]);
    if(rpcChain!==chain.id||!code||code==='0x'||version!==1||stateBytes!==192n||testnet!==(chain.id===46630))throw new Error('Network configuration mismatch.');
  })().catch(()=>{verifiedConnections.delete(key);throw new ServiceError('The home connection is resting. Try again shortly.','connection',503);});
  verifiedConnections.set(key,{until:Date.now()+30_000,pending});return pending;
}
/** A missing RPC block is different from a missing transaction, account or application record. */
export function blockUnavailable(error:unknown):boolean {
  const seen=new Set<unknown>(),causes:Array<{name?:unknown;message?:unknown;shortMessage?:unknown;details?:unknown;cause?:unknown}>=[];
  for(let current=error,depth=0;current&&typeof current==='object'&&depth<8&&!seen.has(current);depth++){
    seen.add(current);const e=current as typeof causes[number];causes.push(e);current=e.cause;
  }
  // A contract's own revert reason can contain these words, including on another line.
  if(causes.some(e=>e instanceof ContractFunctionRevertedError||e instanceof ExecutionRevertedError||['ContractFunctionRevertedError','ExecutionRevertedError'].includes(String(e.name))))return false;
  for(const e of causes){
    if(e instanceof BlockNotFoundError)return true;
    for(const text of [e.shortMessage,e.details,e.message])if(typeof text==='string'){
      for(const line of text.split('\n').map(line=>line.trim()).filter(Boolean).filter((line,index)=>index===0||/^Details:\s*/i.test(line))){
        const detail=line.trim().replace(/^Details:\s*/i,'');
        if(/^Block(?: at (?:number "[0-9]+"|hash "0x[0-9a-f]{64}"))? could not be found\.(?:\s|$)/i.test(detail)||/^(?:unsupported block number|header not found|block not found)(?:[.:\s]|$)/i.test(detail))return true;
      }
    }
  }
  return false;
}
/** Public RPC replicas can briefly disagree about the newest supported height. */
export async function pinnedRead<T>(read:()=>Promise<T>):Promise<T> {
  for(let attempt=0;;attempt++){
    try{return await read();}catch(error){
      if(attempt>=4||!blockUnavailable(error))throw error;
      await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
    }
  }
}

export async function readRawRooster(tokenId: bigint) {
  await verifyConnection();
  const { client, address } = connection();
  const block = await pinnedRead(()=>client.getBlock());
  const [raw, owner] = await pinnedRead(()=>Promise.all([
    client.readContract({ address, abi: nearlyHumanAbi, functionName: 'getRooster', args: [tokenId], blockNumber: block.number }),
    client.readContract({ address, abi: nearlyHumanAbi, functionName: 'ownerOf', args: [tokenId], blockNumber: block.number }),
  ]));
  const verified=await pinnedRead(()=>client.getBlock({blockNumber:block.number}));if(verified.hash!==block.hash)throw new ServiceError('Checking the latest saved day. Try again.','checking',409);
  return { raw, owner, block };
}
export function roosterView(tokenId: bigint, raw: ChainRooster, owner: Address, request?: ChainRequest): Rooster {
  return { id: tokenId.toString(), owner, revision: raw.revision,
    state: unpackState(raw.state, { seed: raw.seed, name: raw.name, stats: { body: raw.body, wits: raw.wits, spirit: raw.spirit } }),
    pending: raw.pendingRequest !== toHex(0, { size: 32 }) ? { id: raw.pendingRequest, deadline: Number(request?.deadline || 0n), status: 'pending' } : undefined,
    latestDay: raw.day };
}
export async function readRooster(value: string | bigint): Promise<Rooster> {
  const tokenId = checkedToken(value); const { raw, owner } = await readRawRooster(tokenId);
  let request: ChainRequest | undefined;
  if (raw.pendingRequest !== toHex(0, { size: 32 })) request = await readRequest(raw.pendingRequest);
  return roosterView(tokenId, raw, owner, request);
}
export async function readRoosters(value: string, cursor = 0n, limit = 24n) {
  const player = checkedAddress(value); const { client, address } = connection();
  const [ids, nextCursor] = await client.readContract({ address, abi: nearlyHumanAbi, functionName: 'ownedTokens', args: [player, cursor, limit > 50n ? 50n : limit] });
  const roosters: Rooster[] = [];
  for (let i = 0; i < ids.length; i += 6) roosters.push(...await Promise.all(ids.slice(i, i + 6).map(readRooster)));
  return { roosters, nextCursor: nextCursor.toString() };
}
export async function readRequest(requestId: Hex): Promise<ChainRequest> {
  const { client, address } = connection();
  return client.readContract({ address, abi: nearlyHumanAbi, functionName: 'getRequest', args: [checkedRequest(requestId)] });
}
export async function canonicalRequest(requestId: Hex) {
  await verifyConnection();
  const { client, address } = connection(); const block = await pinnedRead(()=>client.getBlock());
  const request = await pinnedRead(()=>client.readContract({ address, abi: nearlyHumanAbi, functionName: 'getRequest', args: [requestId], blockNumber: block.number }));
  if (request.status === 0) return { request, block, raw: undefined, owner: undefined };
  const [raw, owner] = await pinnedRead(()=>Promise.all([
    client.readContract({ address, abi: nearlyHumanAbi, functionName: 'getRooster', args: [request.tokenId], blockNumber: block.number }),
    client.readContract({ address, abi: nearlyHumanAbi, functionName: 'ownerOf', args: [request.tokenId], blockNumber: block.number }),
  ]));
  const verified=await pinnedRead(()=>client.getBlock({blockNumber:block.number}));if(verified.hash!==block.hash)throw new ServiceError('Checking the accepted day. Try again.','checking',409);
  return { request, raw, owner, block };
}
export async function readAcceptedTransaction(hash: Hex, player?: Address) {
  await verifyConnection();
  const { client, address } = connection();
  const receipt = await client.getTransactionReceipt({ hash: checkedRequest(hash) });
  if (receipt.status !== 'success') throw new ServiceError('The request was not accepted. Your saved day is unchanged.', 'transaction');
  const block = await pinnedRead(()=>client.getBlock({ blockNumber: receipt.blockNumber }));
  if (block.hash !== receipt.blockHash) throw new ServiceError('Checking this transaction. Please try again.', 'checking', 409);
  const accepted = acceptedRequest({ ...receipt, logs: receipt.logs.filter(log => log.address.toLowerCase() === address.toLowerCase()) });
  if (!accepted || player && accepted.player.toLowerCase() !== player.toLowerCase()) throw new ServiceError('This request belongs to another wallet.', 'ownership', 403);
  const request = await readRequest(accepted.requestId);
  if (request.status === 0 || request.player.toLowerCase() !== accepted.player.toLowerCase()) throw new ServiceError('Checking this request. Please try again.', 'checking', 409);
  const transaction=await client.getTransaction({hash:receipt.transactionHash});
  return { ...accepted, request, ownerTx: receipt.transactionHash, ownerNonce:transaction.from.toLowerCase()===accepted.player.toLowerCase()?transaction.nonce:undefined };
}
export async function chainOutcome(value: string): Promise<SavedOutcome> {
  const tokenId = checkedToken(value), rooster = await readRooster(tokenId);
  if (!rooster.latestDay) return { rooster, summary: ['A new life is ready to begin.'], history: [] };
  const { client, address } = connection();
  const [summary, history] = await client.readContract({ address, abi: nearlyHumanAbi, functionName: 'getDay', args: [tokenId, rooster.latestDay] });
  const records = decodeHistory(history);
  const lines = summary.alive ? [`Day ${summary.day} survived.`, `Level ${summary.level}.`] : [`This life ended on game day ${summary.day}.`, `Final level ${summary.level}.`];
  return { rooster, summary: lines, history: records };
}

export interface RelayIntent { jobId: string; kind: 'finalize' | 'failure' | 'expire'; data: Hex; resultDigest: string }
export interface RelayJournal extends RelayIntent { hash: Hex; raw: Hex; nonce: number; createdAt: number }
interface RelayControl { lease?: { id: string; until: number }; pending?: RelayJournal }
export class RelayBusy extends Error { constructor() { super('The saved result is waiting for confirmation.'); } }
const leaseMs = 120_000;

/** Serialized durable outbox. A signed intent is stored before its first broadcast. */
export async function terminalTransaction(intent: RelayIntent, onJournal: (journal: RelayJournal) => Promise<void>) {
  await verifyConnection();
  const { client, chain } = connection(); const account = serviceAccount();
  const relayKey = `control/relay-${chain.id}-${account.address.toLowerCase()}`;
  const leaseId = randomUUID(), now = Date.now();
  const acquired = await update<RelayControl>(relayKey, () => ({}), control => {
    if (control.lease && control.lease.until > now) throw new RelayBusy();
    control.lease = { id: leaseId, until: now + leaseMs }; return control;
  });
  let pending = acquired.pending;
  try {
    if (!pending) {
      const [nonce, gasPrice, estimate] = await Promise.all([
        client.getTransactionCount({ address: account.address, blockTag: 'pending' }), client.getGasPrice(),
        client.estimateGas({ account: account.address, to: connection().address, data: intent.data }),
      ]);
      const gas = estimate * 125n / 100n + 20_000n;
      const raw = await account.signTransaction({ chainId: chain.id, nonce, to: connection().address, data: intent.data, value: 0n, gas, gasPrice: gasPrice * 2n, type: 'legacy' });
      pending = { ...intent, raw, hash: keccak256(raw), nonce, createdAt: Date.now() };
      const prepared = pending;
      await update<RelayControl>(relayKey, () => ({}), control => {
        if (control.lease?.id !== leaseId || control.pending) throw new RelayBusy();
        control.pending = prepared; return control;
      });
    }
    // Recover any earlier signed transaction before allowing another intent at its nonce.
    const sameIntent = pending.jobId === intent.jobId && pending.resultDigest === intent.resultDigest;
    if (sameIntent) await onJournal(pending);
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: pending.hash }); } catch { /* broadcast/recover the exact journaled transaction */ }
    if (!receipt) {
      try { await client.sendRawTransaction({ serializedTransaction: pending.raw }); }
      catch (error) { let known = false; try { await client.getTransaction({ hash: pending.hash }); known = true; } catch { /* remain uncertain */ } if (!known) throw error; }
      receipt = await client.waitForTransactionReceipt({ hash: pending.hash, confirmations: 1, timeout: 70_000 });
    }
    const canonicalBlock = await pinnedRead(()=>client.getBlock({ blockNumber: receipt.blockNumber }));
    if (canonicalBlock.hash !== receipt.blockHash) throw new ServiceError('Checking chain confirmation.', 'checking', 409);
    await update<RelayControl>(relayKey, () => ({}), control => {
      if (control.lease?.id !== leaseId || control.pending?.hash !== pending!.hash) throw new RelayBusy();
      delete control.pending; delete control.lease; return control;
    });
    if (!sameIntent) throw new RelayBusy();
    return { hash: pending.hash, status: receipt.status, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed };
  } finally {
    // Uncertain signed transactions remain in pending; a later lease recovers the same bytes.
    await update<RelayControl>(relayKey, () => ({}), control => { if (control.lease?.id === leaseId) delete control.lease; return control; }).catch(() => {});
  }
}
export function finalizeIntent(requestId: Hex, state: Hex, history: Hex, commitment: Hex): RelayIntent {
  const data = encodeFunctionData({ abi: nearlyHumanAbi, functionName: 'finalize', args: [requestId, state, history, commitment] });
  return { jobId: requestId, kind: 'finalize', data, resultDigest: keccak256(data) };
}
export function failureIntent(requestId: Hex, reason: string): RelayIntent {
  const data = encodeFunctionData({ abi: nearlyHumanAbi, functionName: 'recordFailure', args: [requestId, keccak256(toHex(reason))] });
  return { jobId: requestId, kind: 'failure', data, resultDigest: keccak256(data) };
}
export function expiryIntent(requestId: Hex): RelayIntent {
  const data = encodeFunctionData({ abi: nearlyHumanAbi, functionName: 'releaseExpired', args: [requestId] });
  return { jobId: requestId, kind: 'expire', data, resultDigest: keccak256(data) };
}
