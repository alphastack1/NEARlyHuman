import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { base58 } from '@scure/base';
import { sourceZip } from './export-contracts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** Deliberate publication allowlist. No harness, deployment tool, ledger or key. */
export const V3_CONTRACT_SOURCE_FILES = [
  'contracts/v3/NEARlyHumanV3.sol',
  'contracts/token/NHCTransferBurn.sol',
  'contracts/v2/IV2LifeVerifier.sol',
  'contracts/v2/NEARlyHumanV2.sol',
  'contracts/v2/V2ActionModule.sol',
  'contracts/v2/V2LifeVerifier.sol',
  'contracts/v2/V2Types.sol',
  'contracts/near-v3/src/lib.rs',
  'contracts/near-v3/src/transfer_burn.rs',
  'contracts/near-v3/Cargo.toml',
  'contracts/near-v3/Cargo.lock',
  'contracts/near/src/kernel.rs',
] as const;
export const ORIGINAL_SOURCE_ARCHIVE_SHA256 = '96eb30080976baf50f386e131e338ad69d8575c410210fa55fe2cfeb85e83053';
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const json = async (name: string) => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const bytecodeSha = (hex: string) => sha256(Buffer.from(hex.replace(/^0x/, ''), 'hex'));
const settings = { optimizer: { enabled: true, runs: 1 }, viaIR: true, evmVersion: 'cancun' };

const buildEvm = String.raw`const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), solc = require('solc');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (solc.version() !== manifest.compilation.evm.compiler || require('@openzeppelin/contracts/package.json').version !== '5.6.1') throw Error('Install the pinned compiler and OpenZeppelin versions.');
for (const file of manifest.files) if (sha(fs.readFileSync(file.path)) !== file.sha256) throw Error('Source bytes changed: ' + file.path);
const all = {};
for (const group of manifest.compilation.evm.groups) {
  const sources = Object.fromEntries(group.entries.map(name => [name, { content: fs.readFileSync(name, 'utf8') }]));
  const settings = { ...manifest.compilation.evm.settings, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'evm.deployedBytecode.immutableReferences'] } } };
  const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources, settings }), { import: name => {
    if (!['@openzeppelin/contracts/', 'contracts/v2/', 'contracts/v3/', 'contracts/token/'].some(prefix => name.startsWith(prefix)) || !name.endsWith('.sol') || name.split('/').includes('..')) return { error: 'Unexpected source import' };
    try { const file = name.startsWith('@') ? require.resolve(name, { paths: [process.cwd()] }) : name;
      const bytes = fs.readFileSync(file), expected = manifest.compilation.evm.sourceHashes[name];
      if (!expected || sha(bytes) !== expected) return { error: 'Compiler dependency differs: ' + name };
      return { contents: bytes.toString('utf8') };
    } catch { return { error: 'Install the pinned dependencies first: ' + name }; }
  } }));
  for (const message of output.errors || []) console.log(message.formattedMessage);
  if ((output.errors || []).some(message => message.severity === 'error')) throw Error('Compilation failed.');
  for (const target of group.targets) {
    const artifact = output.contracts[target.source][target.contract];
    if (sha(Buffer.from(artifact.evm.bytecode.object, 'hex')) !== target.creationBytecodeSha256 || sha(Buffer.from(artifact.evm.deployedBytecode.object, 'hex')) !== target.runtimeTemplateSha256) throw Error('Recorded bytecode differs: ' + target.contract);
    all[target.contract] = artifact;
  }
}
fs.mkdirSync('build', { recursive: true }); fs.writeFileSync('build/evm.json', JSON.stringify(all));
console.log(JSON.stringify({ pass: true, compiler: solc.version(), reproduced: Object.keys(all) }));
`;

