import { reconcile, runJob, validWorkerSecret } from '../../server/jobs';
export default async (request:Request) => {
  if(request.method!=='POST'||!validWorkerSecret(request.headers.get('x-nearlyhuman-worker')))return new Response(null,{status:403});
  const body=await request.json();if(body.task==='reconcile'){await reconcile();return new Response(null,{status:204});}
  if(typeof body.requestId!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(body.requestId))return new Response(null,{status:400});
  await runJob(body.requestId);return new Response(null,{status:204});
};
export const config={background:true};
