import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { finishReservation, initialLedger, reserveInLedger, type AdmissionLedger, type Reservation } from './admission';
import { dispatchJob, reserveSend, type JobControl } from './jobs';
import { storage, update } from './storage';

const directory=path.resolve('TEMP/build/server/witness-'+randomUUID());
delete process.env.NETLIFY; // Witnesses always use their isolated local store.
delete process.env.NEARLYHUMAN_RUNTIME;
delete process.env.NETLIFY_BLOBS_CONTEXT;
process.env.NEARLYHUMAN_DATA_DIR=directory;
const player='0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6' as const;
const hold=(n:number,scope='same-draft'):Reservation=>({id:('0x'+n.toString(16).padStart(64,'0')) as `0x${string}`,player,scope,expiresAt:2_000_000_000,createdAt:Date.now(),status:'held',reserveMicroUSD:60_000,gasReserve:'100'});
const capacity={funded:180_000,wallet:12,global:100,concurrency:3,gas:300n};
after(async()=>{assert.ok(directory.startsWith(path.resolve('TEMP')+path.sep));await fs.rm(directory,{recursive:true,force:true});});

test('concurrent edits reuse one capacity hold; different requests cannot overbook it',async()=>{
  await Promise.all(Array.from({length:6},(_,i)=>update('test/holds',initialLedger,l=>{reserveInLedger(l,hold(i+1),capacity);return l;})));
  const l=(await storage().get<AdmissionLedger>('test/holds'))!.value;
  assert.equal(Object.keys(l.holds).length,1);
  reserveInLedger(l,hold(7,'another'),capacity);reserveInLedger(l,hold(8,'third'),capacity);
  assert.throws(()=>reserveInLedger(l,hold(9,'fourth'),capacity),/busy/);
});
test('finished spending and accepted attempts still bound future admission',()=>{
  const l=initialLedger(),a=hold(11,'spent');a.status='done';a.spentMicroUSD=130_000;l.spentMicroUSD=130_000;l.holds[a.id]=a;
  assert.throws(()=>reserveInLedger(l,hold(12,'new'),capacity),/resting/);
  const walletLimited={...capacity,funded:1_000_000,wallet:1};
  assert.throws(()=>reserveInLedger(l,hold(13,'new'),walletLimited),/busy/);
});
test('uncertain sends consume durable allowance, with at most two extra sends per decision and 72 total',()=>{
  const c={allowances:{},sent:0,spentMicroUSD:0} as JobControl;
  reserveSend(c,1,'first');reserveSend(c,1,'second');reserveSend(c,1,'third');
  assert.equal(c.spentMicroUSD,1764);assert.throws(()=>reserveSend(c,1,'fourth'),/attempt_limit/);
  for(let slot=2;slot<=70;slot++)reserveSend(c,slot,String(slot));
  assert.equal(c.sent,72);assert.throws(()=>reserveSend(c,71,'73rd'),/attempt_limit/);
});
test('terminal reconciliation charges accepted spending exactly once across duplicate workers',async()=>{
  const h=hold(21,'terminal');h.status='accepted';
  await storage().put('control/admission-v1',{holds:{[h.id]:h},spentMicroUSD:0});
  await Promise.all([finishReservation(h.id,1234),finishReservation(h.id,1234)]);
  const l=(await storage().get<AdmissionLedger>('control/admission-v1'))!.value;
  assert.equal(l.spentMicroUSD,1234);assert.equal(l.holds[h.id]?.status,'done');assert.equal(l.holds[h.id]?.spentMicroUSD,1234);
});
test('hosted runtime dispatches background work when the build-only NETLIFY flag is absent',async()=>{
  const names=['NEARLYHUMAN_RUNTIME','URL','NEARLYHUMAN_SESSION_SECRET'],saved=Object.fromEntries(names.map(n=>[n,process.env[n]])),originalFetch=globalThis.fetch;
  try{
    process.env.NEARLYHUMAN_RUNTIME='netlify';process.env.URL='https://runtime-witness.invalid';process.env.NEARLYHUMAN_SESSION_SECRET='isolated-witness-secret-never-used-live';
    let calls=0;
    globalThis.fetch=async(input,options)=>{calls++;assert.equal(String(input),'https://runtime-witness.invalid/.netlify/functions/prepare-background');assert.equal(options?.method,'POST');assert.equal(JSON.parse(String(options?.body)).requestId,hold(31).id);return new Response(null,{status:202});};
    await dispatchJob(hold(31).id);assert.equal(calls,1);
  }finally{globalThis.fetch=originalFetch;for(const n of names){if(saved[n]===undefined)delete process.env[n];else process.env[n]=saved[n];}}
});
