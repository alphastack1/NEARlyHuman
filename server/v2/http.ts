import { BaseError, ContractFunctionRevertedError } from 'viem';
import { V2ContextError } from './context';
import { readV2PublicConfig, readV2PublicDay, readV2PublicLife, readV2PublicReplay, v2NftMetadata, V2PublicError } from './views';
import { v2LifePortrait } from './portrait';

const json = (value: unknown, status = 200, cache = 'no-store') => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });
function world(url: URL, required = false) {
  const chain = url.searchParams.get('chainId'), collection = url.searchParams.get('collection');
  if (!required && chain === null && collection === null) return;
  if (!chain || !/^\d{1,6}$/.test(chain) || !collection || !/^0x[0-9a-f]{40}$/i.test(collection)) throw new V2PublicError('not_found', 'Choose the exact life to visit.');
  return { chainId: Number(chain), collection };
}
export async function handleV2PublicApi(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return json({ error: { code: 'method', message: 'Open this page again.' } }, 405);
    const url = new URL(request.url), path = url.pathname.replace(/^\/\.netlify\/functions\/api(?:\/|$)/, '/api/');
    if (path === '/api/v2/config') return json(await readV2PublicConfig());
    let match = path.match(/^\/api\/v2\/rooster\/([1-9]\d{0,77})$/);
    if (match) return json({ life: await readV2PublicLife(match[1]!, world(url)) });
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
  } catch (error) {
    if (error instanceof V2PublicError) return json({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof V2ContextError) return json({ error: { code: error.code, message: error.message } }, error.code === 'connection' ? 503 : 409);
    if (error instanceof BaseError) {
      const reverted = error.walk(e => e instanceof ContractFunctionRevertedError);
      if (reverted instanceof ContractFunctionRevertedError && reverted.data?.errorName === 'ERC721NonexistentToken') return json({ error: { code: 'not_found', message: 'No rooster has that number.' } }, 404);
    }
    return json({ error: { code: 'connection', message: 'Checking this home. Try again shortly.' } }, 503);
  }
}
