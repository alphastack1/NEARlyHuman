import { nearlyHumanAbi } from '../src/chain/abi';
import { roosterSvg, roosterTraits } from '../src/art/rooster';
import { serverConfig } from './config';
import { authenticate, challenge, session } from './auth';
import { chainOutcome, checkedRequest, connection, readRooster, readRoosters, ServiceError } from './chain';
import { issueQuote } from './admission';
import { acceptTransaction, getJob, wakeJob, getReplay, getOutcome } from './jobs';
import { StoreConflict } from './storage';

const json = (value: unknown, status = 200, extra: HeadersInit = {}) => new Response(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
const notFound = () => new ServiceError('This page has wandered off.', 'not_found', 404);

export async function handleApi(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/\.netlify\/functions\/api(?:\/|$)/, '/api/');
    if (path.length > 512) throw notFound();
    const post = request.method === 'POST';
    if (!post && request.method !== 'GET') return json({ error: { code: 'method', message: 'Please open this page again.' } }, 405);
    let body: any = {};
    if (post) {
      const origin = request.headers.get('origin');
      if (origin && !serverConfig().allowedOrigins.includes(origin)) throw new ServiceError('Open NEARlyHuman to continue.', 'origin', 403);
      if (!request.headers.get('content-type')?.includes('application/json')) throw new ServiceError('Please try again.', 'format', 415);
      const text = await request.text(); if (Buffer.byteLength(text) > 64_000) throw new ServiceError('Choose fewer supplies and try again.', 'size', 413);
      try { body = JSON.parse(text); if (!body || Array.isArray(body) || typeof body !== 'object') throw Error(); } catch { throw new ServiceError('Please try again.', 'format'); }
    }
    if (!post && path === '/api/config') {
      const { cfg, chain, address, client } = connection();
      const multiplier = await client.readContract({ address, abi: nearlyHumanAbi, functionName: 'gasMultiplier' });
      return json({ chainId: chain.id, chainName: chain.name, rpcUrl: cfg.rpcUrl, explorerUrl: chain.blockExplorers.default.url, collection: address, testnet: !!chain.testnet, model: cfg.model, multiplier });
    }
    if (post && path === '/api/auth/challenge') return json(await challenge(body.address, request.headers.get('origin') || url.origin, request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'local'));
    if (post && path === '/api/auth/verify') return json(await authenticate(body.address, body.id, body.signature));
    if (post && path === '/api/quote') return json(await issueQuote(body, session(request)!));
    if (post && path === '/api/accept') return json(await acceptTransaction(checkedRequest(body.transactionHash), session(request)!));
    if (post && path === '/api/wake') return json(await wakeJob(checkedRequest(body.requestId), session(request)!));
    if (!post && path === '/api/roosters') return json(await readRoosters(url.searchParams.get('owner') || '', BigInt(url.searchParams.get('cursor')?.match(/^\d{1,20}$/)?.[0] || '0')));
    let match: RegExpMatchArray | null;
    if (!post && (match = path.match(/^\/api\/rooster\/([1-9]\d{0,19})$/))) return json({ rooster: await readRooster(match[1]) });
    if (!post && (match = path.match(/^\/api\/job\/(0x[0-9a-fA-F]{64})$/))) return json(await getJob(checkedRequest(match[1]), session(request, false)));
    if (!post && (match = path.match(/^\/api\/replay\/([1-9]\d{0,19})$/))) {
      const dayText = url.searchParams.get('day');
      if (dayText && !/^[1-9]\d{0,8}$/.test(dayText)) throw notFound();
      return json(await getReplay(match[1], dayText ? Number(dayText) : undefined, session(request, false)));
    }
    if (!post && (match = path.match(/^\/api\/outcome\/([1-9]\d{0,19})$/))) return json(await getOutcome(match[1]));
    if (!post && (match = path.match(/^\/api\/nft\/(46630|4663)\/([1-9]\d{0,19})(\/image\.svg)?$/))) {
      if (Number(match[1]) !== serverConfig().chainId) throw notFound();
      const rooster = await readRooster(match[2]), s = rooster.state;
      if (match[3]) {
        const art = roosterSvg(s.seed, 256).replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>');
        return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64" shape-rendering="crispEdges"><rect width="64" height="64" fill="#eee9d5"/><rect x="3" y="3" width="58" height="58" fill="#182e3d"/><rect x="5" y="5" width="54" height="54" fill="#728661"/><ellipse cx="32" cy="52" rx="14" ry="3" fill="#526548"/><g transform="translate(16 12)">${art}</g></svg>`, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public,max-age=30' } });
      }
      const traits = roosterTraits(s.seed), origin = serverConfig().allowedOrigins.find(v => v.startsWith('https://')) || url.origin;
      return json({ name: `${s.name} #${rooster.id}`, description: 'A NEARlyHuman life. A rooster with its own routine, a home, and an onchain history.', image: `${origin}/api/nft/${match[1]}/${rooster.id}/image.svg`, external_url: `${origin}/?rooster=${rooster.id}`, attributes: [
        { trait_type: 'Life', value: s.alive ? 'Alive' : 'Remembered' }, { trait_type: 'Level', value: s.level }, { trait_type: 'Game day', value: s.day },
        ...Object.entries(s.stats).map(([k, v]) => ({ trait_type: k[0].toUpperCase() + k.slice(1), value: v })), { trait_type: 'Headgear', value: traits.headgear },
      ] }, 200, { 'Cache-Control': 'public,max-age=30' });
    }
    throw notFound();
  } catch (error) {
    if (error instanceof ServiceError) return json({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof StoreConflict) return json({ error: { code: 'busy', message: error.message } }, 409);
    // Provider/RPC details stay server-side; never forward credentials or raw transactions.
    console.error('API request failed', error instanceof Error ? error.name : 'UnknownError');
    return json({ error: { code: 'connection', message: 'Connection interrupted. Please try again.' } }, 503);
  }
}
