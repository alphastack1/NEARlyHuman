import { dispatchReconciliation } from '../../server/worker';
// The scheduled invocation only dispatches; chain scans run under the 15-minute background limit.
export default async () => {await dispatchReconciliation();return new Response(null,{status:204});};
export const config={schedule:'*/5 * * * *'};