const readme = `# NEARlyHuman generation 3 contract source

Reviewed contract sources for the current transfer-burn testnet generation. The download includes the Robinhood V3 controller and NHC token, the reused V2 verifier/action module, and the native NEAR V3 contract with its unchanged game kernel. The frozen V2 controller is included to reproduce the original interpreter compilation; it is not the current Robinhood controller.

NHC has six decimals. When enabled, ordinary address transfers burn floor(gross / 200) units (0.5%). The protocol owner can turn this fixed rate on or off. Purse withdrawals debit gross and deliver net. Productive issuance and the direct 250-NHC birth burns are supply operations without an additional transfer fee. Native NEAR transfer-call reserves the prospective fee and refunds unused portions after the receiver resolves.

## Files and verification

manifest.json lists each source's byte size, SHA256, readable URL, compiler settings, dependency hashes, artifact fingerprints and selected public deployment identifiers. Sources retain their original bytes and line endings. This archive excludes application code, wallet material, service records, operator scripts and test-only harnesses.

The native upgrade keeps the same account, NFTs and storage. Robinhood generation 3 is a separate collection; the original collection remains accessible by its original address. No bridge or shared balance is implied. The original source download remains at /source/contracts.zip with SHA256 ${ORIGINAL_SOURCE_ARCHIVE_SHA256}.

## Reproduce EVM bytecode

Use Node 24 or newer. From this extracted directory:

    npm install --ignore-scripts
    node BUILD_EVM.cjs

The dependency manifest pins solc 0.8.38 and OpenZeppelin Contracts 5.6.1. Settings are optimizer enabled, one run, viaIR and Cancun. The helper checks the exact input/dependency hashes and reproduces both creation bytecode and unpatched runtime templates for the V3 controller/token and the reused verifier/module/types. Output goes to build/evm.json. Runtime templates contain immutable placeholders; the onchain code hashes identify the deployed instances. No wallet or blockchain access occurs.

The reviewed V3 artifact was compiled alongside a local test harness. Its fingerprint retains that fixture input's hash as provenance, but the harness is not a production dependency or archive entry. The helper independently verifies that this public source set reproduces the release contracts' exact bytecode.

## Reproduce native NEAR Wasm

Install Rust 1.95.0 with rust-src and wasm32-unknown-unknown, then run from this directory (POSIX shell):

    rustup toolchain install 1.95.0 --component rust-src --target wasm32-unknown-unknown
    RUSTC_BOOTSTRAP=1 RUSTFLAGS="--cfg near" cargo +1.95.0 build --locked --manifest-path contracts/near-v3/Cargo.toml --target wasm32-unknown-unknown -Z build-std=std,panic_abort --release

The Cargo manifest pins near-sdk and near-contract-standards 5.30.0 and hex 0.4.3; Cargo.lock pins transitive dependencies. The release profile uses one codegen unit, opt-level z, LTO, panic abort, overflow checks and stripped symbols. Compare target/wasm32-unknown-unknown/release/nearlyhuman_near_v3.wasm with manifest.json's SHA256 and byte size. The unchanged kernel remains at contracts/near/src/kernel.rs so the original relative module path works. Test harnesses are excluded; cargo test is not an archive command.

## Public reference records

Collection/account addresses, code hashes and deployment transactions in manifest.json come from the checked-in confirmed testnet records. Exporting verifies source/artifact fingerprints offline; it does not make a new RPC observation or constitute a security audit. The game uses a trusted AI relay, with legal state changes and economic outcomes checked by the contracts.
`;

