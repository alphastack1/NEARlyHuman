const publicKeys=new Set(['NEARLYHUMAN_V2_RUNTIME_JSON','NEARLYHUMAN_V2_RPC_URL','NEARLYHUMAN_V2_GUEST_ID','NEARLYHUMAN_V2_GUEST_DAY','NEARLYHUMAN_NEAR_RUNTIME_JSON']);
export interface CutoverPublicEnvEntry {key:string;is_secret:boolean;scopes:string[];values:Array<{context:string;context_parameter?:string;value?:string}>}

/** Match the official CLI: all-context replacement uses updateEnvVar (PUT),
 * while a production value uses setEnvVarValue (PATCH). No other contexts or
 * variable metadata may be silently discarded by the full replacement. */
export function publicEnvUpdateRequest(entry:CutoverPublicEnvEntry,target:string){
  if(!publicKeys.has(entry.key)||entry.is_secret||entry.scopes.length!==1||entry.scopes[0]!=='functions'||entry.values.length!==1||entry.values[0]!.context_parameter||!['all','production'].includes(entry.values[0]!.context))throw Error('Review the exact public variable before choosing its update operation.');
  if(entry.values[0]!.context==='all')return {method:'PUT' as const,body:{key:entry.key,is_secret:false,scopes:[...entry.scopes],values:[{context:'all',value:target}]}};
  return {method:'PATCH' as const,body:{context:'production',value:target}};
}
