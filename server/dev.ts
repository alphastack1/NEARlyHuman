import http from 'node:http';
import { createServer as createViteServer, loadEnv } from 'vite';
import { handleApi } from './http';
import { loadLocalSecrets } from './local-secrets';
import { reconcile } from './jobs';
import { cleanAuth } from './auth';
import { devWallet } from './dev-wallet';

for (const [key, value] of Object.entries(loadEnv('development', process.cwd(), ''))) process.env[key] ??= value;
loadLocalSecrets();

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
const port = Number(process.env.PORT || 5173);
const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/') || req.url === '/__qa/wallet') {
    try {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 64_000) throw Error('Request too large'); chunks.push(Buffer.from(chunk)); }
      const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers as HeadersInit,
        body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : Buffer.concat(chunks) });
      const response = req.url === '/__qa/wallet' ? await devWallet(request) : await handleApi(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Please try again.' })); }
    return;
  }
  vite.middlewares(req, res);
});
server.listen(port, '127.0.0.1', () => console.log(`NEARlyHuman ready at http://127.0.0.1:${port}`));
let reconciling = false;
const timer = setInterval(() => { if (!reconciling) { reconciling = true; void reconcile().catch(() => {}).finally(() => { reconciling = false; }); } }, 45_000);
timer.unref();
void cleanAuth().catch(() => {});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { clearInterval(timer); void vite.close(); server.close(); });
