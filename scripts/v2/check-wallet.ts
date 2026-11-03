import assert from 'node:assert/strict';
import { decodeFunctionData, encodeFunctionData, encodeFunctionResult, keccak256, parseAbi, type Address, type EIP1193Provider, type Hex } from 'viem';
import { createV2OwnerWallet, isV2WalletRejected, v2Abi, V2WalletError, type V2SubmissionIntent } from '../../src/chain/v2-client';
import { formatNativeBalance, GAME_NETWORKS, networkForConfig } from '../../src/chain/networks';
import type { V2PublicConfig } from '../../src/v2/public';

const addr = (n: number) => ('0x' + n.toString(16).padStart(40, '0')) as Address;
const hash = ('0x' + '1'.repeat(64)) as Hex, code = '0x60016000' as Hex;
const config: V2PublicConfig = { version: 2, chainId: 46630, networkId: 'robinhood-testnet', collection: addr(1), token: addr(2), verifier: addr(3), actionModule: addr(4), relayer: addr(5), quoteSigner: addr(5), rpcUrl: 'https://mock.invalid', testnet: true, nativeMintPrice: '400000000000000', tokenMintPriceMicro: '250000000', tokenDecimals: 6, multiplier: 2, rulesHash: hash, decisionConfig: hash, controllerCodeHash: keccak256(code), verifierCodeHash: keccak256(code), actionModuleCodeHash: keccak256(code) };
const moduleAbi = parseAbi(['function actionModule() view returns(address)']), tokenAbi = parseAbi(['function approve(address spender,uint256 amount) returns(bool)']);
const block = { number: '0x1', hash, parentHash: hash, nonce: '0x0000000000000000', sha3Uncles: hash, logsBloom: '0x' + '0'.repeat(512), transactionsRoot: hash, stateRoot: hash, receiptsRoot: hash, miner: addr(6), difficulty: '0x0', totalDifficulty: '0x0', extraData: '0x', size: '0x1', gasLimit: '0x1c9c380', gasUsed: '0x0', timestamp: '0x1', transactions: [], uncles: [] };
const originalFetch = globalThis.fetch, submissions: Record<string, unknown>[] = [];
let intent: V2SubmissionIntent | undefined, rejection: unknown, rpcReads = 0;
globalThis.fetch = async (_url, init) => {
  rpcReads++; const request = JSON.parse(String(init?.body)); let result: unknown;
  switch (request.method) {
    case 'eth_chainId': result = '0xb626'; break;
    case 'eth_getBlockByNumber': result = block; break;
    case 'eth_blockNumber': result = '0x1'; break;
    case 'eth_getCode': result = code; break;
    case 'eth_getBalance': result = '0xde0b6b3a7640000'; break;
    case 'eth_getTransactionCount': result = '0x0'; break;
    case 'eth_gasPrice': result = '0x3b9aca00'; break;
    case 'eth_estimateGas': result = '0x30d40'; break;
    case 'eth_call': {
      const call = request.params[0], abi = call.to.toLowerCase() === config.verifier!.toLowerCase() ? moduleAbi : v2Abi;
      const decoded = decodeFunctionData({ abi, data: call.data });
      const values: Record<string, unknown> = { verifier: config.verifier, actionModule: config.actionModule, relayer: config.relayer, quoteSigner: config.quoteSigner, rulesHash: config.rulesHash, token: config.token, nativeMintPrice: BigInt(config.nativeMintPrice) };
      assert(Object.hasOwn(values, decoded.functionName)); result = encodeFunctionResult({ abi, functionName: decoded.functionName, result: values[decoded.functionName] as never }); break;
    }
    default: throw Error('Unexpected controlled RPC ' + request.method);
  }
  return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }), { headers: { 'Content-Type': 'application/json' } });
};
const provider = { request: async (request: { method: string; params?: unknown }) => {
  if (request.method === 'eth_accounts') return [addr(7)];
  if (request.method === 'eth_chainId') return '0xb626';
  assert.equal(request.method, 'eth_sendTransaction'); const transaction = (request.params as Record<string, unknown>[])[0]!;
  assert(intent, 'Exact recovery intent must exist before the wallet prompt.');
  assert.equal(transaction.data, intent.data); assert.equal(transaction.to, intent.to); assert.equal(BigInt(String(transaction.value || '0x0')), BigInt(intent.value)); assert.equal(BigInt(String(transaction.nonce)), BigInt(intent.nonce));
  submissions.push(transaction); if (rejection) throw rejection; return hash;
} } as EIP1193Provider;
try {
  const wallet = createV2OwnerWallet(provider, config, addr(7), next => { intent = next; });
  assert.equal(await wallet.mint('miso', [2, 3, 5]), hash); assert.equal(submissions[0]!.data, encodeFunctionData({ abi: v2Abi, functionName: 'mintNFT', args: ['MISO', [2, 3, 5]] }));
  assert.equal(await wallet.expire(hash), hash); assert.equal(submissions[1]!.data, encodeFunctionData({ abi: v2Abi, functionName: 'expire', args: [hash] }));
  assert.equal(await wallet.approveBirthTokens(), hash); assert.equal(submissions[2]!.data, encodeFunctionData({ abi: tokenAbi, functionName: 'approve', args: [config.collection, 250000000n] }));
  rejection = Object.assign(new Error('Owner declined'), { code: 4001 });
  await assert.rejects(wallet.expire(hash), error => error instanceof V2WalletError && error.code === 'ACTION_REJECTED' && !error.intent);
  rejection = new Error('Connection ended after wallet submission');
  await assert.rejects(wallet.expire(hash), error => !!(error as { intent?: V2SubmissionIntent }).intent);
  assert(isV2WalletRejected(new Error('outer', { cause: new Error('middle', { cause: Object.assign(new Error('declined'), { code: 4001 }) }) })));
  assert.equal(formatNativeBalance(0n), '0 ETH'); assert.equal(formatNativeBalance(1n), '<0.00001 ETH'); assert.equal(formatNativeBalance(1234567890000000n), '0.00123 ETH');
  assert.equal(formatNativeBalance(1500000000000000000000000n, GAME_NETWORKS[2]), '1.5 NEAR');
  assert.equal(networkForConfig({ chainId: 46630, testnet: false }), undefined); assert.equal(networkForConfig(config)?.id, 'robinhood-testnet');
  assert.throws(() => createV2OwnerWallet(provider, { ...config, networkId: 'near-testnet' }, addr(7)), /Choose Robinhood Testnet/);
  console.log(JSON.stringify({ passed: true, walletPrompts: submissions.length, controlledRpcReads: rpcReads, scope: 'Actual viem ABI writes against controlled wallet/RPC: encoding matches recovery journal, rejection stays safe, ambiguous send retains intent, network identity and native balances. Zero live network/wallet writes.' }));
} finally { globalThis.fetch = originalFetch; }
