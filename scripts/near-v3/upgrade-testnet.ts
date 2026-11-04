/** Same-account, code-only native testnet upgrade. Read-only unless every gate is explicit. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { baseEncode } from 'near-api-js';
import { nearWalletMetadata } from '../near/local-wallet';
import { actions, executeNearOperation, nativeOperationInfo, operatorRpc } from '../near/operator';

const ACCOUNT = 'game.nearlyhuman-dev-20261102-26c8bd.testnet';
const OWNER = 'nearlyhuman-dev-20261102-26c8bd.testnet';
const OWNER_KEY = 'ed25519:E35ptAqr7e97GX1PERwd2BhztQhnkM92u6y4BCWeyiAX';
const CONTRACT_KEY = 'ed25519:Cqmrf3iKa8h6phvgQ9n8STbNfFEk6Rb1TZbd4j2jBRfr';
const OLD_CODE = 'F8hcchfZEbdVzEpKaFxM65LsVHiZSs2Lu72TLbRC1PfV';
const OLD_SHA = 'd1fc9ae7ad38895ede3dca756100f1e56583b312fb45349aa963b18f9792f880';
const CANDIDATE_SHA = 'cd3d6e1b58739ea6a697c7a70c343b7e4d9e9f077a3eb7f55479ccddddd70070';
const PREVIOUS_FILE = 'contracts/near/deployments/testnet.json';
const NEW_FILE = 'contracts/near-v3/deployments/testnet.json';
const ARTIFACT = 'contracts/near-v3/artifacts/nearlyhuman_near_v3.wasm';
const SOURCE_ROOT = 'contracts/near-v3';
const EXTENSION_FIELDS = ['transfer_burn_enabled', 'transfer_burn_bps', 'total_transfer_burned', 'transfer_call_reserved', 'transfer_call_pending'];
const sha = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file: string) => JSON.parse(await fs.readFile(file, 'utf8'));
const same = (actual: unknown, expected: unknown, reason: string) => assert.deepEqual(actual, expected, reason);
const broadcast = process.argv.includes('--broadcast');
if (broadcast && (!process.argv.includes('--gate=native-transfer-burn-v3') || !process.argv.includes('--unlock-testnet-dpapi')
  || !process.argv.includes(`--expect-sha=${CANDIDATE_SHA}`))) throw Error('Explicit reviewed testnet upgrade, artifact and DPAPI unlock flags are required.');

const previousBytes = await fs.readFile(PREVIOUS_FILE), previous = JSON.parse(previousBytes.toString('utf8'));
same(previous.runtime.collection, ACCOUNT, 'Previous collection pin changed.');
same(previous.owner, OWNER, 'Previous owner pin changed.');
same(previous.runtime.networkId, 'near-testnet', 'Previous network pin changed.');
same(previous.runtime.network, 'testnet', 'Previous network pin changed.');
same(previous.runtime.rpcUrl, 'https://test.rpc.fastnear.com', 'Previous RPC pin changed.');
same(previous.runtime.codeHash, OLD_CODE, 'Recorded pre-upgrade code pin changed.');
same(previous.artifact.sha256, OLD_SHA, 'Recorded pre-upgrade artifact changed.');
same(previous.contractPublicKey, CONTRACT_KEY, 'Recorded contract key changed.');
same(sha(await fs.readFile('contracts/near/artifacts/nearlyhuman_near.wasm')), OLD_SHA, 'Original artifact changed.');

const wasm = await fs.readFile(ARTIFACT), build = await readJson(SOURCE_ROOT + '/artifacts/build.json');
const artifactHash = sha(wasm), codeHash = baseEncode(createHash('sha256').update(wasm).digest());
same(artifactHash, CANDIDATE_SHA, 'Candidate differs from the reviewed upgrade.');
same(build.sha256, artifactHash, 'Candidate manifest mismatch.');
same(build.bytes, wasm.length, 'Candidate size mismatch.');
same(build.rust, '1.95.0', 'Candidate compiler pin changed.');
same(build.nearSdk, '5.30.0', 'Candidate SDK pin changed.');
same(build.rustFlags, '--cfg near', 'Candidate flags changed.');
if (!WebAssembly.validate(wasm)) throw Error('Invalid candidate Wasm.');
const sources = ['Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'src/transfer_burn.rs', '../near/src/kernel.rs'];
same(Object.keys(build.sources).sort(), sources.slice().sort(), 'Unexpected candidate source manifest.');
for (const source of sources) same(sha(await fs.readFile(path.join(SOURCE_ROOT, source))), build.sources[source], 'Source changed since build: ' + source);
same(build.sources['../near/src/kernel.rs'], '2bbc47bc5948af5c1001b3f42dc287610eb172fa3b5d74cbf74fe67a32c805e3', 'Canonical kernel changed.');
const unit = await readJson('docs/token/v3/near-unit-proof.json'), sandbox = await readJson('docs/token/v3/near-sandbox-proof.json');
if (!unit.pass || unit.passed < 19 || !sandbox.pass || !sandbox.upgrade?.preserved) throw Error('Candidate verification is incomplete.');
same(unit.artifactSha256, artifactHash, 'Unit evidence belongs to another candidate.');
same(unit.sourceTestsSha256, sha(await fs.readFile(SOURCE_ROOT + '/src/tests.rs')), 'Unit test source changed since proof.');
same(sandbox.newArtifact.sha256, artifactHash, 'Sandbox evidence belongs to another candidate.');
same(sandbox.oldArtifact.sha256, OLD_SHA, 'Sandbox did not exercise the recorded old code.');

// These files contain public metadata only. The DPAPI loader is called exclusively
// by executeNearOperation, after all broadcast gates and durable baseline saving.
const owner = nearWalletMetadata('owner'), contract = nearWalletMetadata('contract'), relay = nearWalletMetadata('relay');
same(owner.accountId, OWNER, 'Owner wallet account changed.');
same(owner.publicKey, OWNER_KEY, 'Owner wallet key changed.');
same(contract.accountId, ACCOUNT, 'Contract wallet account changed.');
same(contract.publicKey, CONTRACT_KEY, 'Contract wallet key changed.');
same(relay.accountId, previous.runtime.relayer, 'Relay account changed.');
same(relay.publicKey, previous.relayPublicKey, 'Relay key changed.');
same((await operatorRpc<{ chain_id: string }>('status', [])).chain_id, 'testnet', 'Refuse another chain.');

interface Snapshot {
  block: { hash: string; height: number };
  account: { code_hash: string; storage_usage: number; amount: string; locked: string };
  config: Record<string, unknown>;
  nftSupply: string;
  ftSupply: string;
  state: { sha256: string; entries: number };
}
async function snapshot(): Promise<Snapshot> {
  const block = await operatorRpc<{ header: { hash: string; height: number } }>('block', { finality: 'final' });
  const query = async <T>(params: Record<string, unknown>) => {
    const result = await operatorRpc<T & { block_hash: string }>('query', { account_id: ACCOUNT, block_id: block.header.hash, ...params });
    same(result.block_hash, block.header.hash, 'Snapshot query changed its block.'); return result;
  };
  const view = async <T>(method_name: string) => {
    const result = await query<{ result: number[] }>({ request_type: 'call_function', method_name, args_base64: 'e30=' });
    return JSON.parse(Buffer.from(result.result).toString('utf8')) as T;
  };
  const [account, config, nftSupply, ftSupply, raw] = await Promise.all([
    query<Snapshot['account']>({ request_type: 'view_account' }), view<Record<string, unknown>>('config'), view<string>('nft_total_supply'), view<string>('ft_total_supply'),
    query<{ values: Array<{ key: string; value: string }> }>({ request_type: 'view_state', prefix_base64: '' }),
  ]);
  const rows = raw.values.map(({ key, value }) => ({ key, value })).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return { block: block.header, account, config, nftSupply, ftSupply, state: { sha256: sha(JSON.stringify(rows)), entries: rows.length } };
}
function validateIdentity(s: Snapshot) {
  if (![OLD_CODE, codeHash].includes(s.account.code_hash)) throw Error('Deployed code changed unexpectedly.');
  same(s.config.network_id, 'near-testnet', 'Live contract network changed.');
  same(s.config.contract_id, ACCOUNT, 'Live contract account changed.');
  same(s.config.owner_id, OWNER, 'Live owner changed.');
  same(s.config.relayer_id, previous.runtime.relayer, 'Live relay changed.');
  same(s.config.quote_public_key, previous.runtime.quoteSigner, 'Live quote signer changed.');
  same(s.config.rules_hash, previous.runtime.rulesHash, 'Live economic rules changed.');
  same(s.config.decision_config, previous.runtime.decisionConfig, 'Live decision policy changed.');
}
function requireDrained(s: Snapshot) {
  if (s.config.admissions_paused !== true || s.config.native_storage_reserved !== '0' || s.config.reserved !== '0'
    || (s.config.transfer_call_pending !== undefined && s.config.transfer_call_pending !== 0)) throw Error('Root must pause admissions and drain accepted days and transfer callbacks before this upgrade.');
}
function verifyUpgrade(before: Snapshot, after: Snapshot) {
  validateIdentity(after); same(after.account.code_hash, codeHash, 'Candidate code not final.');
  same(after.state, before.state, 'Contract raw state changed during code-only upgrade.');
  same(after.nftSupply, before.nftSupply, 'NFT supply changed.'); same(after.ftSupply, before.ftSupply, 'NHC supply changed.');
  const preserved = { ...after.config }; for (const field of EXTENSION_FIELDS) delete preserved[field];
  same(preserved, before.config, 'Existing configuration or financial state changed.');
  same(after.config.transfer_burn_enabled, true, 'Initial burn must be enabled.'); same(after.config.transfer_burn_bps, 50, 'Initial fee changed.');
  same(after.config.total_transfer_burned, '0', 'Code-only upgrade cannot burn tokens.');
  same(after.config.transfer_call_reserved, '0', 'Code-only upgrade cannot reserve tokens.'); same(after.config.transfer_call_pending, 0, 'Code-only upgrade cannot create callbacks.');
}

const operationId = 'upgrade-burn-v3-' + artifactHash.slice(0, 16);
const journalDirectory = path.join(os.homedir(), '.codex', 'data', 'nearlyhuman', 'near-upgrades');
const journalFile = path.join(journalDirectory, 'burn-v3-' + artifactHash + '.json');
interface Journal { version: 1; network: 'testnet'; account: string; candidate: string; previousRecordSha256: string; operationId: string; before: Snapshot; createdAt: string; transaction?: string; after?: Snapshot; verifiedAt?: string }
async function existingJournal(): Promise<Journal | undefined> {
  try { const j = await readJson(journalFile) as Journal;
    same(j.version, 1, 'Upgrade journal version changed.'); same(j.network, 'testnet', 'Upgrade journal chain changed.'); same(j.account, ACCOUNT, 'Upgrade journal account changed.');
    same(j.candidate, artifactHash, 'Upgrade journal candidate changed.'); same(j.operationId, operationId, 'Upgrade operation changed.');
    same(j.previousRecordSha256, sha(previousBytes), 'Previous deployment record changed since baseline.'); same(j.before.account.code_hash, OLD_CODE, 'Upgrade baseline does not contain the old code.');
    validateIdentity(j.before); requireDrained(j.before); return j;
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
}
const observed = await snapshot(); validateIdentity(observed);
if (!broadcast) {
  const journal = await existingJournal();
  console.log(JSON.stringify({ mode: 'read-only', signing: false, account: ACCOUNT, owner: OWNER, currentCodeHash: observed.account.code_hash, newCodeHash: codeHash, artifact: { sha256: artifactHash, bytes: wasm.length },
    paused: observed.config.admissions_paused, nativeStorageReserved: observed.config.native_storage_reserved, rewardReserved: observed.config.reserved, nftSupply: observed.nftSupply, ftSupply: observed.ftSupply,
    alreadyCandidate: observed.account.code_hash === codeHash, preservedBaselineAvailable: Boolean(journal), state: observed.state, initialization: false, newRecord: NEW_FILE }));
} else {
  // Serialize this upgrade's baseline and record work independently of the shared
  // exact-operation signer journal. Never erase another process's lock.
  await fs.mkdir(journalDirectory, { recursive: true });
  const lockFile = journalFile + '.lock', lockToken = randomUUID(), handle = await fs.open(lockFile, 'wx', 0o600);
  await handle.writeFile(JSON.stringify({ pid: process.pid, token: lockToken, at: new Date().toISOString() })); await handle.sync(); await handle.close();
  const release = () => { try { const held = JSON.parse(fsSync.readFileSync(lockFile, 'utf8')); if (held.pid === process.pid && held.token === lockToken) fsSync.unlinkSync(lockFile); } catch { /* Preserve uncertain or foreign locks. */ } };
  process.once('exit', release);
  try {
    let journal = await existingJournal();
    const before = await snapshot(); validateIdentity(before); requireDrained(before);
    const save = async () => { const temporary = journalFile + '.' + lockToken + '.tmp'; const file = await fs.open(temporary, 'wx', 0o600); try { await file.writeFile(JSON.stringify(journal, null, 2) + '\n'); await file.sync(); } finally { await file.close(); } await fs.rename(temporary, journalFile); };
    if (!journal) {
      if (before.account.code_hash !== OLD_CODE) throw Error('Candidate already exists without this preserved baseline. Manual reconciliation required.');
      journal = { version: 1, network: 'testnet', account: ACCOUNT, candidate: artifactHash, previousRecordSha256: sha(previousBytes), operationId, before, createdAt: new Date().toISOString() };
      await save();
    } else if (before.account.code_hash === OLD_CODE) {
      same(before.state, journal.before.state, 'Pre-upgrade state changed since the durable baseline.'); same(before.config, journal.before.config, 'Pre-upgrade config changed.');
    }
    let transaction = journal.transaction;
    if (before.account.code_hash === OLD_CODE) {
      const needed = BigInt(before.account.storage_usage + Math.max(0, wasm.length - previous.artifact.bytes)) * 10_000_000_000_000_000_000n + 20_000_000_000_000_000_000_000n;
      if (BigInt(before.account.amount) < needed) throw Error('Candidate code rent and operating margin are not funded.');
      process.env.NEARLYHUMAN_NEAR_QA_WALLET = '1';
      transaction = (await executeNearOperation({ id: operationId, role: 'contract', receiver: ACCOUNT, actions: [actions.deployContract(wasm)] })).hash;
      journal.transaction = transaction; await save();
    } else if (!transaction) {
      const prior = await nativeOperationInfo(operationId);
      if (!prior || prior.signer !== ACCOUNT || prior.receiver !== ACCOUNT) throw Error('Cannot reconcile candidate code with its original signed upgrade.');
      const receipt = await operatorRpc<{ final_execution_status?: string; status?: { SuccessValue?: string }; transaction?: { hash: string; signer_id: string; receiver_id: string } }>('tx', { tx_hash: prior.hash, sender_account_id: ACCOUNT, wait_until: 'NONE' });
      if (receipt.final_execution_status !== 'FINAL' || !receipt.status || !('SuccessValue' in receipt.status)
        || receipt.transaction?.hash !== prior.hash || receipt.transaction.signer_id !== ACCOUNT || receipt.transaction.receiver_id !== ACCOUNT) throw Error('The original upgrade receipt is not confirmed; preserve its operation journal.');
      transaction = prior.hash; journal.transaction = transaction; await save();
    }
    const after = await snapshot(); verifyUpgrade(journal.before, after);
    journal.after = after; journal.verifiedAt = new Date().toISOString(); await save();
    const record = { ...previous, version: 3, deployedAtUtc: journal.verifiedAt, deploymentTransaction: transaction, initializationTransaction: previous.initializationTransaction || previous.deploymentTransaction,
      artifact: { path: ARTIFACT, sha256: artifactHash, bytes: wasm.length }, runtime: { ...previous.runtime, codeHash }, config: after.config, observedBlock: String(after.block.height), observedBlockHash: after.block.hash,
      storageUsage: after.account.storage_usage, contractBalanceYoctoNEAR: after.account.amount, previousDeployment: PREVIOUS_FILE,
      history: [...(previous.history || []), { transaction: previous.deploymentTransaction, codeHash: OLD_CODE, artifact: previous.artifact, deployedAtUtc: previous.deployedAtUtc }],
      upgradeStateProof: { beforeBlock: String(journal.before.block.height), beforeBlockHash: journal.before.block.hash, afterBlock: String(after.block.height), afterBlockHash: after.block.hash,
        sha256: after.state.sha256, entries: after.state.entries, nftSupply: after.nftSupply, ftSupply: after.ftSupply, preserved: true },
    };
    await fs.mkdir(path.dirname(NEW_FILE), { recursive: true });
    // A resume may complete a missing record; an existing record must identify
    // this same exact upgrade before its latest verified observation is saved.
    try { const old = await readJson(NEW_FILE); same(old.runtime.codeHash, codeHash, 'New deployment record already belongs to different code.'); same(old.deploymentTransaction, transaction, 'New deployment transaction changed.'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    await fs.writeFile(NEW_FILE, JSON.stringify(record, null, 2) + '\n');
    console.log(JSON.stringify({ upgraded: true, account: ACCOUNT, transaction, codeHash, artifactSha256: artifactHash, statePreserved: true, nftSupply: after.nftSupply, ftSupply: after.ftSupply, admissionsPaused: after.config.admissions_paused, record: NEW_FILE }));
  } finally { release(); process.removeListener('exit', release); }
}
