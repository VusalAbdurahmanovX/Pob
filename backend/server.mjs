import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createStore } from './store.mjs';
import { getDemoAccounts, getDemoOverview, getDemoTrades, getDemoPayouts } from './demo.mjs';

const fail = (statusCode, code, message) => Object.assign(new Error(message), { statusCode, code });
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
function equal(a, b) { if (typeof a !== 'string' || typeof b !== 'string') return false; const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
function cookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => { const i = part.indexOf('='); return i < 0 ? [] : [part.slice(0, i).trim(), part.slice(i + 1).trim()]; }).filter(part => part.length === 2));
}
async function jsonBody(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send application/json.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 16384) throw fail(413, 'BODY_TOO_LARGE', 'Request body is too large.'); chunks.push(chunk); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString()); if (!body || Array.isArray(body) || typeof body !== 'object') throw Error(); return body; }
  catch { throw fail(400, 'INVALID_JSON', 'Send a valid JSON object.'); }
}

export function createApp({ store = createStore(), allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'], secureCookies = false, rateLimit = 30, rateWindowMs = 15 * 60 * 1000, onError = console.error } = {}) {
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length || allowedOrigins.some(origin => { try { return !['http:', 'https:'].includes(new URL(origin).protocol) || new URL(origin).origin !== origin; } catch { return true; } })) throw Error('Configure exact HTTP(S) frontend origins.');
  const sessionName = secureCookies ? '__Host-bp_session' : 'bp_session';
  const csrfName = secureCookies ? '__Host-bp_csrf' : 'bp_csrf';
  const flags = `Path=/; SameSite=Lax${secureCookies ? '; Secure' : ''}`;
  const attempts = new Map();
  function throttle(ip) {
    const now = Date.now();
    for (const [key, item] of attempts) if (item.reset <= now) attempts.delete(key);
    const item = attempts.get(ip) || { count: 0, reset: now + rateWindowMs };
    if (attempts.size >= 10000 && !attempts.has(ip)) throw fail(429, 'RATE_LIMITED', 'Too many requests. Try again later.');
    item.count++; attempts.set(ip, item);
    if (item.count > rateLimit) throw fail(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
  }
  const server = createServer(async (req, res) => {
    const requestId = randomBytes(8).toString('hex');
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) throw fail(403, 'ORIGIN_DENIED', 'This origin is not allowed.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Vary', 'Origin'); }
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token'); res.writeHead(204); res.end(); return; }
      const url = new URL(req.url, 'http://localhost');
      const jar = cookies(req.headers.cookie);
      if (!safeMethods.has(req.method)) {
        if (!origin || !allowedOrigins.includes(origin)) throw fail(403, 'ORIGIN_DENIED', 'A trusted Origin header is required.');
        if (!jar[csrfName] || !/^[a-f0-9]{64}$/.test(jar[csrfName]) || !equal(jar[csrfName], req.headers['x-csrf-token'])) throw fail(403, 'CSRF_FAILED', 'Refresh your session security token and try again.');
      }
      if (req.method === 'GET' && url.pathname === '/api/health') return reply(200, { ok: true });
      if (req.method === 'GET' && url.pathname === '/api/auth/csrf') {
        const token = randomBytes(32).toString('hex');
        res.setHeader('Set-Cookie', `${csrfName}=${token}; ${flags}; Max-Age=3600`);
        return reply(200, { csrfToken: token });
      }
      if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(url.pathname)) {
        throttle(req.socket.remoteAddress);
        const body = await jsonBody(req);
        const registering = url.pathname.endsWith('/register');
        // Validate login inputs before invoking the expensive password KDF.
        if (!registering && (typeof body.email !== 'string' || body.email.length > 254 || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128 || Buffer.byteLength(body.password) > 512)) throw fail(400, 'VALIDATION_ERROR', 'Enter a valid email and password.');
        const user = registering ? await store.register(body) : await store.authenticate(body);
        if (!user) throw fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
        const prior = jar[sessionName]; if (prior) await store.deleteSession(prior);
        const session = await store.createSession(user.id);
        const maxAge = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
        res.setHeader('Set-Cookie', `${sessionName}=${session.token}; ${flags}; HttpOnly; Max-Age=${maxAge}`);
        return reply(registering ? 201 : 200, { user, expiresAt: session.expiresAt });
      }
      if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
        if (jar[sessionName]) await store.deleteSession(jar[sessionName]);
        res.setHeader('Set-Cookie', [`${sessionName}=; ${flags}; HttpOnly; Max-Age=0`, `${csrfName}=; ${flags}; Max-Age=0`]);
        return reply(200, { ok: true });
      }
      const session = jar[sessionName] && /^[A-Za-z0-9_-]{43}$/.test(jar[sessionName]) ? await store.getSession(jar[sessionName]) : null;
      if (url.pathname === '/api/auth/me' || url.pathname.startsWith('/api/dashboard/')) {
        if (!session) throw fail(401, 'UNAUTHENTICATED', 'Sign in to continue.');
        if (req.method !== 'GET') throw fail(405, 'METHOD_NOT_ALLOWED', 'Use GET for this endpoint.');
        if (url.pathname === '/api/auth/me') return reply(200, { user: session.user, expiresAt: session.expiresAt });
        const userId = session.user.id;
        if (url.pathname === '/api/dashboard/accounts') return reply(200, { demo: true, items: getDemoAccounts(userId) });
        const accountId = url.searchParams.get('accountId') || getDemoAccounts(userId)[0].id;
        if (url.pathname === '/api/dashboard/overview') return reply(200, getDemoOverview(userId, accountId, url.searchParams.get('range') || '1M'));
        if (url.pathname === '/api/dashboard/trades') return reply(200, getDemoTrades(userId, accountId, { query: url.searchParams.get('query') || '', side: url.searchParams.get('side') || 'All', page: Number(url.searchParams.get('page') || 1), pageSize: Number(url.searchParams.get('pageSize') || 20) }));
        if (url.pathname === '/api/dashboard/payouts') return reply(200, getDemoPayouts(userId, accountId));
      }
      throw fail(404, 'NOT_FOUND', 'Endpoint not found.');
    } catch (error) {
      const status = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
      if (status === 500) onError({ requestId, error });
      if (status === 429) res.setHeader('Retry-After', String(Math.ceil(rateWindowMs / 1000)));
      reply(status, { error: { code: status === 500 ? 'INTERNAL_ERROR' : error.code || 'REQUEST_FAILED', message: status === 500 ? 'An unexpected error occurred.' : error.message }, requestId });
    }
  });
  server.maxConnections = 200;
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return { server, store };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const production = process.env.NODE_ENV === 'production';
  const origins = (process.env.FRONTEND_ORIGINS || (production ? '' : 'http://localhost:3000,http://127.0.0.1:3000')).split(',').filter(Boolean);
  if (production && (!origins.length || origins.some(origin => !origin.startsWith('https://')))) throw Error('Production requires HTTPS FRONTEND_ORIGINS.');
  const port = Number(process.env.API_PORT || 3101);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid API_PORT.');
  const { server, store } = createApp({ allowedOrigins: origins, secureCookies: production });
  await store.ready();
  server.on('error', async error => { console.error(error.message); await store.close(); process.exitCode = 1; });
  server.listen(port, process.env.API_HOST || '127.0.0.1', () => console.log(`Breakpoint API: http://${process.env.API_HOST || '127.0.0.1'}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await store.close(); process.exit(0); }));
}
