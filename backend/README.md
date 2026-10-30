# Breakpoint API

Node.js 24+, PostgreSQL 17 in Docker. This backend is independent of the React frontend. Authentication is persistent; account performance, trades, and payouts are explicitly synthetic demo data. No money moves.

## Run locally

1. Start Docker Desktop (Linux containers).
2. Copy `.env.example` to `.env`; replace the password in both `POSTGRES_PASSWORD` and `DATABASE_URL` with the same long random password (URL-encode it in the URL).
3. Run `npm install`, then `npm run db:up`.
4. Run `npm run api`. API listens on `http://localhost:3101`.
5. Keep frontend on `http://localhost:3000`; use the same hostname consistently. PostgreSQL is available only on `127.0.0.1:5433`; the Docker named volume persists across restarts. `npm run db:stop` stops without deleting data. Never use `docker compose down -v` unless intentionally deleting all database data.

Production: deploy behind HTTPS on the same site as the frontend (prefer reverse proxy `/api`), set `NODE_ENV=production`, exact HTTPS `FRONTEND_ORIGINS`, and a private `DATABASE_URL` with verified TLS when remote. Secure `__Host-` cookies are automatically enabled in production. Do not expose PostgreSQL publicly. Compose is a local-development database setup, not a complete production deployment. Use separate migration/runtime DB roles, managed backups with restore tests, distributed rate limiting before multiple API replicas, email verification/password recovery before a public launch, and secret management. The API does not trust forwarded IP headers; behind a proxy its current in-memory limiter intentionally shares that proxy's IP rather than trusting spoofable headers.

## Frontend contract

All requests must include `credentials: 'include'`. Before any POST, call `GET /api/auth/csrf`, keep its JSON `csrfToken` in memory, and send `X-CSRF-Token` plus `Content-Type: application/json`. Browser sends the matching CSRF cookie. Session cookie is HttpOnly and must not be read from JavaScript or copied into localStorage. Repeat CSRF bootstrap after logout/reload. POST requires a matching allowed browser Origin. Cookies are host-only and SameSite=Lax; separate unrelated frontend/API sites are not supported.

```js
const base = 'http://localhost:3101';
const security = await fetch(`${base}/api/auth/csrf`, { credentials: 'include' });
const { csrfToken } = await security.json();
const response = await fetch(`${base}/api/auth/register`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ name: 'Jamie Davis', email: 'jamie@example.com', password: 'a-long-unique-password' }),
});
const data = await response.json();
if (!response.ok) throw new Error(data.error.message);
// data.user = { id, name, email, createdAt }; data.expiresAt = epoch milliseconds
```

| Method | Path | Input / response |
|---|---|---|
| GET | `/api/health` | `{ok:true}` process health; startup waits for database readiness |
| GET | `/api/auth/csrf` | `{csrfToken}` plus cookie |
| POST | `/api/auth/register` | `{name,email,password}` → 201 `{user,expiresAt}`; automatically signs in |
| POST | `/api/auth/login` | `{email,password}` → `{user,expiresAt}` |
| POST | `/api/auth/logout` | Revokes session and clears cookies → `{ok:true}` |
| GET | `/api/auth/me` | `{user,expiresAt}` or 401 |
| GET | `/api/dashboard/accounts` | `{demo:true,items:[accounts]}` |
| GET | `/api/dashboard/overview` | `?accountId=BP-20481&range=1M`; range `1W`, `1M`, `ALL` |
| GET | `/api/dashboard/trades` | `?accountId=BP-20481&query=BTC&side=Long&page=1&pageSize=20`; side `All`, `Long`, `Short` |
| GET | `/api/dashboard/payouts` | `?accountId=BP-20481`; read-only demo history and available share |

Dashboard routes all require a valid session. Omit accountId for first demo account. Account data is generated per authenticated workspace and never accepts another user's ID from request input. All trading/payout responses include `demo:true`. No payout-submit or real-trading endpoints exist.

Errors: `{error:{code,message},requestId}`. Handle 400 invalid input, 401 unauthenticated/incorrect credentials, 403 CSRF/origin, 404 missing account/endpoint, 409 duplicate email, 413 body too large, 415 JSON required, 429 rate limit. Passwords: 12–128 characters, at most 512 UTF-8 bytes. Names: 2–80 trimmed characters. Emails are normalized to lowercase. Passwords use salted scrypt; only SHA-256 session-token digests are stored. Login rotates the current browser session. Auth requests share a 30-attempt/15-minute per-peer-IP limit.

## Tests

`npm run test:api` runs pure data/validation and HTTP security tests. To create the dedicated local test database once, use `docker compose exec db createdb -U breakpoint_dev breakpoint_test`, then set `TEST_DATABASE_URL` to the same local connection URL with `/breakpoint_test` instead of `/breakpoint`. PostgreSQL integration is explicitly skipped without `TEST_DATABASE_URL`. Set that variable to a dedicated test database (never production) to verify persistence, authentication, expiry, and revocation. The integration test cleans up its own uniquely named users. HTTP tests use an isolated store double; they are not a substitute for PostgreSQL integration.
