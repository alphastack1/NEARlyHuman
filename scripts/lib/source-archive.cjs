const crypto = require('node:crypto');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
/** Read the deterministic, uncompressed source ZIPs used for deployed releases. */
function readSourceArchive(bytes, expectedHash) {
  if (expectedHash && sha256(bytes) !== expectedHash) throw Error('Published source archive fingerprint changed.');
  const entries = new Map(); let at = 0;
  while (at + 30 <= bytes.length && bytes.readUInt32LE(at) === 0x04034b50) {
    const method = bytes.readUInt16LE(at + 8), compressed = bytes.readUInt32LE(at + 18), size = bytes.readUInt32LE(at + 22), nameLength = bytes.readUInt16LE(at + 26), extraLength = bytes.readUInt16LE(at + 28);
    const start = at + 30 + nameLength + extraLength, name = bytes.subarray(at + 30, at + 30 + nameLength).toString('utf8');
    if (method !== 0 || compressed !== size || start + size > bytes.length || !/^[A-Za-z0-9_./-]+$/.test(name) || name.startsWith('/') || name.split('/').includes('..') || entries.has(name)) throw Error('Unexpected release archive entry.');
    entries.set(name, bytes.subarray(start, start + size)); at = start + size;
  }
  if (!entries.size || bytes.readUInt32LE(at) !== 0x02014b50) throw Error('Incomplete release archive.');
  return entries;
}
module.exports = { readSourceArchive, sha256 };
