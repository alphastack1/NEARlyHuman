import {randomUUID} from 'node:crypto';
import {KeyPair,Signature,SignedTransaction,actions,createTransaction,encodeTransaction,decodeSignedTransaction} from 'near-api-js';
import {keccak256,toHex} from 'viem';
import {storage,type DurableStore} from '../storage';
import {updateV2Record} from '../v2/budget';
import {base58Decode,base58Encode,sha256} from './encoding';
import {nearRpc,nearFinalBlock,verifyNearRuntime,nearView} from './rpc';
import {NearError,type NearRuntime,type NearRequest} from './types';

export interface NearTxOutcome {
  final_execution_status?:string;status?:{SuccessValue?:string;Failure?:unknown}|string;
  transaction?:{hash:string;signer_id:string;receiver_id:string;nonce:number;actions:Array<{FunctionCall?:{method_name:string;args:string;gas:number|string;deposit:string}}>};
  transaction_outcome?:{block_hash:string;outcome:{status:unknown}};
  receipts_outcome?:Array<{block_hash:string;outcome:{status:unknown;gas_burnt:number;tokens_burnt:string}}>;receipts?:unknown[];
}
export interface NearRelayJournal {jobId:string;method:'finalize'|'fail'|'expire';args:string;resultDigest:string;hash:string;raw:string;nonce:string;createdAt:number}
interface RelayControl {lease?:{id:string;until:number};pending?:NearRelayJournal;nonceFloor?:string}
/** Called only after the caller has checked the terminal business record, or
 * after a final block proves that an old finalize can no longer execute. A nonce
 * floor prevents different new bytes from reusing the retired exact nonce. */
