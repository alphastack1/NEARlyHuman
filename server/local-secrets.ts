import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isHosted } from './config';

/** Optional Windows workstation credentials. Never imported by production functions. */
export function loadLocalSecrets() {
  if (process.platform !== 'win32' || isHosted()) return;
  const dir = path.join(os.homedir(), '.codex', 'secrets', 'nearlyhuman');
  for (const [name, file, hex] of [
    ['NEAR_AI_API_KEY', 'near-ai.dpapi', false],
    ['NEARLYHUMAN_RELAY_KEY', 'relay-wallet.dpapi', true],
    ['NEARLYHUMAN_SESSION_SECRET', 'session.dpapi', false],
    ...(process.env.NEARLYHUMAN_QA_WALLET === '1' ? [['NEARLYHUMAN_QA_OWNER_KEY', 'developer-wallet.dpapi', true]] : []),
  ] as [string, string, boolean][]) {
    if (process.env[name] || !fs.existsSync(path.join(dir, file))) continue;
    const target = path.join(dir, file).replaceAll("'", "''");
    const ps = `Add-Type -AssemblyName System.Security; $b=[IO.File]::ReadAllBytes('${target}'); $p=[Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); try { [Console]::Out.Write(${hex ? "'0x'+([BitConverter]::ToString($p).Replace('-','').ToLowerInvariant())" : '[Text.Encoding]::UTF8.GetString($p)'}) } finally { [Array]::Clear($p,0,$p.Length) }`;
    const child = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', windowsHide: true });
    if (child.status !== 0 || !child.stdout.trim()) throw new Error('Local credential could not be unlocked: ' + file);
    process.env[name] = child.stdout.trim();
  }
}
