import {decodeFunctionData,recoverTransactionAddress,type Hex} from 'viem';
import {nearlyHumanAbi} from '../src/chain/abi';
import {connection,pinnedRead} from './chain';
import {storage,update} from './storage';
import type {Reservation} from './admission';
import type {JobControl} from './jobs';

type Snapshot={number:bigint;hash:Hex;timestamp:bigint};
const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
const notFound=(error:unknown)=>['TransactionNotFoundError','TransactionReceiptNotFoundError'].includes((error as Error)?.name);

/** Metadata comes from the signed permit or its actual transaction, never from a day-zero guess. */
function permitMetadata(c:JobControl,value:unknown){
  const p=value as Record<string,unknown>|undefined;if(!p)return;
  if(p.id!==c.permitId||typeof p.player!=='string'||!same(p.player,c.player))return;
  const operation=Number(p.operation),expiry=Number(p.expiresAt);
  if(![0,1].includes(operation)||!Number.isSafeInteger(expiry)||expiry<=0)return;
  return {operation:operation===0?'mint' as const:'day' as const,permitExpiresAt:expiry};
}

async function metadata(c:JobControl,h:Reservation){
  let found=permitMetadata(c,h.quote?.permit),ownerNonce=c.ownerNonce;
  if(!found){
    const {client}=connection();
    try{
      const transaction=await client.getTransaction({hash:c.ownerTx});
      const decoded=decodeFunctionData({abi:nearlyHumanAbi,data:transaction.input});
      found=decoded.functionName==='mint'?permitMetadata(c,decoded.args[4]):decoded.functionName==='requestDay'?permitMetadata(c,decoded.args[1]):undefined;
      if(same(transaction.from,c.player))ownerNonce=transaction.nonce;
    }catch(error){if(!notFound(error))return;}
  }
  if(!found&&c.operation&&c.permitExpiresAt&&Number.isSafeInteger(c.permitExpiresAt))found={operation:c.operation,permitExpiresAt:c.permitExpiresAt};
  return found?{...found,ownerNonce}:undefined;
}

/** An orphaned signed finalize must not remain usable against a future reused token/request ID. */
async function relayNoncesRetired(c:JobControl,blockNumber:bigint){
  const {client,chain}=connection();const journals=[...(c.journals||[]),...(c.journal?[c.journal]:[])];
  for(const key of await storage().list(`control/relay-${chain.id}-`)){
    const outbox=await storage().get<{pending?:{jobId:string;nonce:number;raw:Hex}}>(key);
    // An outstanding outbox item must be reconciled before admission can be released.
    if(outbox?.value.pending?.jobId===c.requestId)return false;
  }
  for(const journal of journals){
    try{
      const sender=await recoverTransactionAddress({serializedTransaction:journal.raw as Parameters<typeof recoverTransactionAddress>[0]['serializedTransaction']});
      const nonce=await pinnedRead(()=>client.getTransactionCount({address:sender,blockNumber}));
      if(nonce<=journal.nonce)return false;
    }catch{return false;}
  }
  return true;
}

/** Reconcile a vanished acceptance. This never buys inference or invents an onchain failure. */
export async function recoverMissingAcceptance(c:JobControl,h:Reservation,snapshot?:Snapshot):Promise<JobControl>{
  const {client,address,chain}=connection();
  if(c.chainId!==chain.id||!same(c.collection,address)||h.requestId!==c.requestId||h.id!==c.permitId)return c;
  const block=snapshot||await client.getBlock();
  const request=await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'getRequest',args:[c.requestId],blockNumber:block.number}));
  if(request.status!==0){
    if(!c.orphanedAcceptance&&!c.retrySafe)return c;
    return update<JobControl>('jobs/'+c.requestId,()=>c,current=>{
      current.retrySafe=false;current.orphanedAcceptance=false;
      current.acceptanceConflict=h.status!=='accepted'||request.inputDigest!==current.inputDigest;
      current.phase='checking';current.updatedAt=Date.now();return current;
    });
  }
  const details=await metadata(c,h);let safe=false,confirmedNonce:number|undefined;
  // Automatic retirement is bounded to pre-settlement work. Prepared results or
  // a failure already being journaled require a separate nonce/context review.
  if(details&&!c.packet&&!c.failure&&block.timestamp>BigInt(details.permitExpiresAt)){
    const used=await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'usedPermits',args:[c.permitId],blockNumber:block.number}));
    if(!used){
      let orphan=false;
      try{
        const receipt=await client.getTransactionReceipt({hash:c.ownerTx});
        if(receipt.blockNumber<=block.number){
          const canonical=await client.getBlock({blockNumber:receipt.blockNumber});
          orphan=canonical.hash!==receipt.blockHash||receipt.status==='reverted';
        }
      }catch(error){if(notFound(error))orphan=true;else throw error;}
      if(orphan&&await relayNoncesRetired(c,block.number)){
        confirmedNonce=await pinnedRead(()=>client.getTransactionCount({address:c.player,blockNumber:block.number}));safe=true;
      }
    }
  }
  const verified=await client.getBlock({blockNumber:block.number});if(verified.hash!==block.hash)return c;
  return update<JobControl>('jobs/'+c.requestId,()=>c,current=>{
    if(current.inputDigest!==c.inputDigest)return current;
    // Invalidate a response still in flight before releasing its funded reservation.
    const sameJournals=current.journal?.hash===c.journal?.hash&&JSON.stringify((current.journals||[]).map(j=>j.hash))===JSON.stringify((c.journals||[]).map(j=>j.hash));
    const retrySafe=safe&&!current.packet&&!current.failure&&current.phase!=='recording_failure'&&sameJournals;
    if(!current.orphanedAcceptance||retrySafe&&!current.retrySafe){current.generation++;delete current.lease;}
    if(details)Object.assign(current,details);
    current.orphanedAcceptance=true;current.retrySafe=retrySafe;current.phase=retrySafe?'unaccepted':'checking';
    if(retrySafe)current.unacceptedProof={blockNumber:block.number.toString(),blockHash:block.hash,timestamp:Number(block.timestamp),confirmedNonce};
    else delete current.unacceptedProof;
    current.updatedAt=Date.now();return current;
  });
}

/** A fresh canonical permit may reuse an ID only after the old acceptance was safely retired. */
export async function mayReplaceRetiredAcceptance(c:JobControl,newPermitId:Hex){
  const proof=c.unacceptedProof;if(!proof||newPermitId===c.permitId||!c.operation||!c.permitExpiresAt||proof.timestamp<=c.permitExpiresAt)return false;
  const {client,address}=connection();
  try{
    const blockNumber=BigInt(proof.blockNumber),block=await client.getBlock({blockNumber});if(block.hash!==proof.blockHash)return false;
    const [request,used]=await pinnedRead(()=>Promise.all([
      client.readContract({address,abi:nearlyHumanAbi,functionName:'getRequest',args:[c.requestId],blockNumber}),
      client.readContract({address,abi:nearlyHumanAbi,functionName:'usedPermits',args:[c.permitId],blockNumber}),
    ]));
    return request.status===0&&!used&&await relayNoncesRetired(c,blockNumber);
  }catch{return false;}
}
