import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { readSourceArchive, sha256 } = createRequire(import.meta.url)('../lib/source-archive.cjs') as { readSourceArchive(bytes: Buffer, hash: string): Map<string, Buffer>; sha256(bytes: Uint8Array): string };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Preserve deployed-source downloads while publishing clean current aliases. */
export async function exportContracts(output = path.join(root, 'dist/source')) {
  const release = JSON.parse(await readFile(path.join(root, 'contracts/release-files.json'), 'utf8'));
  await mkdir(output, { recursive: true }); const archives = [];
  let current: Map<string, Buffer> | undefined, currentHash = '';
  for (const archive of release.archives) {
    const bytes = await readFile(path.join(root, archive.file)), entries = readSourceArchive(bytes, archive.sha256);
    const manifestBytes = entries.get('manifest.json'); if (!manifestBytes) throw Error('Missing deployed source manifest.');
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const target = archive.publicBase === '/source' ? output : path.join(output, archive.publicBase.slice('/source/'.length));
    await mkdir(target, { recursive: true }); await writeFile(path.join(target, 'contracts.zip'), bytes); await writeFile(path.join(target, 'manifest.json'), manifestBytes);
    if (entries.get('README.md')) await writeFile(path.join(target, 'README.txt'), entries.get('README.md')!);
    for (const file of manifest.files) {
      const source = entries.get(file.path); if (!source || sha256(source) !== file.sha256) throw Error('Deployed source differs from its manifest.');
      const destination = path.join(target, 'files', file.path + '.txt'); await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, source);
    }
    archives.push({ download: archive.download, bytes: bytes.length, sha256: archive.sha256 });
    if (archive.file.includes('transfer-burn')) { current = entries; currentHash = archive.sha256; await writeFile(path.join(output, 'nearlyhuman-contracts.zip'), bytes); }
  }
  if (!current) throw Error('Current deployed sources missing.');
  const files = [];
  for (const [compilerUnit, file] of Object.entries(release.evm.units) as [string, string][]) {
    if (file.includes('/test/')) continue;
    const bytes = await readFile(path.join(root, file));
    if (!current.get(compilerUnit)?.equals(bytes) || sha256(bytes) !== release.evm.sourceHashes[file]) throw Error('Current deployed EVM source changed: ' + file);
    const textUrl = file.startsWith('contracts/evm/') ? '/source/evm/' + file.slice('contracts/evm/'.length) + '.txt' : '/source/token/NHCTransferBurn.sol.txt';
    const destination = path.join(output, textUrl.slice('/source/'.length)); await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, bytes);
    files.push({ path: file, compilerUnit, sha256: sha256(bytes), textUrl });
  }
  const nativeUnits = { 'contracts/near/src/lib.rs': 'contracts/near-v3/src/lib.rs', 'contracts/near/src/transfer_burn.rs': 'contracts/near-v3/src/transfer_burn.rs', 'contracts/near/src/kernel.rs': 'contracts/near/src/kernel.rs', 'contracts/near/Cargo.toml': 'contracts/near-v3/Cargo.toml', 'contracts/near/Cargo.lock': 'contracts/near-v3/Cargo.lock' };
  for (const [file, compilerUnit] of Object.entries(nativeUnits)) {
    const bytes = await readFile(path.join(root, file)); if (!current.get(compilerUnit)?.equals(bytes)) throw Error('Current deployed native source changed: ' + file);
    const textUrl = '/source/near/' + file.replace('contracts/near/', '').replace(/^src\//, '') + '.txt';
    const destination = path.join(output, textUrl.slice('/source/'.length)); await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, bytes);
    files.push({ path: file, compilerUnit, sha256: sha256(bytes), textUrl });
  }
  const nativeBuild = JSON.parse(await readFile(path.join(root, release.near.build), 'utf8'));
  if (sha256(await readFile(path.join(root, release.near.artifact))) !== nativeBuild.sha256) throw Error('Deployed native Wasm changed.');
  const manifest = { schemaVersion: 1, project: 'NEARlyHuman', scope: 'contracts-only', download: '/source/nearlyhuman-contracts.zip', sha256: currentHash, files,
    compilation: { evm: { compiler: release.evm.compiler, openZeppelin: release.evm.openZeppelin, settings: release.evm.settings }, near: { rust: nativeBuild.rust, nearSdk: nativeBuild.nearSdk, wasmSha256: nativeBuild.sha256 } },
    note: 'Compiler source-unit identifiers are preserved to reproduce deployed bytecode; maintained repository paths are listed separately.', historicalArchives: archives };
  await writeFile(path.join(output, 'nearlyhuman-contracts.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { pass: true, currentSourceFiles: files.length, currentArchiveSha256: currentHash, historicalArchivesUnchanged: archives };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await exportContracts()));
