import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { baseEncode, baseDecode } from 'near-api-js';
import { keccak256, toHex } from 'viem';
import { v2DecisionConfig } from '../../server/v2/preparation';
import { nearWalletMetadata } from './local-wallet';
import { actions, executeNearOperation, nativeOperationInfo, operatorRpc, operatorView } from './operator';

const owner = nearWalletMetadata('owner'), contract = nearWalletMetadata('contract'), relay = nearWalletMetadata('relay');
const artifact = path.resolve('contracts/near/artifacts/nearlyhuman_near.wasm'), wasm = await fs.readFile(artifact);
if (!WebAssembly.validate(wasm)) throw new Error('The reviewed native artifact is invalid.');
const sha256 = createHash('sha256').update(wasm).digest('hex'), codeHash = baseEncode(createHash('sha256').update(wasm).digest());
const build = JSON.parse(await fs.readFile('contracts/near/artifacts/build.json', 'utf8'));
if (build.sha256 !== sha256) throw new Error('The reviewed native artifact fingerprint changed.');
for (const relative of ['src/lib.rs', 'src/kernel.rs', 'Cargo.toml', 'Cargo.lock']) {
  const sourceHash = createHash('sha256').update(await fs.readFile(path.join('contracts/near', relative))).digest('hex');
  if (build.sources?.[relative] !== sourceHash) throw new Error('A native contract source changed after its verified build.');
}
const rulesHash = keccak256(toHex('nearlyhuman-v2-kernel-2')), decisionConfig = v2DecisionConfig(rulesHash);
const quoteSigner = Buffer.from(baseDecode(relay.publicKey.slice('ed25519:'.length))).toString('base64');
const init = { owner_id: owner.accountId, relayer_id: relay.accountId, quote_public_key: quoteSigner, native_mint_price: '100000000000000000000000', decision_config: decisionConfig, metadata_base: 'https://nearlyhuman.netlify.app' };
const runtime = { version: 2, networkId: 'near-testnet', network: 'testnet', collection: contract.accountId, rpcUrl: 'https://test.rpc.fastnear.com', codeHash, rulesHash, decisionConfig, relayer: relay.accountId, quoteSigner };
if (!process.argv.includes('--broadcast')) {
  console.log(JSON.stringify({ mode: 'dry-run', runtime, artifact: { bytes: wasm.length, sha256 }, init, signing: false }));
} else {
  if (!process.argv.includes('--gate=native-testnet-integration')) throw new Error('An exact native testnet deployment gate is required.');
  process.env.NEARLYHUMAN_NEAR_QA_WALLET = '1';
  const before = await operatorRpc<{ amount: string; code_hash: string; storage_usage: number }>('query', { request_type: 'view_account', finality: 'final', account_id: contract.accountId });
  const previous = await nativeOperationInfo('deploy-contract-v1');
  if (before.code_hash !== '11111111111111111111111111111111' && !previous) throw new Error('This native account already has code. Review its existing deployment first.');
  if (!previous && BigInt(before.amount) < BigInt(wasm.length + 20000) * 10000000000000000000n) throw new Error('Native code storage and operating margin are not funded.');
  const result = await executeNearOperation({ id: 'deploy-contract-v1', role: 'contract', receiver: contract.accountId, actions: [actions.deployContract(wasm), actions.functionCall('new', init, 100000000000000n, 0n)] });
  const [account, config] = await Promise.all([
    operatorRpc<{ amount: string; code_hash: string; storage_usage: number; block_height: number; block_hash: string }>('query', { request_type: 'view_account', finality: 'final', account_id: contract.accountId }),
    operatorView<Record<string, unknown>>(contract.accountId, 'config'),
  ]);
  if (account.code_hash !== codeHash || config.contract_id !== contract.accountId || config.owner_id !== owner.accountId || config.relayer_id !== relay.accountId
    || config.quote_public_key !== quoteSigner || config.rules_hash !== rulesHash || config.decision_config !== decisionConfig) throw new Error('The actual native deployment identity does not match its reviewed artifact and roles.');
  const record = { version: 2, deployedAtUtc: new Date().toISOString(), deploymentTransaction: result.hash, artifact: { path: 'contracts/near/artifacts/nearlyhuman_near.wasm', sha256, bytes: wasm.length }, runtime,
    owner: owner.accountId, contractPublicKey: contract.publicKey, relayPublicKey: relay.publicKey, observedBlock: String(account.block_height), observedBlockHash: account.block_hash, storageUsage: account.storage_usage, contractBalanceYoctoNEAR: account.amount, config };
  await fs.mkdir('contracts/near/deployments', { recursive: true });
  await fs.writeFile('contracts/near/deployments/testnet.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify({ deployed: true, contract: contract.accountId, hash: result.hash, codeHash, storageUsage: account.storage_usage, balanceYoctoNEAR: account.amount }));
}
