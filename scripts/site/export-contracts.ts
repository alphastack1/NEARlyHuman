import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** Publication is intentionally opt-in by exact file, never a directory glob. */
export const CONTRACT_SOURCE_FILES = [
  'contracts/v2/IV2LifeVerifier.sol',
  'contracts/v2/NEARlyHumanV2.sol',
  'contracts/v2/V2ActionModule.sol',
  'contracts/v2/V2LifeVerifier.sol',
  'contracts/v2/V2Types.sol',
  'contracts/near/src/lib.rs',
  'contracts/near/src/kernel.rs',
  'contracts/near/Cargo.toml',
  'contracts/near/Cargo.lock',
] as const;

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, i) => {
  let value = i;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 255]! ^ value >>> 8;
  return (value ^ 0xffffffff) >>> 0;
}

/** Small deterministic ZIP/STORE writer; no build-time archive dependency. */
export function sourceZip(entries: readonly { name: string; bytes: Buffer }[]): Buffer {
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  const names = new Set<string>();
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9_.\-/]+$/.test(entry.name) || entry.name.startsWith('/') || entry.name.split('/').includes('..') || names.has(entry.name)) throw Error('Unsafe or duplicate source archive path.');
    names.add(entry.name);
    const name = Buffer.from(entry.name, 'utf8'), crc = crc32(entry.bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x21, 12);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(entry.bytes.length, 18); header.writeUInt32LE(entry.bytes.length, 22); header.writeUInt16LE(name.length, 26);
    local.push(header, name, entry.bytes);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x21, 14);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(entry.bytes.length, 20); directory.writeUInt32LE(entry.bytes.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, name); offset += header.length + name.length + entry.bytes.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const buildEvm = `const fs = require('node:fs'), path = require('node:path'), solc = require('solc');
if (!solc.version().startsWith('0.8.38+') || require('@openzeppelin/contracts/package.json').version !== '5.6.1') throw Error('Install the pinned compiler and OpenZeppelin versions from package.json.');
const files = ['IV2LifeVerifier.sol','NEARlyHumanV2.sol','V2ActionModule.sol','V2LifeVerifier.sol','V2Types.sol'];
const sources = Object.fromEntries(files.map(name => ['contracts/v2/' + name, { content: fs.readFileSync('contracts/v2/' + name, 'utf8') }]));
const settings = { optimizer: { enabled: true, runs: 1 }, viaIR: true, evmVersion: 'cancun', outputSelection: { '*': { '*': ['abi','evm.bytecode.object','evm.deployedBytecode.object'] } } };
const output = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings}), { import: name => {
  if (!name.startsWith('@openzeppelin/contracts/') || !name.endsWith('.sol') || name.split('/').includes('..')) return { error: 'Unexpected source import' };
  try { return { contents: fs.readFileSync(require.resolve(name, {paths:[process.cwd()]}), 'utf8') }; } catch { return { error: 'Install the pinned dependencies first' }; }
} }));
for (const message of output.errors || []) console.log(message.formattedMessage);
if ((output.errors || []).some(message => message.severity === 'error')) process.exitCode = 1;
else { fs.mkdirSync('build', {recursive:true}); fs.writeFileSync('build/evm.json', JSON.stringify(output)); console.log('Compiled ' + solc.version()); }
`;

const readme = `# NEARlyHuman smart-contract source

This download contains only the game's reviewed contract source snapshot, public compiler settings and deployment identifiers. It does not contain the full application repository, operator scripts, credentials, wallet material, service records or Git history. Source publication is not a security audit or a promise of trustless AI.

## Contents

- Five Solidity source files in contracts/v2. The NFT controller also defines the six-decimal NHC token.
- Native NEAR production contract and deterministic kernel in contracts/near/src, plus its pinned Cargo manifest and lockfile.
- manifest.json: exact source byte sizes and SHA256 values, compiler configuration and reference testnet identifiers. Files are copied byte-for-byte, retaining original line endings.

Both networks are testnets. Lives, inventory and token balances remain separate; there is no bridge. The contract verifies legal state and rewards while a trusted relay calls Jev and supplies delegated decisions.

## Build Robinhood/EVM contracts

Use Node24 or newer. From this extracted directory run:

    npm install
    node BUILD_EVM.cjs

The package manifest pins solc0.8.38 and OpenZeppelin Contracts5.6.1. The build uses optimizer1, via-IR and Cancun, preserving the repository's source paths. Generated compiler output is written to build/evm.json. The compiler command never deploys, requests wallet access or calls a blockchain. Dependency installation fetches pinned public packages; OpenZeppelin retains its upstream license.

## Build the native NEAR contract

The reference artifact used Rust1.95.0, near-sdk5.30.0, the wasm32-unknown-unknown target, cfg near and the release profile in Cargo.toml. With that Rust toolchain and rust-src installed, the repository's reference build is:

    RUSTC_BOOTSTRAP=1 RUSTFLAGS="--cfg near" cargo +1.95.0 build --locked --manifest-path contracts/near/Cargo.toml --target wasm32-unknown-unknown -Z build-std=std,panic_abort --release

The production source is included. The separate test harness is not part of this contracts-only archive, so cargo test is not an advertised archive command. Testnet source/code hashes in manifest.json are reference records from the project, not fresh RPC observations made by this export.

## Inspect the deployed worlds

Use the collection and explorer links in manifest.json or the website's Contracts & official links guide. Current payment amounts and network fees are shown in the app before signing. Do not send mainnet funds to a testnet address.
`;

