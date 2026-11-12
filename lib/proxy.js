// Stateless pass-through for GitHub Device Flow. Forwards two requests, adds CORS,
// stores nothing and logs nothing. Only the public client ID below is accepted.
const CLIENT_ID = 'Ov23liMmeOuKjesNv0IJ';
const ALLOWED_ORIGINS = ['https://dishaint.com', 'https://www.dishaint.com'];
const ALLOWED_KEYS = {
  device: ['client_id', 'scope'],
  token: ['client_id', 'device_code', 'grant_type'],
};
const MAX_BODY_BYTES = 4096;

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function forward(req, res, kind, githubUrl) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return sendJson(res, 403, { error: 'origin_not_allowed' });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch (e) {
    return sendJson(res, 413, { error: 'body_too_large' });
  }

  // Keep only the fields this step needs, and only for our own app.
  const incoming = new URLSearchParams(raw);
  const out = new URLSearchParams();
  for (const key of ALLOWED_KEYS[kind]) {
    if (incoming.has(key)) out.set(key, incoming.get(key));
  }
  if (out.get('client_id') !== CLIENT_ID) {
    return sendJson(res, 400, { error: 'bad_client_id' });
  }

  try {
    const upstream = await fetch(githubUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: out.toString(),
    });
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(text);
  } catch (e) {
    return sendJson(res, 502, { error: 'upstream_failed' });
  }
}

module.exports = { forward };