export async function retireNearRelayIntent(runtime:NearRuntime,jobId:string,proof:{terminal:true}|{requestId:string;deadline:string},store:DurableStore=storage()){
  const key=`near/v2/control/relay/${runtime.networkId}/${runtime.relayer}`;
  if(!('terminal'in proof)){
    const {block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:proof.requestId},block);
    if(!q||q.status!==1||q.deadline!==proof.deadline||BigInt(block.timestamp)<=BigInt(proof.deadline))throw new NearError('context','The original NEAR relay intent is still live.');
  }
  await updateV2Record<RelayControl>(store,key,()=>({}),control=>{
    const p=control.pending;if(!p||p.jobId!==jobId)return control;
    if(!('terminal'in proof)){let args:{request_id?:string};try{args=JSON.parse(p.args);}catch{throw new NearError('context','The native relay journal changed.');}if(p.method!=='finalize'||args.request_id!==proof.requestId)return control;}
    control.nonceFloor=(BigInt(control.nonceFloor||'0')>BigInt(p.nonce)?BigInt(control.nonceFloor!):BigInt(p.nonce)).toString();delete control.pending;return control;
  });
}
export function nativeRelaySigner(runtime:NearRuntime){
  const secret=process.env.NEARLYHUMAN_NEAR_RELAY_KEY;
  if(!secret||!secret.startsWith('ed25519:'))throw new NearError('connection','The NEAR preparation signer needs another check.',503);
  let signer:KeyPair;try{signer=KeyPair.fromString(secret as `ed25519:${string}`);}catch{throw new NearError('connection','The NEAR preparation signer needs another check.',503);}
  if(Buffer.from(signer.getPublicKey().data).toString('base64')!==runtime.quoteSigner)throw new NearError('context','The NEAR preparation signer changed.');return signer;
}
export async function nativeTxStatus(runtime:NearRuntime,hash:string,signerId:string):Promise<NearTxOutcome>{
  base58Decode(hash,32);return nearRpc<NearTxOutcome>(runtime,'tx',{tx_hash:hash,sender_account_id:signerId,wait_until:'NONE'});
}
export const nativeTxComplete=(outcome:NearTxOutcome)=>outcome.final_execution_status==='FINAL';
export function validateNearRelayJournal(runtime:NearRuntime,journal:NearRelayJournal,signer=nativeRelaySigner(runtime)){
  try{
    if(!journal||!['finalize','fail','expire'].includes(journal.method)||!journal.jobId.startsWith(`near/v2/jobs/${runtime.networkId}/${runtime.collection}/`)||typeof journal.raw!=='string'||journal.raw.length>100000||Buffer.from(journal.raw,'base64').toString('base64')!==journal.raw||! /^(0|[1-9]\d*)$/.test(journal.nonce))throw Error();
    const decoded=decodeSignedTransaction(Buffer.from(journal.raw,'base64')),tx=decoded.transaction,action=tx.actions[0]?.functionCall,signature=decoded.signature.ed25519Signature?.data;
    const args=JSON.parse(journal.args),requestId=journal.jobId.slice(journal.jobId.lastIndexOf('/')+1);
    if(!/^0x[0-9a-f]{64}$/.test(requestId)||args.request_id!==requestId||JSON.stringify(args)!==journal.args||keccak256(toHex(journal.args))!==journal.resultDigest||tx.signerId!==runtime.relayer||tx.receiverId!==runtime.collection||tx.publicKey.toString()!==signer.getPublicKey().toString()||tx.actions.length!==1||!action||action.methodName!==journal.method||Buffer.from(action.args).toString('utf8')!==journal.args||BigInt(action.deposit)!==0n||BigInt(action.gas)<=0n||BigInt(action.gas)>300000000000000n||tx.nonce.toString()!==journal.nonce||base58Encode(sha256(encodeTransaction(tx)))!==journal.hash||!signature||signature.length!==64||!signer.verify(sha256(encodeTransaction(tx)),Uint8Array.from(signature)))throw Error();
    return decoded;
  }catch{throw new NearError('context','The saved NEAR relay intent changed.');}
}
export async function nearRelayTransaction(runtime:NearRuntime,intent:{jobId:string;method:NearRelayJournal['method'];args:Record<string,unknown>;resultDigest:string},onJournal:(journal:NearRelayJournal)=>Promise<void>,options:{store?:DurableStore;recoverJournal?:NearRelayJournal}={}){
  const store=options.store||storage(),signer=nativeRelaySigner(runtime),key=`near/v2/control/relay/${runtime.networkId}/${runtime.relayer}`,leaseId=randomUUID();
  const c=await updateV2Record<RelayControl>(store,key,()=>({}),control=>{if(control.lease&&control.lease.until>Date.now())throw new NearError('busy','An earlier NEAR save is still being checked.',409,true);control.lease={id:leaseId,until:Date.now()+120000};return control;});
  let pending=c.pending;const expectedArgs=JSON.stringify(intent.args);
  try{
    await verifyNearRuntime(runtime);
    if(pending)validateNearRelayJournal(runtime,pending,signer);
    if(!pending&&options.recoverJournal){const saved=options.recoverJournal;validateNearRelayJournal(runtime,saved,signer);
      if(saved.jobId!==intent.jobId||saved.resultDigest!==intent.resultDigest||saved.method!==intent.method||saved.args!==expectedArgs)throw new NearError('context','The saved NEAR relay intent changed.');
      await updateV2Record<RelayControl>(store,key,()=>({}),control=>{if(control.lease?.id!==leaseId||control.pending)throw new NearError('busy','An earlier NEAR save is still being checked.',409,true);control.pending=saved;return control;});pending=saved;
    }
    if(!pending){
      const block=await nearFinalBlock(runtime),access=await nearRpc<{nonce:number;permission:unknown}>(runtime,'query',{request_type:'view_access_key',account_id:runtime.relayer,public_key:signer.getPublicKey().toString(),block_id:block.hash});
      if(!Number.isSafeInteger(access.nonce))throw new NearError('context','The NEAR relay nonce needs another check.');
      const floor=(await store.get<RelayControl>(key))?.value.nonceFloor||'0',nonce=(BigInt(access.nonce)>BigInt(floor)?BigInt(access.nonce):BigInt(floor))+1n;
      const tx=createTransaction(runtime.relayer,signer.getPublicKey(),runtime.collection,nonce,[actions.functionCall(intent.method,intent.args,300000000000000n,0n)],base58Decode(block.hash,32));
      const hashBytes=sha256(encodeTransaction(tx)),signed=new SignedTransaction({transaction:tx,signature:new Signature({keyType:0,data:signer.sign(hashBytes).signature})});
      pending={...intent,args:expectedArgs,hash:base58Encode(hashBytes),raw:Buffer.from(encodeTransaction(signed)).toString('base64'),nonce:tx.nonce.toString(),createdAt:Date.now()};const prepared=pending;
      await updateV2Record<RelayControl>(store,key,()=>({}),control=>{if(control.lease?.id!==leaseId||control.pending)throw new NearError('busy','An earlier NEAR save is still being checked.',409,true);control.pending=prepared;return control;});
    }
    const same=pending.jobId===intent.jobId&&pending.method===intent.method&&pending.resultDigest===intent.resultDigest&&pending.args===expectedArgs;
    if(same)await onJournal(pending);
    validateNearRelayJournal(runtime,pending,signer);
    let outcome:NearTxOutcome|undefined;
    try{outcome=await nativeTxStatus(runtime,pending.hash,runtime.relayer);}catch(error){if(!(error instanceof NearError)||!['UNKNOWN_TRANSACTION','TIMEOUT_ERROR'].includes(error.code))throw error;}
    if(!outcome||!nativeTxComplete(outcome)){
      try{await nearRpc(runtime,'send_tx',{signed_tx_base64:pending.raw,wait_until:'NONE'});}catch(error){try{outcome=await nativeTxStatus(runtime,pending.hash,runtime.relayer);}catch{throw error;}}
      const end=Date.now()+65000;while(Date.now()<end){try{outcome=await nativeTxStatus(runtime,pending.hash,runtime.relayer);if(nativeTxComplete(outcome))break;}catch(error){if(!(error instanceof NearError)||!error.retryable)throw error;}await new Promise(resolve=>setTimeout(resolve,1200));}
    }
    if(!outcome||!nativeTxComplete(outcome))throw new NearError('uncertain','Checking the original NEAR save.',503,true);
    if(outcome.transaction?.hash!==pending.hash||outcome.transaction.signer_id!==runtime.relayer||outcome.transaction.receiver_id!==runtime.collection)throw new NearError('context','The NEAR relay receipt changed.');
    await updateV2Record<RelayControl>(store,key,()=>({}),control=>{if(control.lease?.id!==leaseId||control.pending?.hash!==pending!.hash)throw new NearError('busy','The NEAR save is being checked.',409,true);control.nonceFloor=(BigInt(control.nonceFloor||'0')>BigInt(pending!.nonce)?BigInt(control.nonceFloor!):BigInt(pending!.nonce)).toString();delete control.pending;delete control.lease;return control;});
    if(!same)throw new NearError('busy','An earlier NEAR save finished. Check this day again.',409,true);
    return {hash:pending.hash,outcome};
  }finally{await updateV2Record<RelayControl>(store,key,()=>({}),control=>{if(control.lease?.id===leaseId)delete control.lease;return control;}).catch(()=>{});}
}
