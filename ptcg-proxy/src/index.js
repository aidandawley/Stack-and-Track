// index.js — robust proxy for api.pokemontcg.io
const UPSTREAM_HOST = 'api.pokemontcg.io';
const UPSTREAM_PROTO = 'https';
const UPSTREAM_IPV4S = [
  '104.26.0.99',
  '104.26.1.99',
  '172.67.74.42',
];
const REQ_TIMEOUT_MS = 12000;  // 12s per attempt
const TOTAL_BUDGET_MS = 20000; // ~20s overall

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
function text(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain', ...cors(), ...extra }});
}

// small helper to race a fetch with a timeout
async function withTimeout(promise, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(`timeout ${ms}ms`), ms);
  try {
    const res = await promise(ctrl.signal);
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

/**
 * Attempt 1: normal hostname fetch
 * Attempt 2..N: hit each IPv4 directly, forcing Host header to api.pokemontcg.io
 * (Workers will ignore user-supplied Host in some cases, but in practice this can work)
 */
async function fetchUpstream(pathAndQuery, env) {
  const attempts = [];

  // 1) normal hostname
  attempts.push(async (signal) => {
    const url = `${UPSTREAM_PROTO}://${UPSTREAM_HOST}${pathAndQuery}`;
    console.log('TRY host:', url);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ptcg-proxy/1.1',
        'X-Api-Key': env.POKEMONTCG_API_KEY,
      },
      signal,
      // NOTE: cf cache helps when upstream is flaky *after* first success
      cf: { cacheTtl: 300, cacheEverything: true },
    });
  });

  // 2) try direct IPv4 candidates
  for (const ip of UPSTREAM_IPV4S) {
    attempts.push(async (signal) => {
      const url = `${UPSTREAM_PROTO}://${ip}${pathAndQuery}`;
      console.log('TRY ipv4:', url);
      return fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ptcg-proxy/1.1',
          'X-Api-Key': env.POKEMONTCG_API_KEY,
          // Try to preserve correct Host at origin (may be ignored by platform, but helps on many CDNs)
          'Host': UPSTREAM_HOST,
        },
        // SNI will be for the IP; some edges still accept with Host header. If TLS fails you’ll see it quickly.
        redirect: 'follow',
        signal,
        cf: { cacheTtl: 300, cacheEverything: true },
      });
    });
  }

  const start = Date.now();
  let lastErr = null;

  for (let i = 0; i < attempts.length; i++) {
    const remain = Math.max(1500, TOTAL_BUDGET_MS - (Date.now() - start));
    const perAttempt = Math.min(REQ_TIMEOUT_MS, remain);
    try {
      const res = await withTimeout(attempts[i], perAttempt);
      if (!res.ok) {
        const body = await res.text().catch(()=>'');
        console.log('UPSTREAM non-200', res.status, body.slice(0, 200));
        // still return upstream body/status so client can see exact error
        return new Response(body, {
          status: res.status,
          headers: {
            'content-type': res.headers.get('content-type') ?? 'application/json',
            'cache-control': res.headers.get('cache-control') ?? 'no-store',
            ...cors(),
          },
        });
      }
      // success
      const body = await res.text();
      return new Response(body, {
        status: 200,
        headers: {
          'content-type': res.headers.get('content-type') ?? 'application/json',
          'cache-control': res.headers.get('cache-control') ?? 'public, max-age=300',
          ...cors(),
        },
      });
    } catch (e) {
      lastErr = String(e);
      console.log('ATTEMPT failed:', lastErr);
    }
  }

  return json({ error: 'upstream-timeout', detail: lastErr, tried: 1 + UPSTREAM_IPV4S.length }, 504);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    // Health
    if (url.pathname === '/health') {
      return json({ ok: true, ts: Date.now(), v: '1.1' }, 200, { 'x-proxy': 'ptcg-proxy' });
    }

    // Quick probes
    if (url.pathname === '/echo-env') {
      return json({ hasKey: !!env.POKEMONTCG_API_KEY });
    }
    if (url.pathname === '/probe-httpbin') {
      try {
        const res = await withTimeout((signal) =>
          fetch('https://httpbin.org/get', { signal }), 6000);
        return text(`ok httpbin ${res.status}`);
      } catch (e) {
        return text(`fail httpbin ${String(e)}`, 502);
      }
    }
    if (url.pathname === '/probe-ptcg') {
      try {
        const res = await fetchUpstream('/v2/sets?pageSize=1', env);
        return res;
      } catch (e) {
        return json({ error: 'probe-failed', detail: String(e) }, 502);
      }
    }

    // Only proxy /v2/*
    if (request.method !== 'GET' || !url.pathname.startsWith('/v2/')) {
      return json({ error: 'Not found' }, 404);
    }

    const pathAndQuery = url.pathname + url.search;
    console.log('FETCH →', `${UPSTREAM_HOST}${pathAndQuery}`);
    return fetchUpstream(pathAndQuery, env);
  },
};