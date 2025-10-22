// index.js — hostname-only proxy for api.pokemontcg.io
const UPSTREAM = 'https://api.pokemontcg.io';
const REQ_TIMEOUT_MS = 25000; // 25s per request (cards can be slow)

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(), ...extra },
  });
}

async function withTimeout(doFetch, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout'), ms);
  try {
    const res = await doFetch(ctrl.signal);
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function timeIt(fn) {
  const t0 = Date.now();
  try {
    const res = await fn();
    const body = await res.text().catch(() => '');
    return { status: res.status, ms: Date.now() - t0, body: body.slice(0, 120) };
  } catch (e) {
    return { error: String(e), ms: Date.now() - t0 };
  }
}

const COMMON_HEADERS = {
  'Accept': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  'Origin': 'https://stackandtrack.app',
  'Referer': 'https://stackandtrack.app/',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    // Health/diag
    if (url.pathname === '/health') {
      return json({ ok: true, ts: Date.now(), v: '2.1' }, 200, { 'x-proxy': 'ptcg-proxy' });
    }
    if (url.pathname === '/echo-env') {
      return json({ hasKey: !!env.POKEMONTCG_API_KEY });
    }
    if (url.pathname === '/probe-ptcg') {
      // Minimal probe straight to /v2/sets
      return this._proxy('/v2/sets?pageSize=1', env);
    }
    if (url.pathname === '/diag-ptcg') {
      const path = '/v2/sets?pageSize=1';

      const noKey = await timeIt(() =>
        fetch(`${UPSTREAM}${path}`, { headers: COMMON_HEADERS })
      );

      const withKey = await timeIt(() =>
        fetch(`${UPSTREAM}${path}`, { headers: { ...COMMON_HEADERS, 'X-Api-Key': env.POKEMONTCG_API_KEY } })
      );

      return json({ noKey, withKey });
    }

    // NEW: quick proxy of a tiny cards query through our normal code path
    if (url.pathname === '/diag-cards') {
      return this._proxy('/v2/cards?q=name:pika*&pageSize=1&select=id,name', env);
    }

    // NEW: direct upstream probes (no key vs with key) for the same cards query
    if (url.pathname === '/diag-cards2') {
      const path = '/v2/cards?q=name:pika*&pageSize=1&select=id,name';

      const noKey = await timeIt(() =>
        fetch(`${UPSTREAM}${path}`, { headers: COMMON_HEADERS })
      );

      const withKey = await timeIt(() =>
        fetch(`${UPSTREAM}${path}`, { headers: { ...COMMON_HEADERS, 'X-Api-Key': env.POKEMONTCG_API_KEY } })
      );

      return json({ noKey, withKey });
    }

    // Only allow /v2/*
    if (request.method !== 'GET' || !url.pathname.startsWith('/v2/')) {
      return json({ error: 'Not found' }, 404);
    }

    const pathAndQuery = url.pathname + url.search;
    return this._proxy(pathAndQuery, env);
  },

  async _proxy(pathAndQuery, env) {
    const upstreamUrl = `${UPSTREAM}${pathAndQuery}`;
    console.log('FETCH →', upstreamUrl);

    try {
      const res = await withTimeout(
        (signal) =>
          fetch(upstreamUrl, {
            method: 'GET',
            headers: {
              ...COMMON_HEADERS,
              'X-Api-Key': env.POKEMONTCG_API_KEY,
            },
            // Cache successes to smooth upstream blips
            cf: { cacheTtl: 300, cacheEverything: true, cacheTtlByStatus: { '200-299': 300, '404': 30, '500-599': 0 } },
            signal,
          }),
        REQ_TIMEOUT_MS
      );

      const body = await res.text();
      console.log('← STATUS', res.status);

      return new Response(body, {
        status: res.status,
        headers: {
          'content-type': res.headers.get('content-type') ?? 'application/json',
          'cache-control': res.headers.get('cache-control') ?? 'public, max-age=300',
          ...cors(),
        },
      });
    } catch (e) {
      console.log('UPSTREAM FAIL:', String(e));
      return json({ error: 'upstream-timeout', detail: String(e) }, 504);
    }
  },
};