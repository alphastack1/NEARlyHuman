import { DiscoveryError } from './reader';
import { parseDirectoryQuery, readPublicLifeDirectory } from './service';

export async function handleDiscoveryApi(request: Request): Promise<Response> {
  const json = (value: unknown, status = 200, retry?: string) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...(retry ? { 'Retry-After': retry } : {}) } });
  if (request.method !== 'GET') return json({ error: { code: 'method', message: 'Open this collection again.' } }, 405);
  try {
    const url = new URL(request.url); if (url.search.length > 700) throw new DiscoveryError('format', 'Choose a collection to visit.', 400);
    return json(await readPublicLifeDirectory(parseDirectoryQuery(url.searchParams)));
  } catch (error) {
    if (error instanceof DiscoveryError) return json({ error: { code: error.code, message: error.message } }, error.status, error.status === 503 ? '5' : undefined);
    // The RPC endpoint, raw provider failure and deployment internals stay private.
    return json({ error: { code: 'connection', message: 'Could not open these lives. Try again.' } }, 503, '5');
  }
}
