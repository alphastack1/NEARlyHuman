import type {V2ChoiceProgress} from '../../src/v2/public';
import {V2ContextError} from './context';

function clean(value:unknown):V2ChoiceProgress|undefined{
  if(!value||typeof value!=='object')return;const v=value as Record<string,unknown>;
  if(typeof v.id!=='string'||!/^[a-f0-9]{64}$/.test(v.id)||!['plan','routine','acute','focus'].includes(String(v.stage))||typeof v.label!=='string')return;
  const label=v.label.replace(/\s+/g,' ').trim();if(!label||label.length>80)return;
  if(v.stage==='plan'){if(v.slot!==undefined)return;return {id:v.id,stage:'plan',label};}
  if(!Number.isInteger(v.slot)||Number(v.slot)<1||Number(v.slot)>60)return;
  return {id:v.id,stage:v.stage as V2ChoiceProgress['stage'],label,slot:Number(v.slot)};
}
export function appendV2Progress(prior:V2ChoiceProgress[]|undefined,value:V2ChoiceProgress):V2ChoiceProgress[]{
  const next=clean(value);if(!next)throw new V2ContextError('context','The model progress needs another check.');
  const list=prior||[],existing=list.find(item=>item.id===next.id);
  if(existing){if(JSON.stringify(clean(existing))!==JSON.stringify(next))throw new V2ContextError('context','The recorded model choice changed.');return list;}
  if(list.length>=8)throw new V2ContextError('context','The model reply budget changed.');return [...list,next];
}
/** Explicit whitelist: private prompts, usage, keys, leases and answer objects
 * never become an API field merely because the durable job contains them. */
export function publicV2Progress(value:unknown):V2ChoiceProgress[]|undefined{
  if(!Array.isArray(value))return;const out:V2ChoiceProgress[]=[];
  for(const item of value.slice(0,8)){const safe=clean(item);if(safe&&!out.some(row=>row.id===safe.id))out.push(safe);}
  return out.length?out:undefined;
}
