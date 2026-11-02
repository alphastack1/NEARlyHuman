import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import { keccak256, parseAbi, toHex } from 'viem';
import { v2PublicClient, verifyV2Runtime } from '../../server/v2/context';
import { v2DecisionConfig } from '../../server/v2/preparation';
import { storage } from '../../server/storage';
import { isHosted } from '../../server/config';
import { V2_STORE_CUTOVER_KEY } from '../../server/v2/budget';
import { encodeState, encodeTrace } from '../../src/v2';
import { deployments } from '../../src/chain/deployments';

// Public configuration only. Existing private keys and other contexts are untouched.
if (isHosted()) throw Error('Run this release operator on the private workstation.');
const apply = process.argv.includes('--apply'), id = process.argv.find(v => v.startsWith('--guest='))?.slice(8), dayText = process.argv.find(v => v.startsWith('--day='))?.slice(6);
const releaseCheck = apply || process.argv.includes('--check-release');
if (!id || !/^[1-9]\d{0,77}$/.test(id) || !dayText || !/^[1-9]\d{0,9}$/.test(dayText) || Number(dayText) > 0xffffffff) throw Error('Specify the exact saved --guest=NFT_ID and --day=DAY.');
const siteId = '15eabb4e-7828-4019-a628-2da95c19d2bd', accountSlug = 'metamellow-apps', storeName = 'nearlyhuman-v1';
const campaignId = 'nearlyhuman-v2-testnet-20261102', rpc = 'https://rpc.testnet.chain.robinhood.com';
const record = JSON.parse(await fs.readFile(new URL('../../contracts/v2/deployments/robinhood-testnet.json', import.meta.url), 'utf8'));
const runtime = record.runtime;
if (runtime.chainId !== 46630 || runtime.decisionConfig !== v2DecisionConfig(runtime.rulesHash)) throw Error('The final runtime or decision policy changed.');
const client = v2PublicClient(rpc, runtime), block = await verifyV2Runtime(client, runtime);
const abi = parseAbi(['function dayRecord(uint256 id,uint32 day) view returns((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))']);
const saved = await client.readContract({ address: runtime.collection, abi, functionName: 'dayRecord', args: [BigInt(id), Number(dayText)], blockNumber: block.number! });
if (saved.requestId === '0x' + '0'.repeat(64) || (await client.getBlock({ blockNumber: block.number! })).hash !== block.hash) throw Error('The guest is not an actual saved day on this collection.');
const cfgPath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming'), 'netlify/Config/config.json');
let token = process.env.NETLIFY_AUTH_TOKEN;
if (!token) { const c = JSON.parse(await fs.readFile(cfgPath, 'utf8')); token = c.users?.[c.userId]?.auth?.token; }
if (!token) throw Error('The existing Netlify CLI account is unavailable.');
const request = async (url: string, method = 'GET', body?: unknown) => {
  const response = await fetch('https://api.netlify.com/api/v1' + url, { method, headers: { Authorization: 'Bearer ' + token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error(`Netlify ${method} failed with status ${response.status}.`);
  return response.status === 204 ? undefined : response.json();
};
const site = await request('/sites/' + siteId);
if (site.id !== siteId || site.name !== 'nearlyhuman' || site.ssl_url !== 'https://nearlyhuman.netlify.app') throw Error('Wrong Netlify site.');
const cloud = getStore({ name: storeName, siteID: siteId, token, consistency: 'strong' });
const dataDir = process.env.NEARLYHUMAN_DATA_DIR || path.join(os.homedir(), '.codex/data/nearlyhuman');
if (releaseCheck) {
  const completed = JSON.parse(await fs.readFile(path.join(dataDir, 'ops/v2-netlify-import-result.json'), 'utf8'));
  const seal = (await storage().get<Record<string, unknown>>(V2_STORE_CUTOVER_KEY))?.value;
  if (!completed.complete || completed.siteId !== siteId || completed.store !== storeName || seal?.phase !== 'complete' || seal.siteId !== siteId || seal.manifestHash !== completed.manifestHash) throw Error('Complete and verify the sealed cloud data cutover before changing release settings.');
  if (await cloud.get(V2_STORE_CUTOVER_KEY, { type: 'json', consistency: 'strong' })) throw Error('The hosted worker store must remain open.');
}
const packetKey = `v2/packets/${saved.replayCommitment}`;
const packet: any = releaseCheck ? await cloud.get(packetKey, { type: 'json', consistency: 'strong' }) : (await storage().get(packetKey))?.value;
if (!packet || keccak256(toHex(JSON.stringify(packet))) !== saved.replayCommitment || packet.requestId !== saved.requestId || packet.decisionConfig !== runtime.decisionConfig
  || packet.result.state.day !== Number(dayText) || packet.stateHash !== saved.stateHash || keccak256(packet.state) !== saved.stateHash
  || encodeState(packet.result.state) !== packet.state || encodeTrace(packet.result.trace) !== packet.trace || keccak256(packet.trace) !== saved.traceHash
  || keccak256(packet.certificate) !== saved.certificateHash || packet.rewardMicro !== saved.reward.toString()
  || !packet.decisions.some((d: any) => d.source === 'provider' && /^typesafe\/jev-1\.13(?:-\d{8})?$/.test(d.model || ''))) throw Error('The exact final-policy Jev guest film did not verify.');
const jobKey = `v2/jobs/46630/${runtime.collection.toLowerCase()}/${saved.requestId.toLowerCase()}`;
const job: any = releaseCheck ? await cloud.get(jobKey, { type: 'json', consistency: 'strong' }) : (await storage().get(jobKey))?.value;
if (!job || job.phase !== 'ready' || job.campaignId !== campaignId || job.commitment !== saved.replayCommitment || job.input.tokenId !== id) throw Error('The guest worker record does not match the saved film.');
const plan = [
  { key: 'VITE_NEARLYHUMAN_V2', scopes: ['builds'], value: '1' },
  { key: 'NEARLYHUMAN_V2_RUNTIME_JSON', scopes: ['functions'], value: JSON.stringify(runtime) },
  { key: 'NEARLYHUMAN_V2_RPC_URL', scopes: ['functions'], value: rpc },
  { key: 'NEARLYHUMAN_V2_CAMPAIGN', scopes: ['functions'], value: campaignId },
  { key: 'NEARLYHUMAN_V2_GUEST_ID', scopes: ['functions'], value: id },
  { key: 'NEARLYHUMAN_V2_GUEST_DAY', scopes: ['functions'], value: dayText },
];
const base = `/accounts/${accountSlug}/env`, suffix = `?site_id=${siteId}`;
const existing: any[] = await request(base + suffix);
const changes = plan.map(p => {
  const found = existing.find(v => v.key === p.key), production = found?.values?.find((v: any) => v.context === 'production');
  if (found && !p.scopes.every(s => found.scopes?.includes(s))) throw Error(`Inspect the existing scopes of ${p.key} before changing it.`);
  return { ...p, exists: !!found, changed: production?.value !== p.value };
});
let legacyFence: { observedBlock: string; admissionPaused: boolean; activeHolds: number; relayPending: boolean } | undefined;
if (releaseCheck) {
  // The older deployed quote handler can reserve an unused hold even while its
  // contract is paused. A prior import audit cannot stand in for this fresh check.
  const head = await verifyV2Runtime(client, runtime), legacyAbi = parseAbi(['function admissionPaused() view returns(bool)']);
  const [paused, legacy, relay] = await Promise.all([
    client.readContract({ address: deployments[46630]!.address, abi: legacyAbi, functionName: 'admissionPaused', blockNumber: head.number! }),
    cloud.get('control/admission-v1', { type: 'json', consistency: 'strong' }),
    cloud.get(`control/relay-46630-${runtime.relayer.toLowerCase()}`, { type: 'json', consistency: 'strong' }),
  ]);
  const ledger = legacy as { holds?: Record<string, { status: string }> } | null, outbox = relay as { pending?: unknown; lease?: { until: number } } | null;
  const activeHolds = Object.values(ledger?.holds || {}).filter(h => h.status === 'held' || h.status === 'accepted').length;
  if (!paused || activeHolds || outbox?.pending || outbox?.lease && outbox.lease.until > Date.now() || (await client.getBlock({ blockNumber: head.number! })).hash !== head.hash) throw Error('Repeat the original collection pause/cloud drain check before release. Preserve all existing records.');
  legacyFence = { observedBlock: head.number!.toString(), admissionPaused: paused, activeHolds, relayPending: !!outbox?.pending };
}
if (releaseCheck && !apply && changes.some(p => p.changed)) throw Error('Apply and verify the reviewed public release settings before publishing.');
if (apply) for (const p of changes) {
  if (!p.changed) continue;
  if (p.exists) await request(base + '/' + p.key + suffix, 'PATCH', { context: 'production', value: p.value });
  else await request(base + suffix, 'POST', [{ key: p.key, scopes: p.scopes, values: [{ context: 'production', value: p.value }] }]);
}
if (apply) {
  const checked: any[] = await request(base + suffix);
  for (const p of plan) {
    const actual = checked.find(v => v.key === p.key);
    if (!actual || !p.scopes.every(s => actual.scopes?.includes(s)) || actual.values?.find((v: any) => v.context === 'production')?.value !== p.value) throw Error('A release setting needs another check.');
  }
}
const report = { mode: apply ? 'apply' : releaseCheck ? 'check-release' : 'dry-run', siteId, chainId: 46630, collection: runtime.collection, guest: { id, day: Number(dayText), commitment: saved.replayCommitment }, checkedAt: new Date().toISOString(), keys: changes.map(p => ({ key: p.key, scopes: p.scopes, changed: p.changed })), ...(legacyFence ? { legacyFence } : {}), environmentWrites: apply ? changes.filter(p => p.changed).length : 0, deployments: 0, secretsChanged: 0 };
await fs.mkdir(path.join(dataDir, 'ops'), { recursive: true }); await fs.writeFile(path.join(dataDir, 'ops/v2-netlify-env-' + report.mode + '.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
