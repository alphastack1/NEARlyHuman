import { validWorkerSecret } from '../../server/worker';
import { reconcileEvmService, runEvmQueueJob } from '../../server/evm/service';
export default async (request:Request) => {
  if(request.method!=='POST'||!validWorkerSecret(request.headers.get('x-nearlyhuman-worker')))return new Response(null,{status:403});
  let body;try{body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return new Response(null,{status:400});}
  if(body.task==='reconcile'){
    // Each world reconciles independently. A temporary outage on one chain must
    // not strand accepted work on the other or reopen any financial ledger.
    const work:Promise<unknown>[]=[reconcileEvmService()];
    if(process.env.NEARLYHUMAN_NEAR_ENABLED==='1'&&process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON)work.push(import('../../server/near/service').then(module=>module.reconcileNearService()));
    await Promise.allSettled(work);return new Response(null,{status:204});
  }
  if(body.version===2){
    if(typeof body.jobId!=='string')return new Response(null,{status:400});
    if(body.jobId.startsWith('near/v2/jobs/'))await(await import('../../server/near/service')).runNearQueueJob(body.jobId);
    else await runEvmQueueJob(body.jobId);
    return new Response(null,{status:204});
  }
  return new Response(null,{status:400});
};
export const config={background:true};
