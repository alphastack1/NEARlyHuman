import {keccak256,toHex,type Hex} from 'viem';
import {decodeState,kitItems} from '../../src/v2';
import {v2DecisionConfig} from '../v2/preparation';
import {base58Decode} from './encoding';
import {checkNearAccount,nearView,verifyNearRuntime,nearRuntime} from './rpc';
import {NearError,type NearFrozenInput,type NearRequest,type NearLife,type NearRuntime,type NearBlock} from './types';

const uint=(value:unknown,bits:number):bigint=>{if(typeof value!=='string'||!/^(0|[1-9]\d*)$/.test(value)||value.length>78||BigInt(value)>=1n<<BigInt(bits))throw new NearError('context','The accepted NEAR day needs another check.');return BigInt(value);};
const hex32=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{64}$/.test(value);
export const nearInputHash=(value:NearFrozenInput):Hex=>keccak256(toHex(JSON.stringify(value)));
export function validateNearFrozenInput(value:NearFrozenInput):NearFrozenInput{
  const input=structuredClone(value),r=input.runtime;
  if(input.version!==2||r.networkId!=='near-testnet'||r.network!=='testnet'||!hex32(r.rulesHash)||!hex32(r.decisionConfig)||r.decisionConfig!==v2DecisionConfig(r.rulesHash)||!hex32(input.requestId)||!hex32(input.daySeed)||!hex32(input.baseHash)||!Number.isInteger(input.baseRevision)||input.baseRevision<0||input.baseRevision>0xffffffff||!Number.isInteger(input.day)||input.day<1||input.day>0xffffffff||typeof input.shipping!=='boolean')throw new NearError('context','The accepted NEAR day needs another check.');
  checkNearAccount(r.collection);checkNearAccount(r.relayer);checkNearAccount(input.player);base58Decode(r.codeHash,32);base58Decode(input.acceptedBlockHash,32);
  if(uint(input.tokenId,64)===0n||uint(input.deadline,64)!==uint(input.acceptedAt,64)+900n||uint(input.reservedReward,128)>136000000n||!input.shipping&&BigInt(input.reservedReward)!==0n)throw new NearError('context','The accepted NEAR day needs another check.');
  uint(input.pressure,128);uint(input.acceptedBlock,64);kitItems(uint(input.kitMask,64));
  if(keccak256(input.base)!==input.baseHash)throw new NearError('context','The accepted NEAR save changed.');
  const state=decodeState(input.base);if(!state.alive||state.day+1!==input.day||state.day!==state.level)throw new NearError('context','This NEAR life cannot advance that day.');return input;
}
export function freezeNearInput(runtime:NearRuntime,q:NearRequest,life:NearLife,block:NearBlock):NearFrozenInput{
  if(q.status!==1||q.token_id!==life.token_id||q.player!==life.owner_id||q.base_revision!==life.revision||keccak256(life.state)!==q.base_hash)throw new NearError('context','The accepted NEAR save changed.');
  const {rpcUrl,...identity}=runtime;
  return validateNearFrozenInput({version:2,runtime:structuredClone(identity),requestId:q.request_id,tokenId:q.token_id,player:q.player,baseRevision:q.base_revision,day:q.day,kitMask:q.kit_mask,shipping:q.shipping,acceptedAt:q.accepted_at,deadline:q.deadline,daySeed:q.day_seed,base:life.state,baseHash:q.base_hash,pressure:q.pressure,reservedReward:q.reserved_reward,acceptedBlock:block.height,acceptedBlockHash:block.hash});
}
export function sameNearRequest(input:NearFrozenInput,q:NearRequest):boolean{
  return q.request_id===input.requestId&&q.token_id===input.tokenId&&q.player===input.player&&q.base_revision===input.baseRevision&&q.day===input.day&&q.kit_mask===input.kitMask&&q.shipping===input.shipping&&q.accepted_at===input.acceptedAt&&q.deadline===input.deadline&&q.day_seed===input.daySeed&&q.decision_config===input.runtime.decisionConfig&&q.base_hash===input.baseHash&&q.pressure===input.pressure&&q.reserved_reward===input.reservedReward;
}
export async function recheckNearInput(input:NearFrozenInput){
  validateNearFrozenInput(input);const runtime=nearRuntime(),{rpcUrl,...identity}=runtime;
  if(JSON.stringify(identity)!==JSON.stringify(input.runtime))throw new NearError('context','The NEAR game identity changed.');
  const {block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:input.requestId},block);
  if(!q||!sameNearRequest(input,q))throw new NearError('context','The accepted NEAR day changed.');
  if(q.status!==1)throw new NearError('terminal','This NEAR day is already recorded.');
  if(BigInt(block.timestamp)>BigInt(input.deadline))throw new NearError('expired','This attempt expired. The saved home is unchanged.');
  const life=await nearView<NearLife|null>(runtime,'life',{token_id:input.tokenId},block);
  if(!life||life.owner_id!==input.player||life.revision!==input.baseRevision||life.state!==input.base||life.pending_request!==input.requestId)throw new NearError('context','The accepted NEAR save changed.');
  return {q,block};
}
