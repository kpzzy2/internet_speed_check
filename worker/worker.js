const ALLOWED_ORIGINS = [
  'https://internet-speed-check.apps.tossmini.com',
  'https://internet-speed-check.private-apps.tossmini.com',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // /ping — WebSocket 기반 지연시간 측정
    if (url.pathname === '/ping') {
      if (request.headers.get('Upgrade') === 'websocket') {
        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        server.addEventListener('message', () => server.send('pong'));
        return new Response(null, {
          status: 101,
          webSocket: client,
          headers: { 'Access-Control-Allow-Origin': origin },
        });
      }
      return new Response('pong', {
        headers: { ...cors, 'Cache-Control': 'no-store' },
      });
    }

    // /download?bytes=10000000 — 다운로드 측정
    if (url.pathname === '/download') {
      const bytes = parseInt(url.searchParams.get('bytes') || '1000000');
      const CHUNK = 256 * 1024; // 256KB 청크
      let sent = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (sent >= bytes) {
            controller.close();
            return;
          }
          const size = Math.min(CHUNK, bytes - sent);
          controller.enqueue(new Uint8Array(size));
          sent += size;
        },
      });
      return new Response(stream, {
        headers: {
          ...cors,
          'Content-Type': 'application/octet-stream',
          'Content-Length': bytes.toString(),
          'Content-Encoding': 'identity',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // /upload — 업로드 측정 (데이터를 받고 버림)
    if (url.pathname === '/upload' && request.method === 'POST') {
      await request.arrayBuffer(); // 읽기만 하고 버림
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};