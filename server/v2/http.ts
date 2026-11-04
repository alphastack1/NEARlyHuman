import { BaseError, ContractFunctionRevertedError } from 'viem';
import { V2ContextError } from './context';
import { readV2PublicConfig, readV2PublicDay, readV2PublicLife, readV2PublicReplay, readV2PublicLives, readV2PublicDays, readV2PublicRequest, readV2PublicGuest, v2NftMetadata, V2PublicError } from './views';
import { v2LifePortrait } from './portrait';
import { session, sessionDetails } from '../auth';
import { v2ViewConnection } from './views';
import { serverConfig } from '../config';
import { checkedRequest, ServiceError } from '../chain';
import { StoreConflict } from '../storage';
import { V2BudgetError } from './budget';
import { acceptV2OwnerDay, getV2OwnerJob, quoteV2OwnerDay, wakeV2OwnerDay } from './service';
import { v2RuntimeScope, withV2RuntimeScope } from './runtime-scope';

const json = (value: unknown, status = 200, cache = 'no-store') => new Response(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });
function world(url: URL, required = false) {
  const network=url.searchParams.get('networkId');
  if(network!==null&&network!=='robinhood-testnet')throw new V2PublicError('not_found','Choose the exact life to visit.');
  const chain = url.searchParams.get('chainId'), collection = url.searchParams.get('collection');
  if (!required && chain === null && collection === null) return;
  if (!chain || !/^\d{1,6}$/.test(chain) || !collection || !/^0x[0-9a-f]{40}$/i.test(collection)) throw new V2PublicError('not_found', 'Choose the exact life to visit.');
  return { chainId: Number(chain), collection };
}
export async function handleV2Api(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url), path = url.pathname.replace(/^\/\.netlify\/functions\/api(?:\/|$)/, '/api/');
    if (path.length > 512) throw new V2PublicError('not_found', 'This page has wandered off.');
    // New multi-world clients bind every request, including quotes/payments,
    // to an exact served world. Existing RH clients without a scope retain the
    // current-world API; an explicit foreign scope must never be reinterpreted.
    const requestedWorld=world(url);
    let scope;
    try { scope=v2RuntimeScope(requestedWorld?.collection); }
    catch(error){if(requestedWorld)throw new V2PublicError('not_found','Choose the exact life to visit.');throw error;}
    if(requestedWorld&&requestedWorld.chainId!==scope.runtime.chainId)throw new V2PublicError('not_found','Choose the exact life to visit.');
    return await withV2RuntimeScope(scope, async()=>{
    if (request.method === 'POST') {
      if(path==='/api/v2/quote'&&!scope.admissionsEnabled)throw new V2PublicError('archived','This collection is resting. Open a new home to start another day.',409);
      const origin = request.headers.get('origin');
      if (origin && !serverConfig().allowedOrigins.includes(origin)) throw new ServiceError('Open NEARlyHuman to continue.', 'origin', 403);
      if (!request.headers.get('content-type')?.includes('application/json')) throw new ServiceError('Please try again.', 'format', 415);
      if (Number(request.headers.get('content-length')) > 64_000) throw new ServiceError('Choose fewer supplies and try again.', 'size', 413);
      const text = await request.text();
      if (Buffer.byteLength(text) > 64_000) throw new ServiceError('Choose fewer supplies and try again.', 'size', 413);
      let body: Record<string, unknown>;
      try { body = JSON.parse(text); if (!body || Array.isArray(body) || typeof body !== 'object') throw Error(); } catch { throw new ServiceError('Please try again.', 'format'); }
      const player = session(request)!;
      if (path === '/api/v2/quote') return json(await quoteV2OwnerDay(player, body as { tokenId: string; kitMask: string; shipping?: boolean }));
      if (path === '/api/v2/accept') return json(await acceptV2OwnerDay(checkedRequest(body.transactionHash), player, body.requestId === undefined ? undefined : checkedRequest(body.requestId)));
      if (path === '/api/v2/wake') return json(await wakeV2OwnerDay(checkedRequest(body.requestId), player));
      throw new V2PublicError('not_found', 'This page has wandered off.');
    }
    if (request.method !== 'GET') return json({ error: { code: 'method', message: 'Open this page again.' } }, 405);
    if (path === '/api/v2/session') {
      const verified = sessionDetails(request), { runtime } = v2ViewConnection();
      if (verified.chainId !== runtime.chainId) throw new ServiceError('Connect your wallet to continue.', 'session', 401);
      return json({ ...verified, collection: runtime.collection });
    }
    if (path === '/api/v2/config') return json(await readV2PublicConfig());
    if(path==='/api/v2/guest')return json(await readV2PublicGuest());
    if(path==='/api/v2/lives')return json(await readV2PublicLives(url.searchParams.get('owner')||'',url.searchParams.get('cursor')||'0'));
    const pending=path.match(/^\/api\/v2\/request\/(0x[0-9a-f]{64})$/i);if(pending)return json(await readV2PublicRequest(checkedRequest(pending[1])));
    const job = path.match(/^\/api\/v2\/job\/(0x[0-9a-f]{64})$/i);
    if (job) return json(await getV2OwnerJob(checkedRequest(job[1]), session(request)!));
    let match = path.match(/^\/api\/v2\/rooster\/([1-9]\d{0,77})$/);
    if (match) return json({ life: await readV2PublicLife(match[1]!, world(url)) });
    match=path.match(/^\/api\/v2\/days\/([1-9]\d{0,77})$/);
    if(match){const before=url.searchParams.get('before');if(before!==null&&!/^[1-9]\d{0,9}$/.test(before))throw new V2PublicError('not_found','That day could not be found.');return json(await readV2PublicDays(match[1]!,before?Number(before):undefined,world(url)));}
    match = path.match(/^\/api\/v2\/day\/([1-9]\d{0,77})\/([1-9]\d{0,9})$/);
    if (match) return json(await readV2PublicDay(match[1]!, Number(match[2]), world(url)));
    match = path.match(/^\/api\/v2\/replay\/([1-9]\d{0,77})$/);
    if (match) {
      const day = url.searchParams.get('day');
      if (day !== null && !/^[1-9]\d{0,9}$/.test(day)) throw new V2PublicError('not_found', 'That day could not be found.');
      return json(await readV2PublicReplay(match[1]!, day === null ? undefined : Number(day), world(url)));
    }
    match = path.match(/^\/api\/v2\/nft\/([1-9]\d{0,77})(\/image\.svg)?$/);
    if (match) {
      const life = await readV2PublicLife(match[1]!, world(url, true));
      if (match[2]) return new Response(v2LifePortrait(life), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public,max-age=30' } });
      return json(v2NftMetadata(life, 'https://nearlyhuman.netlify.app'), 200, 'public,max-age=30');
    }
    throw new V2PublicError('not_found', 'This page has wandered off.');
    });
  } catch (error) {
    if (error instanceof ServiceError) return json({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof StoreConflict) return json({ error: { code: 'busy', message: 'This day is being checked. Try again shortly.' } }, 409);
    if (error instanceof V2BudgetError) return json({ error: { code: error.code, message: error.code === 'capacity' ? 'Preparation is resting. Try again shortly.' : 'This preparation needs another check.' } }, 503);
    if (error instanceof V2PublicError) return json({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof V2ContextError) return json({ error: { code: error.code, message: error.message } }, error.code === 'connection' ? 503 : 409);
    if (error instanceof BaseError) {
      const reverted = error.walk(e => e instanceof ContractFunctionRevertedError);
      if (reverted instanceof ContractFunctionRevertedError && reverted.data?.errorName === 'ERC721NonexistentToken') return json({ error: { code: 'not_found', message: 'No rooster has that number.' } }, 404);
    }
    return json({ error: { code: 'connection', message: 'Checking this home. Try again shortly.' } }, 503);
  }
}
