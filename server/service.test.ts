import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { BlockNotFoundError, ContractFunctionRevertedError, decodeFunctionData, encodeFunctionResult, toHex } from 'viem';
import { DECISION_CONFIG, DECISION_PARAMETERS, finishReservation, initialLedger, reserveInLedger, type AdmissionLedger, type Reservation } from './admission';
import { dispatchJob, reserveSend, runJob, type JobControl } from './jobs';
import { storage, update } from './storage';
import { blockUnavailable, pinnedRead, ServiceError } from './chain';
import { nearlyHumanAbi } from '../src/chain/abi';
import { cloneState, createDayContext, createInitialState, focusOptions, ITEM_IDS, morningOptions, packState, prepareDay, unpackState, type ChoiceContext, type DayCheckpoint } from '../src/domain';
import { buildDecision, infer, InferenceError } from './jev';

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
  reserveSend(c,0,'first-plan');reserveSend(c,0,'second-plan');reserveSend(c,0,'third-plan');
  assert.equal(c.spentMicroUSD,1764);assert.throws(()=>reserveSend(c,0,'fourth-plan'),/attempt_limit/);
  for(let slot=2;slot<=70;slot++)reserveSend(c,slot,String(slot));
  assert.equal(c.sent,72);assert.throws(()=>reserveSend(c,71,'73rd'),/attempt_limit/);
});

