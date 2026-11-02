import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createPublicClient, encodeDeployData, encodeFunctionData, formatEther, getContractAddress, http, keccak256, parseAbi, parseEther, parseTransaction, recoverTransactionAddress, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { robinhoodTestnet } from '../../src/chain/config';
import { deployments } from '../../src/chain/deployments';
import { loadLocalSecrets } from '../../server/local-secrets';
import { verifyV2Runtime, type V2RuntimeIdentity } from '../../server/v2/context';
import { v2DecisionConfig } from '../../server/v2/preparation';

const broadcast = process.argv.includes('--broadcast');
const pauseOriginal = process.argv.includes('--pause-v1');
if (process.argv.includes('--mainnet')) throw Error('This deployment command permits testnet only.');
const root = path.resolve(import.meta.dirname, '../..');
const owner = '0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6' as Address;
const service = '0x3c63FD61B244b3B3290c74993F603816c6144C26' as Address;
const rpc = 'https://rpc.testnet.chain.robinhood.com';
const client = createPublicClient({ chain: robinhoodTestnet, transport: http(rpc, { timeout: 20000, retryCount: 2 }), cacheTime: 0 });
if (await client.getChainId() !== 46630) throw Error('The RPC is not Robinhood testnet.');
const artifacts = Object.fromEntries(['V2ActionModule', 'V2LifeVerifier', 'NEARlyHumanV2'].map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'contracts/v2/artifacts', name + '.json'), 'utf8'))]));
for (const artifact of Object.values(artifacts)) if ((artifact.deployedBytecode.length - 2) / 2 > 24576) throw Error('A contract exceeds the runtime size limit.');
const fingerprint = createHash('sha256').update(JSON.stringify(Object.values(artifacts).map(a => ({ abi: a.abi, bytecode: a.bytecode })))).digest('hex');
const mintPrice = BigInt(process.env.NEARLYHUMAN_V2_TEST_MINT_PRICE_WEI || parseEther('0.0004'));
if (mintPrice < 0n || mintPrice > parseEther('0.01')) throw Error('Choose a bounded native testnet mint price.');
const [balance, relayBalance, gasPrice] = await Promise.all([client.getBalance({ address: owner }), client.getBalance({ address: service }), client.getGasPrice()]);
const firstData = encodeDeployData({ abi: artifacts.V2ActionModule.abi, bytecode: artifacts.V2ActionModule.bytecode });
const firstEstimate = await client.estimateGas({ account: owner, data: firstData });
console.log(JSON.stringify({ chainId: 46630, owner, service, balance: formatEther(balance), relayBalance: formatEther(relayBalance), gasPrice: gasPrice.toString(), firstDeploymentGas: firstEstimate.toString(), nativeTestMintPrice: mintPrice.toString(), artifactFingerprint: fingerprint, willBroadcast: broadcast, pauseOriginalAdmissions: broadcast && pauseOriginal }));
if (!broadcast) process.exit(0);
process.env.NEARLYHUMAN_QA_WALLET = '1'; loadLocalSecrets();
const ownerKey = process.env.NEARLYHUMAN_QA_OWNER_KEY;
if (!ownerKey || !/^0x[0-9a-f]{64}$/i.test(ownerKey)) throw Error('Unlock the authorized developer wallet.');
const account = privateKeyToAccount(ownerKey as Hex);
if (account.address.toLowerCase() !== owner.toLowerCase()) throw Error('The unlocked wallet is not the developer wallet.');
const directory = path.join(os.homedir(), '.codex/data/nearlyhuman'); fs.mkdirSync(directory, { recursive: true });
const journalPath = path.join(directory, 'deployment-v2-46630.json');
const lockPath = path.join(directory, 'deployment-v2-46630.lock');
function acquireLock() {
  try { const fd = fs.openSync(lockPath, 'wx'); fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, fingerprint, at: new Date().toISOString() })); return fd; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const previous = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (!Number.isSafeInteger(previous.pid) || previous.pid < 1) throw Error('The deployment lock needs inspection.');
    let alive = true;
    try { process.kill(previous.pid, 0); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ESRCH') alive = false; else throw e; }
    if (alive) throw Error('Another deployment process owns this wallet journal.');
    // Never race another contender by automatically unlinking a stale pathname.
    // The operator must inspect the exact prior journal and dead PID first.
    throw Error('The prior deployer stopped. Inspect its journal and stale lock before resuming.');
  }
}
const lock = acquireLock();
try {
type Entry = { nonce: number; raw: Hex; hash: Hex; data?: Hex; to?: Address; value: string; gas: string; gasPrice: string; status: string; blockNumber?: string; gasUsed?: string; contractAddress?: Address };
const journal: { version: number; fingerprint: string; mintPrice: string; owner: Address; service: Address; transactions: Record<string, Entry> } = fs.existsSync(journalPath)
  ? JSON.parse(fs.readFileSync(journalPath, 'utf8')) : { version: 2, fingerprint, mintPrice: mintPrice.toString(), owner, service, transactions: {} };
if (journal.version !== 2 || journal.fingerprint !== fingerprint || journal.mintPrice !== mintPrice.toString() || journal.owner !== owner || journal.service !== service) throw Error('Reconcile the existing deployment journal before changing this candidate.');
const save = () => { const temp = journalPath + '.tmp'; fs.writeFileSync(temp, JSON.stringify(journal)); fs.renameSync(temp, journalPath); };
async function sendOnce(label: string, request: { data?: Hex; to?: Address; value?: bigint }) {
  let entry = journal.transactions[label];
  if (!entry) {
    const [estimate, price, nonce, currentBalance] = await Promise.all([client.estimateGas({ account: owner, ...request }), client.getGasPrice(), client.getTransactionCount({ address: owner, blockTag: 'pending' }), client.getBalance({ address: owner })]);
    const gas = estimate * 125n / 100n + 50000n, fee = price * 2n;
    if (gas * fee + (request.value || 0n) > parseEther('0.02') || currentBalance < gas * fee + (request.value || 0n)) throw Error('The bounded deployment or funding allowance needs another check.');
    const raw = await account.signTransaction({ ...request, value: request.value || 0n, chainId: 46630, nonce, gas, gasPrice: fee, type: 'legacy' });
    entry = { nonce, raw, hash: keccak256(raw), data: request.data, to: request.to, value: (request.value || 0n).toString(), gas: gas.toString(), gasPrice: fee.toString(), status: 'prepared' }; journal.transactions[label] = entry; save();
  }
  if (entry.data !== request.data || entry.to !== request.to || entry.value !== (request.value || 0n).toString() || keccak256(entry.raw) !== entry.hash) throw Error('The saved deployment intent changed.');
  const signed = parseTransaction(entry.raw), sender = await recoverTransactionAddress({ serializedTransaction: entry.raw as Parameters<typeof recoverTransactionAddress>[0]['serializedTransaction'] });
  if (!Number.isSafeInteger(entry.nonce) || entry.nonce < 0 || signed.chainId !== 46630 || signed.nonce !== entry.nonce || sender.toLowerCase() !== owner.toLowerCase()
    || signed.to?.toLowerCase() !== request.to?.toLowerCase() || (signed.data || '0x') !== (request.data || '0x') || (signed.value || 0n) !== BigInt(entry.value)
    || !signed.gas || signed.gas !== BigInt(entry.gas) || signed.gasPrice !== BigInt(entry.gasPrice) || signed.gas * signed.gasPrice + (signed.value || 0n) > parseEther('0.02')) throw Error('The signed deployment journal does not match its authorized intent.');
  let receipt;
  try { receipt = await client.getTransactionReceipt({ hash: entry.hash }); } catch { /* exact signed journal remains authoritative */ }
  if (!receipt) {
    try { await client.sendRawTransaction({ serializedTransaction: entry.raw }); } catch (error) { try { await client.getTransaction({ hash: entry.hash }); } catch { throw error; } }
    entry.status = 'broadcast'; save(); receipt = await client.waitForTransactionReceipt({ hash: entry.hash, confirmations: 1, timeout: 180000 });
  }
  if (receipt.status !== 'success' || (await client.getBlock({ blockNumber: receipt.blockNumber })).hash !== receipt.blockHash) throw Error('The deployment receipt needs another check; retain its journal.');
  if (receipt.from.toLowerCase() !== owner.toLowerCase() || receipt.transactionHash !== entry.hash
    || (!request.to && receipt.contractAddress?.toLowerCase() !== getContractAddress({ from: owner, nonce: BigInt(entry.nonce) }).toLowerCase())
    || (request.to && receipt.to?.toLowerCase() !== request.to.toLowerCase())) throw Error('The confirmed transaction destination changed.');
  Object.assign(entry, { status: 'confirmed', blockNumber: receipt.blockNumber.toString(), gasUsed: receipt.gasUsed.toString(), ...(receipt.contractAddress ? { contractAddress: receipt.contractAddress } : {}) }); save();
  return receipt;
}
async function deploy(name: string, args: unknown[] = []) {
  const artifact = artifacts[name], receipt = await sendOnce(name, { data: encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode, args }) });
  if (!receipt.contractAddress) throw Error('The deployment has no contract address.'); return receipt.contractAddress;
}
if (pauseOriginal) {
  const original = deployments[46630]!.address, abi = parseAbi(['function owner() view returns(address)', 'function admissionPaused() view returns(bool)', 'function setAdmissionPaused(bool value)']);
  const [holder, paused] = await Promise.all([client.readContract({ address: original, abi, functionName: 'owner' }), client.readContract({ address: original, abi, functionName: 'admissionPaused' })]);
  if (holder.toLowerCase() !== owner.toLowerCase()) throw Error('The original collection owner changed.');
  if (journal.transactions.pauseV1 || !paused) await sendOnce('pauseV1', { to: original, data: encodeFunctionData({ abi, functionName: 'setAdmissionPaused', args: [true] }) });
  if (!await client.readContract({ address: original, abi, functionName: 'admissionPaused' })) throw Error('Original admissions did not pause.');
  // The operator must separately recheck the CLOUD holds/jobs/outbox after this
  // fence. Deployments use the owner wallet; paid V2 relay work must wait for drain.
}
const actionModule = await deploy('V2ActionModule');
const verifier = await deploy('V2LifeVerifier', [actionModule]);
const collection = await deploy('NEARlyHumanV2', [verifier, service, service, owner, mintPrice]);
const codeHash = async (address: Address) => { const code = await client.getCode({ address }); if (!code || code === '0x') throw Error('Deployed code is missing.'); return keccak256(code); };
const rulesHash = await client.readContract({ address: collection, abi: artifacts.NEARlyHumanV2.abi, functionName: 'rulesHash' }) as Hex;
const runtime: V2RuntimeIdentity = { chainId: 46630, collection, verifier, actionModule, controllerCodeHash: await codeHash(collection), verifierCodeHash: await codeHash(verifier), actionModuleCodeHash: await codeHash(actionModule), rulesHash, decisionConfig: v2DecisionConfig(rulesHash), relayer: service, quoteSigner: service };
await verifyV2Runtime(client, runtime);
const token = await client.readContract({ address: collection, abi: artifacts.NEARlyHumanV2.abi, functionName: 'token' });
const target = parseEther('0.0025'), currentRelay = await client.getBalance({ address: service });
// A resumed transfer reuses its original exact value, even if the earlier funding mined.
const funding = journal.transactions.relayFunding;
if (funding || currentRelay < target) await sendOnce('relayFunding', { to: service, value: funding ? BigInt(funding.value) : target - currentRelay });
const record = { runtime, token, nativeMintPrice: mintPrice.toString(), artifactFingerprint: fingerprint, compiler: artifacts.NEARlyHumanV2.compiler, checkedAt: new Date().toISOString(), transactions: Object.fromEntries(Object.entries(journal.transactions).map(([label, tx]) => [label, { hash: tx.hash, blockNumber: tx.blockNumber, gasUsed: tx.gasUsed, contractAddress: tx.contractAddress }])) };
const output = path.join(root, 'contracts/v2/deployments'); fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'robinhood-testnet.json'), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ deployed: record, ownerRemaining: formatEther(await client.getBalance({ address: owner })), relayBalance: formatEther(await client.getBalance({ address: service })) }));
} finally {
  fs.closeSync(lock);
  const held = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (held.pid === process.pid && held.fingerprint === fingerprint) fs.unlinkSync(lockPath);
}