export async function exportContracts(outputRoot = path.resolve(root, 'dist')) {
  const destination = path.join(outputRoot, 'source');
  const records = await Promise.all(CONTRACT_SOURCE_FILES.map(async name => {
    const bytes = await readFile(path.join(root, name));
    return { name, bytes, sha256: sha256(bytes) };
  }));
  const robinhood = JSON.parse(await readFile(path.join(root, 'contracts/v2/deployments/robinhood-testnet.json'), 'utf8'));
  const near = JSON.parse(await readFile(path.join(root, 'contracts/near/deployments/testnet.json'), 'utf8'));
  const nativeBuild = JSON.parse(await readFile(path.join(root, 'contracts/near/artifacts/build.json'), 'utf8'));
  for (const [name, expected] of Object.entries(nativeBuild.sources)) {
    const actual = records.find(file => file.name === `contracts/near/${name}`);
    if (!actual || actual.sha256 !== expected) throw Error(`Native source differs from the recorded artifact: ${name}`);
  }
  const manifest = {
    schemaVersion: 1, project: 'NEARlyHuman', scope: 'contracts-only', fullRepositoryIncluded: false,
    download: '/source/contracts.zip',
    files: records.map(({ name, bytes, sha256 }) => ({ path: name, bytes: bytes.length, sha256, textUrl: `/source/files/${name}.txt` })),
    compilation: {
      evm: { compiler: robinhood.compiler, openZeppelin: '5.6.1', optimizer: { enabled: true, runs: 1 }, viaIR: true, evmVersion: 'cancun' },
      near: { rust: nativeBuild.rust, nearSdk: nativeBuild.nearSdk, target: nativeBuild.target, rustFlags: nativeBuild.rustFlags, profile: nativeBuild.profile, wasmSha256: nativeBuild.sha256 },
    },
    referenceDeployments: {
      robinhood: { network: 'testnet', chainId: robinhood.runtime.chainId, collection: robinhood.runtime.collection, token: robinhood.token, controllerCodeHash: robinhood.runtime.controllerCodeHash, verifierCodeHash: robinhood.runtime.verifierCodeHash, actionModuleCodeHash: robinhood.runtime.actionModuleCodeHash, explorer: `https://explorer.testnet.chain.robinhood.com/address/${robinhood.runtime.collection}` },
      near: { network: 'testnet', collection: near.runtime.collection, codeHash: near.runtime.codeHash, explorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}` },
    },
    note: 'Deployment identifiers are taken from checked-in public reference records; this export makes no live network call.',
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  const entries = [...records.map(({ name, bytes }) => ({ name, bytes })),
    { name: 'manifest.json', bytes: manifestBytes }, { name: 'README.md', bytes: Buffer.from(readme) },
    { name: 'BUILD_EVM.cjs', bytes: Buffer.from(buildEvm) },
    { name: 'package.json', bytes: Buffer.from(JSON.stringify({ name: 'nearlyhuman-contract-source', private: true, version: '1.0.0', engines: { node: '>=24' }, dependencies: { solc: '0.8.38', '@openzeppelin/contracts': '5.6.1' } }, null, 2) + '\n') },
  ];
  const zip = sourceZip(entries);
  await mkdir(destination, { recursive: true });
  for (const file of records) {
    const target = path.join(destination, 'files', file.name + '.txt');
    await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, file.bytes);
  }
  await writeFile(path.join(destination, 'manifest.json'), manifestBytes);
  await writeFile(path.join(destination, 'README.txt'), readme);
  await writeFile(path.join(destination, 'contracts.zip'), zip);
  return { pass: true, sourceFiles: records.length, archiveEntries: entries.length, archiveBytes: zip.length, archiveSha256: sha256(zip), nativeSourceHashesMatch: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = process.argv.indexOf('--out-dir');
  const output = option < 0 ? undefined : process.argv[option + 1];
  if (option >= 0 && !output) throw Error('Provide an output directory after --out-dir.');
  console.log(JSON.stringify(await exportContracts(output ? path.resolve(output) : undefined)));
}