test('one budgeted planner request validates both feasible focus and morning answers',async()=>{
  const previous=process.env.NEAR_AI_API_KEY,originalFetch=globalThis.fetch;
  const base=createInitialState('0x4567');base.day=1;base.level=1;for(const item of ITEM_IDS)base.inventory[item]=0;base.inventory.bread=2;base.inventory.coffee=1;base.needs.energy=8500;
  const ctx=createDayContext(base,['wood','toolkit']),projects=focusOptions(ctx),orders=morningOptions(ctx,projects);
  const context:ChoiceContext={state:cloneState(ctx.state),day:ctx.day,slot:0,phase:'Dawn',mode:'day-plan',candidates:projects,morningOptions:orders,pendingDelivery:ctx.pendingDelivery,recent:[],situation:{episodes:[],restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,chairMoved:false,minorUsed:false}};
  const input=buildDecision(context);assert.deepEqual(Object.keys(input.questions),['next_action','morning_order']);assert.equal(input.state.pacing.remaining_phase_boundaries,6);assert.ok(Buffer.byteLength(JSON.stringify(input))<14_000);assert.equal(input.state.stock.wood,0);assert.equal(input.state.project_stock_after_collection?.wood,1);
  let beforeSend=0,sends=0,badMorning=false;
  try{
    process.env.NEAR_AI_API_KEY='isolated-planner-test-no-live-credential';
    globalThis.fetch=async(_url,options)=>{sends++;assert.equal(beforeSend,sends);const body=JSON.parse(String(options?.body)),keys=Object.keys(body.questions.next_action.criteria),morning=Object.keys(body.questions.morning_order.criteria);assert.ok(morning.includes('coffee-first'));return Response.json({model:'typesafe/jev-1.13',answers:{next_action:{type:'choice',choice:keys[0],probabilities:Object.fromEntries(keys.map((key,index)=>[key,index===0?1:0]))},morning_order:{type:'choice',choice:badMorning?'invented-order':'coffee-first',probabilities:Object.fromEntries(morning.map(key=>[key,key==='coffee-first'?1:0]))}},usage:{input_tokens:1,output_tokens:1,cost:0}});};
    const reserve=async(hash:string,body:unknown)=>{beforeSend++;assert.equal(hash,createHash('sha256').update(JSON.stringify(body)).digest('hex'));};
    const answer=await infer(context,reserve);assert.equal(sends,1);assert.equal(answer.choice.key,projects[0]!.key);assert.equal(answer.choice.morningKey,'coffee-first');assert.equal(answer.exchange.morningChoice,'coffee-first');
    badMorning=true;await assert.rejects(infer(context,reserve),error=>error instanceof InferenceError&&error.code==='invalid_morning_choice');assert.equal(sends,2);
  }finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.NEAR_AI_API_KEY;else process.env.NEAR_AI_API_KEY=previous;}
});
test('zero-token reported charges stop a planner or routine once; unknown usage retains its reserve and cached recovery cannot bypass the limit',async()=>{
  const names=['NEARLYHUMAN_RPC_URL','NEARLYHUMAN_COLLECTION','NEAR_AI_API_KEY','NEARLYHUMAN_RELAY_KEY'],saved=Object.fromEntries(names.map(n=>[n,process.env[n]])),originalFetch=globalThis.fetch;
  const address='0x1111111111111111111111111111111111111111' as const;
  try{
    process.env.NEARLYHUMAN_RPC_URL='https://cost-witness.invalid';process.env.NEARLYHUMAN_COLLECTION=address;process.env.NEAR_AI_API_KEY='isolated-cost-test-no-live-credential';delete process.env.NEARLYHUMAN_RELAY_KEY;
    for(const [index,expensiveSlot]of [0,1,undefined].entries()){
      const id=hold(201+index).id,permitId=hold(211+index).id,inputDigest=hold(221+index).id,acceptedHash=hold(231+index).id,daySeed=hold(241+index).id;
      const initial=createInitialState('0x1234',undefined,'COST'),base=unpackState(packState(initial),{seed:initial.seed,name:initial.name,stats:initial.stats});
      const job:JobControl={version:1,chainId:46630,collection:address,requestId:id,tokenId:'201',player,permitId,inputDigest,seed:daySeed,decisionConfig:DECISION_CONFIG,rulesVersion:1,deadline:2_000_001_000,baseRevision:0,day:1,delivery:0,ownerTx:hold(251).id,acceptedBlock:'16',acceptedHash,base,phase:'queued',generation:0,receiptKeys:[],slot:0,decisions:0,sent:0,allowances:{},spentMicroUSD:0,updatedAt:Date.now(),createdAt:Date.now()};
      await storage().put('jobs/'+id,job);const inferenceSlots:number[]=[],rpcMethods:string[]=[];
      const request={tokenId:201n,player,baseRevision:0,day:1,delivery:0,rulesVersion:1,acceptedAt:1_999_999_000n,deadline:2_000_001_000n,seed:BigInt(daySeed),decisionConfig:DECISION_CONFIG,permitId,inputDigest,status:1,resultHash:toHex(0,{size:32})};
      const raw={name:base.name,...base.stats,alive:true,deathCause:0,day:0,level:0,revision:0,attempts:1,bornAt:1_999_999_000n,seed:BigInt(base.seed),pendingRequest:id,latestRequest:toHex(0,{size:32}),replayCommitment:toHex(0,{size:32}),state:packState(base)};
      globalThis.fetch=async(input,options)=>{
        if(String(input)==='https://cloud-api.near.ai/v1/systemone'){
          const body=JSON.parse(String(options?.body)),slot=body.state.slot;inferenceSlots.push(slot);const keys=Object.keys(body.questions.next_action.criteria),selected=keys.find(k=>k.startsWith('T01_'))||keys[0];
          // A real reported charge must count even when the optional token telemetry is absent.
          return Response.json({model:'typesafe/jev-1.13',answers:{next_action:{type:'choice',choice:selected}},...(slot===expensiveSlot?{usage:{input_tokens:0,cost:.07}}:{})});
        }
        assert.equal(new URL(String(input)).origin,'https://cost-witness.invalid');const rpc=JSON.parse(String(options?.body));rpcMethods.push(rpc.method);let result:unknown;
        if(rpc.method==='eth_chainId')result=toHex(46630);
        else if(rpc.method==='eth_getCode')result='0x6000';
        else if(rpc.method==='eth_getBlockByNumber'){
          const current=(await storage().get<JobControl>('jobs/'+id))!.value;
          // Keep a completed control before relay submission without a live signer or chain.
          result=current.packet&&rpc.params[0]==='0x64'?null:{number:rpc.params[0]==='0x10'?'0x10':'0x64',timestamp:toHex(2_000_000_000),hash:rpc.params[0]==='0x10'?acceptedHash:hold(261).id,transactions:[]};
        }else if(rpc.method==='eth_call'){
          const decoded=decodeFunctionData({abi:nearlyHumanAbi,data:rpc.params[0].data}),values:Record<string,unknown>={RULES_VERSION:1,STATE_BYTES:192n,isTestnet:true,getRequest:request,getRooster:raw,ownerOf:player};
          assert.ok(decoded.functionName in values,decoded.functionName);result=encodeFunctionResult({abi:nearlyHumanAbi,functionName:decoded.functionName,result:values[decoded.functionName]} as Parameters<typeof encodeFunctionResult>[0]);
        }else throw Error('Unexpected RPC '+rpc.method);
        return Response.json({jsonrpc:'2.0',id:rpc.id,result});
      };
      await runJob(id);let after=(await storage().get<JobControl>('jobs/'+id))!.value;
      if(expensiveSlot===undefined){
        assert.equal(after.phase,'saving');assert.equal(after.slot,60);assert.ok(inferenceSlots.includes(0)&&inferenceSlots.includes(1));assert.equal(after.spentMicroUSD,inferenceSlots.length*588);assert.equal(after.failure,undefined);
      }else{
        assert.deepEqual(inferenceSlots,expensiveSlot===0?[0]:[0,1]);assert.equal(after.spentMicroUSD,70_000+expensiveSlot*588);assert.equal(after.failure,'provider_price_changed');assert.equal(after.phase,'recording_failure');assert.equal(after.sent,expensiveSlot+1);assert.equal(after.allowances[expensiveSlot]!.count,1);assert.ok(after.allowances[expensiveSlot]!.answer);assert.equal(after.packet,undefined);
        // Simulate interruption just after persisting the paid answer, before the limit failure was persisted.
        const sent=after.sent,cost=after.spentMicroUSD;await storage().put('jobs/'+id,{...after,phase:'queued',failure:undefined});
        await runJob(id);after=(await storage().get<JobControl>('jobs/'+id))!.value;
        assert.equal(after.phase,'recording_failure');assert.equal(after.failure,'provider_price_changed');assert.equal(after.sent,sent);assert.equal(after.spentMicroUSD,cost);assert.equal(inferenceSlots.length,sent);
      }
      assert.ok(!rpcMethods.some(method=>/sendRawTransaction|sendTransaction/.test(method)));assert.equal(after.journal,undefined);assert.equal(after.finalTx,undefined);
    }
  }finally{globalThis.fetch=originalFetch;for(const name of names){if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name];}}
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

test('missing-block classification is narrow, follows bounded causes and retries only that category',async()=>{
  const missing=new BlockNotFoundError({blockNumber:146583663n});
  for(const error of [missing,new Error('\nBlock at number "146583663" could not be found.\n\nVersion: viem@2.57.14'),new Error('wrapped',{cause:missing}),new Error('header not found'),new Error('unsupported block number')])assert.equal(blockUnavailable(error),true);
  for(const error of [new ServiceError('Record not found.','request',404),Object.assign(new Error('Transaction could not be found.'),{name:'TransactionNotFoundError'}),new Error('404: endpoint not found'),new Error('execution reverted: block not found in game'),new Error('a block at number 10 could not be found in this note')])assert.equal(blockUnavailable(error),false);
  const reverted=new ContractFunctionRevertedError({abi:[],functionName:'witness',message:'block not found in game'});assert.equal(blockUnavailable(reverted),false);assert.equal(blockUnavailable(new Error(reverted.message,{cause:reverted})),false);
  const cycle: {cause?:unknown}={};cycle.cause=cycle;assert.equal(blockUnavailable(cycle),false);
  let attempts=0;assert.equal(await pinnedRead(async()=>{if(++attempts<3)throw missing;return 'caught up';}),'caught up');assert.equal(attempts,3);
  attempts=0;const unrelated=new ServiceError('Record not found.','request',404);await assert.rejects(pinnedRead(async()=>{attempts++;throw unrelated;}),error=>error===unrelated);assert.equal(attempts,1);
});

test('worker queues an exhausted missing block, preserves checkpoint40/cached41 and resumes without duplicate inference; hash changes stay quarantined',async()=>{
  const names=['NEARLYHUMAN_RPC_URL','NEARLYHUMAN_COLLECTION','NEAR_AI_API_KEY'],saved=Object.fromEntries(names.map(n=>[n,process.env[n]])),originalFetch=globalThis.fetch;
  const address='0x1111111111111111111111111111111111111111' as const,id=hold(81).id,permitId=hold(82).id,inputDigest=hold(83).id,headHash=hold(84).id,acceptedHash=hold(85).id,daySeed=hold(86).id;
  const initialState=createInitialState('0x1234',undefined,'RECOVERY'),base=unpackState(packState(initialState),{seed:initialState.seed,name:initialState.name,stats:initialState.stats}),baseJson=JSON.stringify(base),contexts=new Map<number,ChoiceContext>(),checkpoints:DayCheckpoint[]=[];
  const quiet=(context:ChoiceContext)=>({key:(context.candidates.find(c=>c.action==='T01')||context.candidates[0]!).key,provider:'NEAR AI',model:'typesafe/jev-1.13'});
  const expected=await prepareDay(base,[],async context=>{contexts.set(context.slot,cloneState(context));return quiet(context);},{...DECISION_PARAMETERS,daySeed,onCheckpoint:cp=>{checkpoints.push(cp);}});
  assert.ok(contexts.has(41));
  const allowance=Object.fromEntries([...contexts].filter(([slot])=>slot<=41).map(([slot,context])=>[slot,{count:1,inputs:[`fixture/input/${slot}`],outputs:[`fixture/output/${slot}`],answer:{inputHash:createHash('sha256').update(JSON.stringify(buildDecision(context))).digest('hex'),choice:quiet(context),exchange:`fixture/output/${slot}`}}]));
  const receiptKeys:string[]=[];for(const cp of checkpoints.filter(cp=>cp.context.slot>0&&cp.context.slot<=40)){const key=`recovery-fixture/${id}/${cp.context.slot}`;receiptKeys.push(key);await storage().put(key,{context:cp.context,receipt:cp.receipts.at(-1)});}
  const cachedSends=Object.keys(allowance).length;
  const initial:JobControl={version:1,chainId:46630,collection:address,requestId:id,tokenId:'81',player,permitId,inputDigest,seed:daySeed,decisionConfig:DECISION_CONFIG,rulesVersion:1,deadline:2_000_001_000,baseRevision:0,day:1,delivery:0,ownerTx:hold(87).id,acceptedBlock:'16',acceptedHash,base,phase:'queued',generation:0,checkpoint:receiptKeys.at(-1),receiptKeys,slot:40,decisions:checkpoints.find(cp=>cp.context.slot===40)!.context.modelChoices,sent:cachedSends,allowances:allowance,spentMicroUSD:4100,updatedAt:Date.now(),createdAt:Date.now()};
  await storage().put('jobs/'+id,initial);
  let mode:'missing'|'restored'|'changed'='missing',missingReads=0;const inferenceSlots:number[]=[],rpcMethods:string[]=[];
  const request={tokenId:81n,player,baseRevision:0,day:1,delivery:0,rulesVersion:1,acceptedAt:1_999_999_000n,deadline:2_000_001_000n,seed:BigInt(daySeed),decisionConfig:DECISION_CONFIG,permitId,inputDigest,status:1,resultHash:toHex(0,{size:32})};
  const raw={name:base.name,...base.stats,alive:true,deathCause:0,day:0,level:0,revision:0,attempts:1,bornAt:1_999_999_000n,seed:BigInt(base.seed),pendingRequest:id,latestRequest:toHex(0,{size:32}),replayCommitment:toHex(0,{size:32}),state:packState(base)};
  try{
    process.env.NEARLYHUMAN_RPC_URL='https://recovery-witness.invalid';process.env.NEARLYHUMAN_COLLECTION=address;process.env.NEAR_AI_API_KEY='isolated-witness-no-live-credential';
    globalThis.fetch=async(input,options)=>{
      if(String(input)==='https://cloud-api.near.ai/v1/systemone'){
        const body=JSON.parse(String(options?.body)),slot=body.state.slot;inferenceSlots.push(slot);const keys=Object.keys(body.questions.next_action.criteria),selected=keys.find(k=>k.startsWith('T01_'))!;
        return Response.json({model:'typesafe/jev-1.13',answers:{next_action:{type:'choice',choice:selected,probabilities:Object.fromEntries(keys.map(k=>[k,k===selected?1:0]))}},usage:{input_tokens:1,output_tokens:1,cost:0}});
      }
      assert.equal(new URL(String(input)).origin,'https://recovery-witness.invalid');const rpc=JSON.parse(String(options?.body));rpcMethods.push(rpc.method);let result:unknown;
      if(rpc.method==='eth_chainId')result=toHex(46630);
      else if(rpc.method==='eth_getCode')result='0x6000';
      else if(rpc.method==='eth_getBlockByNumber'){
        const current=(await storage().get<JobControl>('jobs/'+id))!.value;
        if((mode==='missing'&&rpc.params[0]==='0x64')||(mode==='restored'&&current.packet)){missingReads++;result=null;}
        else result={number:rpc.params[0]==='0x10'?'0x10':'0x64',timestamp:toHex(2_000_000_000),hash:rpc.params[0]==='0x10'?acceptedHash:mode==='changed'&&rpc.params[0]==='0x64'?hold(99).id:headHash,transactions:[]};
      }else if(rpc.method==='eth_call'){
        const decoded=decodeFunctionData({abi:nearlyHumanAbi,data:rpc.params[0].data});
        const values:Record<string,unknown>={RULES_VERSION:1,STATE_BYTES:192n,isTestnet:true,getRequest:request,getRooster:raw,ownerOf:player};
        assert.ok(decoded.functionName in values,decoded.functionName);result=encodeFunctionResult({abi:nearlyHumanAbi,functionName:decoded.functionName,result:values[decoded.functionName]} as Parameters<typeof encodeFunctionResult>[0]);
      }else throw Error('Unexpected RPC '+rpc.method);
      return Response.json({jsonrpc:'2.0',id:rpc.id,result});
    };
    await runJob(id);let after=(await storage().get<JobControl>('jobs/'+id))!.value;
    assert.equal(missingReads,5);assert.equal(after.phase,'queued');assert.equal(after.slot,40);assert.equal(after.sent,cachedSends);assert.deepEqual(after.receiptKeys,receiptKeys);assert.deepEqual(after.allowances,allowance);assert.equal(after.failure,undefined);assert.equal(after.journal,undefined);assert.equal(after.finalTx,undefined);assert.equal(after.lease,undefined);assert.equal(inferenceSlots.length,0);
    mode='restored';await runJob(id);after=(await storage().get<JobControl>('jobs/'+id))!.value;
    assert.equal(after.slot,60,JSON.stringify({phase:after.phase,failure:after.failure,sent:after.sent,inferenceSlots}));assert.equal(after.phase,'saving');assert.equal(after.sent,contexts.size);assert.equal(after.allowances[41]!.count,1);assert.equal(after.failure,undefined);assert.equal(after.journal,undefined);assert.equal(after.finalTx,undefined);assert.deepEqual(inferenceSlots,[...contexts.keys()].filter(slot=>slot>41));
    const packet=(await storage().get<{result:typeof expected}>(after.packet!))!.value;assert.equal(packet.result.history,expected.history);assert.deepEqual(packet.result.finalState,expected.finalState);assert.equal(JSON.stringify(base),baseJson);assert.ok(!rpcMethods.some(m=>/sendRawTransaction|sendTransaction/.test(m)));
    await storage().put('jobs/'+id,{...initial,generation:after.generation});mode='changed';await runJob(id);after=(await storage().get<JobControl>('jobs/'+id))!.value;
    assert.equal(after.phase,'checking');assert.equal(after.slot,40);assert.equal(after.sent,cachedSends);assert.equal(after.failure,undefined);assert.equal(after.journal,undefined);assert.equal(after.finalTx,undefined);assert.equal(inferenceSlots.includes(41),false);
    // A durable slot-zero plan is a valid checkpoint without a synthetic receipt.
    const plan=checkpoints.find(cp=>cp.context.slot===0)!,planKey=`recovery-fixture/${id}/plan`;
    await storage().put(planKey,{context:plan.context});inferenceSlots.length=0;mode='restored';
    await storage().put('jobs/'+id,{...initial,checkpoint:planKey,receiptKeys:[],slot:0,decisions:plan.context.modelChoices,sent:1,allowances:{0:allowance[0]},spentMicroUSD:100,generation:after.generation});
    await runJob(id);after=(await storage().get<JobControl>('jobs/'+id))!.value;
    assert.equal(after.phase,'saving');assert.equal(after.slot,60);assert.equal(after.allowances[0]!.count,1);assert.equal(inferenceSlots.includes(0),false);assert.equal(after.sent,contexts.size);
    const plannedPacket=(await storage().get<{result:typeof expected}>(after.packet!))!.value;
    assert.equal(plannedPacket.result.history,expected.history);assert.deepEqual(plannedPacket.result.dailyFocus,expected.dailyFocus);
  }finally{globalThis.fetch=originalFetch;for(const n of names){if(saved[n]===undefined)delete process.env[n];else process.env[n]=saved[n];}}
});
