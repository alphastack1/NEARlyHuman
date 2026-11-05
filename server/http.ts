import { handleEvmApi } from './evm/http';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

/** Compatibility is confined to this HTTP boundary. Public NFT links and an
 * already-open deployed client can keep using their original API URLs. */
export async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/\.netlify\/functions\/api(?:\/|$)/, '/api/');
  if (path.length > 512) return json({ error: { code: 'not_found', message: 'This page has wandered off.' } }, 404);
  path = path.replace(/^\/api\/v2(?=\/|$)/, '/api/evm').replace(/^\/api\/near\/v2(?=\/|$)/, '/api/near');
  if (path === '/api/game/worlds') path = '/api/worlds';
  if (path === '/api/auth/challenge' || path === '/api/auth/verify') path = path.replace('/api/auth/', '/api/evm/auth/');
  url.pathname = path;
  const canonical = url.href === request.url ? request : new Request(url, request);
  if (path === '/api/explore/lives') return (await import('./discovery/http')).handleDiscoveryApi(canonical);
  if (path.startsWith('/api/near/')) return (await import('./near/http')).handleNearApi(canonical);
  if (path.startsWith('/api/evm/')) return handleEvmApi(canonical);
  if (path === '/api/worlds') {
    if (request.method !== 'GET') return json({ error: { code: 'method', message: 'Open this page again.' } }, 405);
    try { return json(await (await import('./game-worlds')).readGameWorlds()); }
    catch { return json({ error: { code: 'connection', message: 'Connection interrupted. Please try again.' } }, 503); }
  }
  return json({ error: { code: 'not_found', message: 'This page has wandered off.' } }, 404);
}
