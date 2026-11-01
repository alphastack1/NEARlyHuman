import test from 'node:test';
import assert from 'node:assert/strict';
import { setEnvironmentContext } from '@netlify/blobs';

test('a warm durable store uses the current invocation credential', async () => {
  const originalFetch = globalThis.fetch;
  const originalRuntime = process.env.NEARLYHUMAN_RUNTIME;
  const originalContext = process.env.NETLIFY_BLOBS_CONTEXT;
  const seen: string[] = [];
  process.env.NEARLYHUMAN_RUNTIME = 'netlify';
  globalThis.fetch = async (input, init) => {
    seen.push(new Headers(input instanceof Request ? input.headers : init?.headers).get('authorization') || '');
    return new Response('{"value":1}', { headers: { etag: 'mock-etag', 'Content-Type': 'application/json' } });
  };
  const context = (token: string) => setEnvironmentContext({ siteID: 'mock-site', token, edgeURL: 'https://blobs.example.test', uncachedEdgeURL: 'https://blobs.example.test' });
  try {
    context('mock-invocation-a');
    const { storage } = await import('./storage');
    const warmStore = storage();
    await warmStore.get('check');
    context('mock-invocation-b');
    await warmStore.get('check');
    assert.deepEqual(seen, ['Bearer mock-invocation-a', 'Bearer mock-invocation-b']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalRuntime === undefined) delete process.env.NEARLYHUMAN_RUNTIME; else process.env.NEARLYHUMAN_RUNTIME = originalRuntime;
    if (originalContext === undefined) delete process.env.NETLIFY_BLOBS_CONTEXT; else process.env.NETLIFY_BLOBS_CONTEXT = originalContext;
  }
});
