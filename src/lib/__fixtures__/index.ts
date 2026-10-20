/**
 * Test support: read the recorded backend responses and serve them as `fetch`.
 *
 * The JSON in ./backend is written by scripts/capture_backend_fixtures.py from
 * the real AgentPulse API and chat service. Nothing here is hand-written, so a
 * test that passes against it is passing against the backend's actual shapes.
 */

import { readFileSync } from 'node:fs';
import { vi } from 'vitest';

export interface Recorded<T = any> {
  method: string;
  path: string;
  status: number;
  body: T;
}

export function fixture<T = any>(name: string): Recorded<T> {
  return JSON.parse(readFileSync(new URL(`./backend/${name}.json`, import.meta.url), 'utf8'));
}

export interface Call {
  method: string;
  path: string;
  headers: Headers;
  body?: string;
}

/**
 * A `fetch` that answers from recorded responses, keyed "METHOD /path" (query
 * strings are ignored). A request with no recording gets a 599 so a client that
 * calls something the backend was never recorded answering fails visibly.
 */
export function serve(routes: Record<string, Recorded>) {
  const calls: Call[] = [];
  const handler = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push({
      method,
      path: url.pathname,
      headers: new Headers(init?.headers),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    const hit = routes[`${method} ${url.pathname}`];
    if (!hit) {
      return new Response(JSON.stringify({ detail: `no recording for ${method} ${url.pathname}` }), { status: 599 });
    }
    return new Response(JSON.stringify(hit.body), {
      status: hit.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return { fetch: handler, calls };
}
