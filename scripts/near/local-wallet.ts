import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { KeyPair } from 'near-api-js';

export type NearRole = 'owner' | 'contract' | 'relay';
export const nearSecretsDirectory = path.join(os.homedir(), '.codex', 'secrets', 'nearlyhuman');
const roleFile = (role: NearRole) => path.join(nearSecretsDirectory, `near-${role}-wallet.dpapi`);
const publicFile = (role: NearRole) => path.join(nearSecretsDirectory, role === 'owner' ? 'near-testnet-wallet.public.json' : `near-${role}-wallet.public.json`);
export interface NearWalletMetadata { accountId: string; publicKey: string; network?: string; role?: string }
function gate() { if (process.platform !== 'win32' || process.env.NEARLYHUMAN_NEAR_QA_WALLET !== '1') throw new Error('Native testnet operator wallet is not enabled.'); }
export function nearWalletMetadata(role: NearRole): NearWalletMetadata {
  const metadata = JSON.parse(fs.readFileSync(publicFile(role), 'utf8')) as NearWalletMetadata;
  if (!metadata.accountId.endsWith('.testnet') || !metadata.publicKey.startsWith('ed25519:')) throw new Error('Choose the prepared native testnet account.');
  return metadata;
}
/** Recover only inside the gated Node operator. Never return it to a browser or
 * log the account object; public metadata is available separately. */
export function unlockNearWallet(role: NearRole): KeyPair {
  gate();
  const filename = roleFile(role).replaceAll("'", "''");
  const command = `Add-Type -AssemblyName System.Security; $b=[IO.File]::ReadAllBytes('${filename}'); $p=[Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); try{[Console]::Out.Write([Text.Encoding]::UTF8.GetString($p))}finally{[Array]::Clear($p,0,$p.Length)}`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0 || !result.stdout.startsWith('ed25519:')) throw new Error('The native operator key could not be recovered.');
  const key = KeyPair.fromString(result.stdout.trim() as `ed25519:${string}`);
  if (key.getPublicKey().toString() !== nearWalletMetadata(role).publicKey) throw new Error('The native operator public key changed.');
  return key;
}
/** Provisioning helper: accepts secrets in memory/stdin only. Existing keys are
 * never replaced. Parent directory remains the existing private credential area. */
export function saveNearWallet(role: NearRole, accountId: string, key: KeyPair): NearWalletMetadata {
  gate();
  if (!accountId.endsWith('.testnet')) throw new Error('Only testnet wallet provisioning is enabled.');
  fs.mkdirSync(nearSecretsDirectory, { recursive: true });
  const filename = roleFile(role).replaceAll("'", "''");
  if (fs.existsSync(roleFile(role))) {
    const existing = unlockNearWallet(role); if (existing.getPublicKey().toString() !== key.getPublicKey().toString()) throw new Error('An existing native key must not be replaced.');
  } else {
    const command = `Add-Type -AssemblyName System.Security; $p=[Convert]::FromBase64String([Console]::ReadLine()); try{$c=[Security.Cryptography.ProtectedData]::Protect($p,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);$f=[IO.File]::Open('${filename}',[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$f.Write($c,0,$c.Length);$f.Flush($true)}finally{$f.Dispose()}}finally{[Array]::Clear($p,0,$p.Length)}`;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', input: Buffer.from(key.toString()).toString('base64') + '\n', windowsHide: true });
    if (result.status !== 0) throw new Error('The native operator key could not be protected.');
  }
  const metadata: NearWalletMetadata = { accountId, publicKey: key.getPublicKey().toString(), network: 'testnet', role };
  if (role !== 'owner') {
    if (fs.existsSync(publicFile(role))) {
      const previous = nearWalletMetadata(role); if (previous.accountId !== accountId || previous.publicKey !== metadata.publicKey) throw new Error('Native wallet metadata already belongs to another account.');
    } else fs.writeFileSync(publicFile(role), JSON.stringify(metadata, null, 2), { flag: 'wx' });
  }
  return metadata;
}
