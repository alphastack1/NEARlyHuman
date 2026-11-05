import type {ChoiceProgress} from '../../src/chain/evm-types';
import {EvmContextError} from './context';

function clean(value:unknown):ChoiceProgress|undefined{
  if(!value||typeof value!=='object')return;const v=value as Record<string,unknown>;
  if(typeof v.id!=='string'||!/^[a-f0-9]{64}$/.test(v.id)||!['plan','routine','acute','focus'].includes(String(v.stage))||typeof v.label!=='string')return;
  const label=v.label.replace(/\s+/g,' ').trim();if(!label||label.length>80)return;
  if(v.stage==='plan'){if(v.slot!==undefined)return;return {id:v.id,stage:'plan',label};}
  if(!Number.isInteger(v.slot)||Number(v.slot)<1||Number(v.slot)>60)return;
  return {id:v.id,stage:v.stage as ChoiceProgress['stage'],label,slot:Number(v.slot)};
}
export function appendChoiceProgress(prior:ChoiceProgress[]|undefined,value:ChoiceProgress):ChoiceProgress[]{
  const next=clean(value);if(!next)throw new EvmContextError('context','The model progress needs another check.');
  const list=prior||[],existing=list.find(item=>item.id===next.id);
  if(existing){if(JSON.stringify(clean(existing))!==JSON.stringify(next))throw new EvmContextError('context','The recorded model choice changed.');return list;}
  if(list.length>=8)throw new EvmContextError('context','The model reply budget changed.');return [...list,next];
}
/** Explicit whitelist: private prompts, usage, keys, leases and answer objects
 * never become an API field merely because the durable job contains them. */
export function publicChoiceProgress(value:unknown):ChoiceProgress[]|undefined{
  if(!Array.isArray(value))return;const out:ChoiceProgress[]=[];
  for(const item of value.slice(0,8)){const safe=clean(item);if(safe&&!out.some(row=>row.id===safe.id))out.push(safe);}
  return out.length?out:undefined;
}
