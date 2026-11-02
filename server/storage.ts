import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { isHosted } from './config';

export interface Stored<T> { value: T; etag: string }
export interface DurableStore {
  get<T>(key: string): Promise<Stored<T> | null>;
  put<T>(key: string, value: T, condition?: { etag?: string; isNew?: boolean }): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}
export class StoreConflict extends Error { constructor() { super('The request is busy. Please check again.'); this.name = 'StoreConflict'; } }

class CloudStore implements DurableStore {
  // The function runtime supplies a fresh, short-lived Blobs token each invocation.
  // A warm module may outlive that token; resolve the invocation context per operation.
  private get store() { return getStore({ name: 'nearlyhuman-v1', consistency: 'strong' }); }
  async get<T>(key: string): Promise<Stored<T> | null> {
    const r = await this.store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    if (!r) return null;
    if (!r.etag) throw new StoreConflict();
    return { value: r.data as T, etag: r.etag };
  }
  async put<T>(key: string, value: T, condition: { etag?: string; isNew?: boolean } = {}) {
    const r = await this.store.setJSON(key, value, condition.etag ? { onlyIfMatch: condition.etag } : condition.isNew ? { onlyIfNew: true } : undefined);
    return !!r.modified;
  }
  async list(prefix: string) {
    const keys: string[] = [];
    for await (const page of this.store.list({ prefix, paginate: true })) keys.push(...page.blobs.map(b => b.key));
    return keys;
  }
  async delete(key: string) { await this.store.delete(key); }
}

/** The local app keeps durable records outside the checkout; production uses site-wide Blobs. */
class LocalStore implements DurableStore {
  private dir = process.env.NEARLYHUMAN_DATA_DIR || path.join(os.homedir(), '.codex', 'data', 'nearlyhuman');
  private queue: Promise<unknown> = Promise.resolve();
  private serial<T>(run: () => Promise<T>): Promise<T> {
    const operation = this.queue.catch(() => {}).then(run); this.queue = operation; return operation;
  }
  private file(key: string) { return path.join(this.dir, createHash('sha256').update(key).digest('hex') + '.json'); }
  /** Exclusive pathname creation makes conditional writes atomic across local workers.
   * A crashed writer leaves its lock for inspection; never unlink a stale pathname
   * automatically because another contender may have acquired it in the meantime.
   */
  private async mutate<T>(key: string, run: () => Promise<T>): Promise<T> {
    await fs.mkdir(this.dir, { recursive: true });
    const lock = this.file(key) + '.lock', token = randomUUID(), deadline = Date.now() + 5000;
    let acquired = false;
    while (!acquired) {
      try {
        const handle = await fs.open(lock, 'wx', 0o600);
        try { await handle.writeFile(JSON.stringify({ version: 1, pid: process.pid, token, createdAt: Date.now() })); }
        finally { await handle.close(); }
        acquired = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        if (Date.now() >= deadline) throw new StoreConflict();
        await new Promise(resolve => setTimeout(resolve, 25 + Math.floor(Math.random() * 25)));
      }
    }
    try { return await run(); }
    finally {
      const held = JSON.parse(await fs.readFile(lock, 'utf8')) as { pid?: number; token?: string };
      if (held.pid !== process.pid || held.token !== token) throw new StoreConflict();
      for (let attempt = 0;; attempt++) {
        try { await fs.unlink(lock); break; }
        catch (error) {
          if (attempt >= 6 || !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code || '')) throw error;
          await new Promise(resolve => setTimeout(resolve, 30 * 2 ** attempt));
        }
      }
    }
  }
  private async read<T>(key: string): Promise<Stored<T> | null> {
    try { const r = JSON.parse(await fs.readFile(this.file(key), 'utf8')); return { value: r.value, etag: r.etag }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  }
  get<T>(key: string): Promise<Stored<T> | null> { return this.serial(() => this.read<T>(key)); }
  async put<T>(key: string, value: T, condition: { etag?: string; isNew?: boolean } = {}) {
    return this.serial(() => this.mutate(key, async () => {
      const old = await this.read<T>(key);
      if (condition.isNew && old || condition.etag && old?.etag !== condition.etag) return false;
      await fs.mkdir(this.dir, { recursive: true });
      const file = this.file(key), temp = file + '.' + randomUUID() + '.tmp';
      try {
        await fs.writeFile(temp, JSON.stringify({ key, value, etag: randomUUID() }));
        // Windows readers/antivirus can briefly hold the replace target open.
        for (let attempt = 0;; attempt++) {
          try { await fs.rename(temp, file); break; }
          catch (error) {
            if (attempt >= 6 || !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code || '')) throw error;
            await new Promise(resolve => setTimeout(resolve, 30 * 2 ** attempt));
          }
        }
        return true;
      } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
    }));
  }
  async list(prefix: string) {
    return this.serial(async () => {
    await fs.mkdir(this.dir, { recursive: true }); const keys: string[] = [];
    for (const file of await fs.readdir(this.dir)) { if (!file.endsWith('.json')) continue; const r = JSON.parse(await fs.readFile(path.join(this.dir, file), 'utf8')); if (r.key?.startsWith(prefix)) keys.push(r.key); }
    return keys;
    });
  }
  async delete(key: string) { await this.serial(() => this.mutate(key, () => fs.rm(this.file(key), { force: true }))); }
}
let singleton: DurableStore | undefined;
export const storage = () => singleton ||= isHosted() ? new CloudStore() : new LocalStore();
export async function update<T>(key: string, initial: () => T, apply: (value: T) => T | Promise<T>) {
  for (let i = 0; i < 12; i++) {
    const current = await storage().get<T>(key); const next = await apply(structuredClone(current?.value ?? initial()));
    if (await storage().put(key, next, current ? { etag: current.etag } : { isNew: true })) return next;
  }
  throw new StoreConflict();
}
