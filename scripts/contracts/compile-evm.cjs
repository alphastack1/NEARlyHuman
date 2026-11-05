const fs = require('node:fs'), path = require('node:path'), solc = require('solc');
const { readSourceArchive } = require('../lib/source-archive.cjs');
const root = path.resolve(__dirname, '../..'), release = JSON.parse(fs.readFileSync(path.join(root, 'contracts/release-files.json'))), cfg = release.evm;
if (solc.version() !== cfg.compiler || require('@openzeppelin/contracts/package.json').version !== cfg.openZeppelin) throw Error('Use the pinned compiler dependencies.');
const old = release.archives[0], frozen = readSourceArchive(fs.readFileSync(path.join(root, old.file)), old.sha256);
function source(name) {
  if (cfg.units[name]) return fs.readFileSync(path.join(root, cfg.units[name]), 'utf8');
  if (name.startsWith('@openzeppelin/contracts/') && !name.split('/').includes('..')) return fs.readFileSync(path.join(root, 'node_modules', name), 'utf8');
  if (frozen.has(name)) return frozen.get(name).toString('utf8');
  throw Error('Unexpected compiler unit: ' + name);
}
const reports = [], groups = [
  [cfg.gameEntries, [['contracts/v3/NEARlyHumanV3.sol', 'NEARlyHumanV3', cfg.artifacts.game], ['contracts/token/NHCTransferBurn.sol', 'NHCTransferBurn', cfg.artifacts.token]]],
  [[...cfg.ruleEntries, 'contracts/v2/NEARlyHumanV2.sol'], [['contracts/v2/V2LifeVerifier.sol', 'V2LifeVerifier', cfg.artifacts.verifier], ['contracts/v2/V2ActionModule.sol', 'V2ActionModule', cfg.artifacts.actionModule]]],
];
for (const [entries, targets] of groups) {
  const sources = Object.fromEntries(entries.map(name => [name, { content: source(name) }]));
  const result = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources, settings: { ...cfg.settings, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } } }), { import(name) { try { return { contents: source(name) }; } catch (e) { return { error: e.message }; } } }));
  const errors = (result.errors || []).filter(e => e.severity === 'error'); if (errors.length) throw Error(errors.map(e => e.formattedMessage).join('\n'));
  for (const [unit, name, artifactPath] of targets) {
    const actual = result.contracts[unit][name], expected = JSON.parse(fs.readFileSync(path.join(root, artifactPath)));
    if ('0x' + actual.evm.bytecode.object !== expected.bytecode || '0x' + actual.evm.deployedBytecode.object !== expected.deployedBytecode) throw Error('Compiled release differs from deployed artifact: ' + name);
    reports.push({ contract: name, exactCreationAndRuntime: true, runtimeBytes: actual.evm.deployedBytecode.object.length / 2 });
  }
}
console.log(JSON.stringify({ pass: true, compiler: solc.version(), contracts: reports }));
