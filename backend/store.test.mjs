import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { createStore } from './store.mjs';

const credentials = { name: '  Alice Example  ', email: '  Alice@Example.COM  ', password: 'a strong password 123!' };
const safeKeys = ['createdAt', 'email', 'id', 'name'];
const unusedConnection = 'postgresql://unused:unused@127.0.0.1:1/unused';

test('factory validates configuration synchronously without connecting', () => {
  for (const connectionString of ['', ' ', null, 42]) {
    assert.throws(() => createStore({ connectionString }), TypeError);
  }
  for (const sessionTtlMs of [0, -1, Infinity, NaN, 1.5, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => createStore({ connectionString: unusedConnection, sessionTtlMs }), TypeError);
  }
});

test('registration validates input before lazy database initialization', async (t) => {
  const store = createStore({ connectionString: unusedConnection });
  t.after(() => store.close());
  for (const input of [
    null, {}, { ...credentials, name: 'a' }, { ...credentials, name: 'a'.repeat(81) },
    { ...credentials, email: 'not-an-email' }, { ...credentials, email: 'a@localhost' },
    { ...credentials, email: '.alice@example.com' }, { ...credentials, email: 'a..b@example.com' },
    { ...credentials, email: `${'a'.repeat(65)}@example.com` },
    { ...credentials, email: `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com` },
    { ...credentials, password: 'short' }, { ...credentials, password: 'a'.repeat(129) },
    { ...credentials, password: null },
  ]) {
    await assert.rejects(store.register(input), { statusCode: 400, code: 'VALIDATION_ERROR' });
  }
  await assert.rejects(store.createSession(''), TypeError);
  await assert.rejects(store.createSession(null), TypeError);
  assert.equal(await store.getSession('invalid'), null);
  assert.equal(await store.getSession(null), null);
  assert.equal(await store.deleteSession(undefined), undefined);
});

test('close is asynchronous, idempotent and prevents database initialization', async () => {
  const store = createStore({ connectionString: unusedConnection });
  assert.ok(store.close() instanceof Promise);
  await store.close();
  await assert.rejects(store.ready(), /Store is closed/);
});

test('PostgreSQL registration, authentication, durable sessions, expiry and revocation', {
  skip: process.env.TEST_DATABASE_URL ? false : 'Set TEST_DATABASE_URL to run PostgreSQL integration tests',
}, async (t) => {
  const connectionString = process.env.TEST_DATABASE_URL;
  const inspector = new Pool({ connectionString });
  const userIds = [];
  const suffix = randomUUID();
  const input = { ...credentials, email: `  Alice.${suffix}@Example.COM  ` };
  let store = createStore({ connectionString, sessionTtlMs: 2000 });
  t.after(async () => {
    try {
      await store.close();
      await inspector.query('DELETE FROM bp_users WHERE id = ANY($1::uuid[])', [userIds]);
    } finally {
      await inspector.end();
    }
  });
  await Promise.all([store.ready(), store.ready()]);
  const user = await store.register(input);
  userIds.push(user.id);
  assert.deepEqual(Object.keys(user).sort(), safeKeys);
  assert.equal(user.name, 'Alice Example');
  assert.equal(user.email, input.email.trim().toLowerCase());
  assert.match(user.id, /^[0-9a-f-]{36}$/);
  assert.equal(new Date(user.createdAt).toISOString(), user.createdAt);
  await assert.rejects(store.register({ ...input, email: user.email.toUpperCase() }), { statusCode: 409, code: 'EMAIL_EXISTS' });
  assert.deepEqual(await store.authenticate(input), user);
  for (const attempt of [
    { email: input.email, password: 'wrong password 123' },
    { email: `unknown.${suffix}@example.com`, password: input.password },
    { email: input.email, password: null }, null,
    { email: "' OR 1=1 --", password: input.password },
  ]) assert.equal(await store.authenticate(attempt), null);

  const secondUser = await store.register({ name: 'A'.repeat(80), email: `max.${suffix}@example.com`, password: input.password });
  userIds.push(secondUser.id);
  const minUser = await store.register({ name: 'AB', email: `min.${suffix}@example.com`, password: 'x'.repeat(12) });
  userIds.push(minUser.id);
  const maxUser = await store.register({ name: 'AB', email: `long.${suffix}@example.com`, password: 'x'.repeat(128) });
  userIds.push(maxUser.id);
  const { rows: storedUsers } = await inspector.query('SELECT * FROM bp_users WHERE id = ANY($1::uuid[])', [[user.id, secondUser.id]]);
  for (const stored of storedUsers) {
    assert.equal(stored.password, undefined);
    assert.match(stored.password_salt, /^[a-f0-9]{32}$/);
    assert.match(stored.password_digest, /^[a-f0-9]{128}$/);
  }
  assert.notEqual(storedUsers[0].password_salt, storedUsers[1].password_salt);
  assert.notEqual(storedUsers[0].password_digest, storedUsers[1].password_digest);

  const before = Date.now();
  const session = await store.createSession(user.id);
  const secondSession = await store.createSession(user.id);
  assert.match(session.token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(session.token, secondSession.token);
  assert.equal(typeof session.expiresAt, 'number');
  assert.ok(session.expiresAt >= before + 2000 && session.expiresAt <= Date.now() + 2000);
  assert.deepEqual(await store.getSession(session.token), { user, expiresAt: session.expiresAt });
  await assert.rejects(store.createSession(randomUUID()), { code: '23503' });
  const digest = createHash('sha256').update(session.token).digest('hex');
  const { rows: [storedSession] } = await inspector.query('SELECT * FROM bp_sessions WHERE token_digest = $1', [digest]);
  assert.equal(storedSession.token, undefined);
  assert.equal(storedSession.token_digest, digest);

  await store.close();
  store = createStore({ connectionString });
  assert.deepEqual(await store.getSession(session.token), { user, expiresAt: session.expiresAt });
  assert.deepEqual(await store.authenticate(input), user);
  await store.deleteSession(session.token);
  assert.equal(await store.getSession(session.token), null);
  await store.deleteSession(session.token);
  assert.ok(await store.getSession(secondSession.token));
  await inspector.query('UPDATE bp_sessions SET expires_at = $1 WHERE user_id = $2', [Date.now() - 1, user.id]);
  assert.equal(await store.getSession(secondSession.token), null);
  const { rows: [{ count }] } = await inspector.query('SELECT count(*) FROM bp_sessions WHERE user_id = $1', [user.id]);
  assert.equal(Number(count), 0);
});