export async function exportV3Contracts(outputRoot = path.resolve(root, 'dist')) {
  const destination = path.join(outputRoot, 'source', 'v3'), legacyPath = path.join(outputRoot, 'source', 'contracts.zip');
  const legacyBefore = await readFile(legacyPath);
  if (sha256(legacyBefore) !== ORIGINAL_SOURCE_ARCHIVE_SHA256) throw Error('The original source archive changed; preserve its published identity.');
  const records = await Promise.all(V3_CONTRACT_SOURCE_FILES.map(async name => {
    const bytes = await readFile(path.join(root, name));
    return { name, bytes, sha256: sha256(bytes) };
  }));
  const rh = await json('contracts/v3/deployments/robinhood-testnet.json');
  const near = await json('contracts/near-v3/deployments/testnet.json');
  const native = await json('contracts/near-v3/artifacts/build.json');
  const wasm = await readFile(path.join(root, 'contracts/near-v3/artifacts/nearlyhuman_near_v3.wasm'));
  if (near.version !== 3 || near.upgradeStateProof?.preserved !== true || sha256(wasm) !== native.sha256 || wasm.length !== native.bytes || near.artifact.sha256 !== native.sha256 || near.artifact.bytes !== native.bytes || near.runtime.codeHash !== base58.encode(Buffer.from(native.sha256, 'hex'))) throw Error('Native V3 artifact and confirmed deployment fingerprints differ.');
  for (const [relative, expected] of Object.entries(native.sources)) {
    const name = path.posix.normalize('contracts/near-v3/' + relative), actual = records.find(file => file.name === name);
    if (!actual || actual.sha256 !== expected) throw Error('Native V3 source differs from its reviewed Wasm: ' + name);
  }

  const artifacts = await Promise.all([
    ['contracts/v3/artifacts/NEARlyHumanV3.json', 'contracts/v3/NEARlyHumanV3.sol'],
    ['contracts/v3/artifacts/NHCTransferBurn.json', 'contracts/token/NHCTransferBurn.sol'],
    ['contracts/v2/artifacts/V2LifeVerifier.json', 'contracts/v2/V2LifeVerifier.sol'],
    ['contracts/v2/artifacts/V2ActionModule.json', 'contracts/v2/V2ActionModule.sol'],
    ['contracts/v2/artifacts/V2Types.json', 'contracts/v2/V2Types.sol'],
  ].map(async ([file, source]) => ({ ...(await json(file!)), source })));
  const current = artifacts[0]!;
  const fingerprint = createHash('sha256').update(JSON.stringify({ abi: current.abi, bytecode: current.bytecode, compiler: current.compiler, sources: current.sources })).digest('hex');
  if (fingerprint !== rh.artifactFingerprint || rh.compiler !== current.compiler) throw Error('Robinhood V3 deployment identifies a different artifact.');
  const sourceHashes: Record<string, string> = {};
  const fixtureInputs: { path: string; sha256: string; published: false; productionDependency: false }[] = [];
  for (const [name, expected] of Object.entries(current.sources as Record<string, string>)) {
    const fixture = name === 'contracts/v3/test/TransferBurnGameHarness.sol', dependency = /^@openzeppelin\/contracts\/[A-Za-z\d_./-]+\.sol$/.test(name) && !name.split('/').includes('..');
    if (!fixture && !dependency && !records.some(record => record.name === name)) throw Error('Unexpected V3 compiler source outside publication allowlist: ' + name);
    const file = path.join(root, name.startsWith('@openzeppelin/contracts/') ? 'node_modules' : '', name);
    if (sha256(await readFile(file)) !== expected) throw Error('Robinhood V3 compiler source changed: ' + name);
    if (fixture) fixtureInputs.push({ path: name, sha256: expected, published: false, productionDependency: false });
    else sourceHashes[name] = expected;
  }
  // Reused interpreter inputs are the unchanged public V2 source snapshot.
  for (const file of records.filter(file => file.name.endsWith('.sol'))) sourceHashes[file.name] = file.sha256;
  const target = (a: typeof current) => ({ source: a.source, contract: a.contractName, creationBytecodeSha256: bytecodeSha(a.bytecode), runtimeTemplateSha256: bytecodeSha(a.deployedBytecode) });
  const manifest = {
    schemaVersion: 1, project: 'NEARlyHuman', generation: 3, protocolVersion: 2, scope: 'contracts-only', fullRepositoryIncluded: false,
    download: '/source/v3/contracts.zip', originalDownload: { href: '/source/contracts.zip', sha256: ORIGINAL_SOURCE_ARCHIVE_SHA256 },
    files: records.map(({ name, bytes, sha256 }) => ({ path: name, bytes: bytes.length, sha256, textUrl: `/source/v3/files/${name}.txt` })),
    compilation: {
      evm: { compiler: rh.compiler, dependencies: { solc: '0.8.38', '@openzeppelin/contracts': '5.6.1' }, settings, sourceHashes,
        groups: [
          { entries: ['contracts/v3/NEARlyHumanV3.sol', 'contracts/token/NHCTransferBurn.sol'], targets: artifacts.slice(0, 2).map(target) },
          { entries: V3_CONTRACT_SOURCE_FILES.filter(name => name.startsWith('contracts/v2/')), targets: artifacts.slice(2).map(target) },
        ], reviewedArtifactFingerprint: fingerprint, excludedFixtureInputs: fixtureInputs },
      near: { rust: native.rust, nearSdk: native.nearSdk, nearContractStandards: '5.30.0', target: native.target, rustFlags: native.rustFlags,
        buildStd: ['std', 'panic_abort'], profile: { codegenUnits: 1, optLevel: 'z', lto: true, panic: 'abort', overflowChecks: true, strip: 'symbols' },
        wasmSha256: native.sha256, wasmBytes: native.bytes, sourceHashes: native.sources, storageLayout: native.layout },
    },
    transferBurn: { bps: 50, initiallyEnabled: true, ownerToggle: true, appliesTo: 'ordinary address-to-address transfers, including gross purse withdrawals', supplyOperationsExempt: ['productive issuance', 'direct wallet-funded 250-NHC birth burn', 'direct purse-funded 250-NHC birth burn'] },
    referenceDeployments: {
      robinhood: { network: 'testnet', chainId: rh.runtime.chainId, collection: rh.runtime.collection, token: rh.token, controllerCodeHash: rh.runtime.controllerCodeHash, tokenCodeHash: rh.tokenCodeHash,
        verifier: rh.runtime.verifier, verifierCodeHash: rh.runtime.verifierCodeHash, actionModule: rh.runtime.actionModule, actionModuleCodeHash: rh.runtime.actionModuleCodeHash,
        deploymentTransaction: rh.transactions.NEARlyHumanV3.hash, explorer: `https://explorer.testnet.chain.robinhood.com/address/${rh.runtime.collection}`, previousCollection: rh.previousDeployment.collection },
      near: { network: 'testnet', collection: near.runtime.collection, codeHash: near.runtime.codeHash, deploymentTransaction: near.deploymentTransaction,
        previousDeployment: near.previousDeployment, storagePreserved: near.upgradeStateProof?.preserved === true, explorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}` },
    },
    note: 'Public identifiers are selected from confirmed checked-in testnet records. This export performs offline source/artifact checks, not a fresh live-network observation.',
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  const entries = [...records.map(({ name, bytes }) => ({ name, bytes })),
    { name: 'manifest.json', bytes: manifestBytes }, { name: 'README.md', bytes: Buffer.from(readme) },
    { name: 'BUILD_EVM.cjs', bytes: Buffer.from(buildEvm) },
    { name: 'package.json', bytes: Buffer.from(JSON.stringify({ name: 'nearlyhuman-v3-contract-source', private: true, version: '3.0.0', engines: { node: '>=24' }, dependencies: { solc: '0.8.38', '@openzeppelin/contracts': '5.6.1' } }, null, 2) + '\n') },
  ];
  const zip = sourceZip(entries);
  await mkdir(destination, { recursive: true });
  for (const file of records) {
    const output = path.join(destination, 'files', file.name + '.txt');
    await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, file.bytes);
  }
  await writeFile(path.join(destination, 'manifest.json'), manifestBytes);
  await writeFile(path.join(destination, 'README.txt'), readme);
  await writeFile(path.join(destination, 'contracts.zip'), zip);
  if (!(await readFile(legacyPath)).equals(legacyBefore)) throw Error('Original source archive was altered.');
  return { pass: true, sourceFiles: records.length, archiveEntries: entries.length, archiveBytes: zip.length, archiveSha256: sha256(zip),
    originalArchiveSha256: sha256(legacyBefore), originalArchiveUnchanged: true, nativeSourceHashesMatch: true, evmSourceHashesMatch: true, deploymentFingerprintsMatch: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = process.argv.indexOf('--out-dir'), output = option < 0 ? undefined : process.argv[option + 1];
  if (option >= 0 && !output) throw Error('Provide an output directory after --out-dir.');
  console.log(JSON.stringify(await exportV3Contracts(output ? path.resolve(output) : undefined)));
}
