const http = require('http');
const https = require('https');
const { URL } = require('url');

const LISTEN_PORT = Number(process.env.PROXY_PORT || 3001);
const TARGET_ORIGIN = process.env.PROXY_TARGET || 'http://dm.crocs.cn';
const FORWARD_PREFIX = '/webapi/pingpong';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,openid,timestamp,signature');
}

function normalizeRequestHeaders(headers, targetUrl) {
  const next = { ...headers };
  delete next.origin;
  delete next.referer;
  delete next.host;
  next.host = targetUrl.host;
  return next;
}

function copyResponseHeaders(proxyRes, res) {
  Object.keys(proxyRes.headers || {}).forEach((key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    const value = proxyRes.headers[key];
    if (value !== undefined) res.setHeader(key, value);
  });
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestPath = req.url || '/';
  if (!requestPath.startsWith(FORWARD_PREFIX)) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      code: 404,
      msg: `Only '${FORWARD_PREFIX}/*' is forwarded by this proxy.`,
    }));
    return;
  }

  const targetUrl = new URL(requestPath, TARGET_ORIGIN);
  const client = targetUrl.protocol === 'https:' ? https : http;
  const headers = normalizeRequestHeaders(req.headers, targetUrl);

  const proxyReq = client.request({
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: `${targetUrl.pathname}${targetUrl.search}`,
    headers,
  }, (proxyRes) => {
    copyResponseHeaders(proxyRes, res);
    setCorsHeaders(res);
    res.writeHead(proxyRes.statusCode || 502);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      code: 502,
      msg: 'Proxy request failed',
      detail: String(err && err.message ? err.message : err),
    }));
  });

  req.pipe(proxyReq);
});

server.listen(LISTEN_PORT, () => {
  console.log(`[dev-proxy] listening on http://127.0.0.1:${LISTEN_PORT}`);
  console.log(`[dev-proxy] target: ${TARGET_ORIGIN}`);
  console.log(`[dev-proxy] forwarding prefix: ${FORWARD_PREFIX}`);
});

