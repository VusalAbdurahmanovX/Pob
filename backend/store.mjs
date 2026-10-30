import { Pool } from 'pg';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const validPassword = (password) => typeof password === 'string' && password.length >= 12 && password.length <= 128 && Buffer.byteLength(password, 'utf8') <= 512;
const safeUser = (row) => ({ id: row.id, name: row.name, email: row.email, createdAt: new Date(row.created_at).toISOString() });
const tokenDigest = (token) => createHash('sha256').update(token).digest('hex');
const validToken = (token) => typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
const fail = (message, statusCode, code) => Object.assign(new Error(message), { statusCode, code });

export function createStore({ connectionString = process.env.DATABASE_URL, sessionTtlMs = 604800000 } = {}) {
  if (typeof connectionString !== 'string' || !connectionString.trim()) throw new TypeError('DATABASE_URL must be a nonempty PostgreSQL connection string');
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs <= 0 || !Number.isSafeInteger(Date.now() + sessionTtlMs)) {
    throw new TypeError('sessionTtlMs must be a positive safe integer');
  }
  const pool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  pool.on('error', error => console.error('PostgreSQL idle connection error:', error.code || 'UNKNOWN'));
  const dummySalt = randomBytes(16).toString('hex');
  const dummyDigest = randomBytes(64);
  let initialization;
  let closing;

  async function ready() {
    if (closing) throw new Error('Store is closed');
    initialization ??= pool.query(`
      CREATE TABLE IF NOT EXISTS bp_users (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_salt TEXT NOT NULL,
        password_digest TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bp_sessions (
        token_digest TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES bp_users(id) ON DELETE CASCADE,
        expires_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS bp_sessions_expires_at ON bp_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS bp_sessions_user_id ON bp_sessions(user_id);
    `).then(() => undefined);
    await initialization;
  }

  return {
    ready,
    async register(input = {}) {
      const { name, email, password } = input ?? {};
      const cleanName = typeof name === 'string' ? name.trim() : '';
      const cleanEmail = normalizeEmail(email);
      const localPart = cleanEmail.split('@')[0];
      if (cleanName.length < 2 || cleanName.length > 80 || cleanEmail.length > 254 ||
          localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..') ||
          !emailPattern.test(cleanEmail) || !validPassword(password)) {
        throw fail('Enter a name (2–80 characters), valid email, and password (12–128 characters, at most 512 UTF-8 bytes).', 400, 'VALIDATION_ERROR');
      }
      await ready();
      const salt = randomBytes(16).toString('hex');
      const digest = await deriveKey(password, salt, 64);
      const user = { id: randomUUID(), name: cleanName, email: cleanEmail, createdAt: new Date().toISOString() };
      try {
        await pool.query('INSERT INTO bp_users (id, name, email, password_salt, password_digest, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, user.name, user.email, salt, digest.toString('hex'), user.createdAt]);
      } catch (error) {
        if (error.code === '23505' && error.constraint === 'bp_users_email_key') {
          throw fail('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }
        throw error;
      }
      return user;
    },
    async authenticate(input = {}) {
      const { email, password } = input ?? {};
      await ready();
      const { rows: [row] } = await pool.query('SELECT * FROM bp_users WHERE email = $1', [normalizeEmail(email)]);
      const usablePassword = validPassword(password);
      const digest = await deriveKey(usablePassword ? password : 'invalid-password', row?.password_salt ?? dummySalt, 64);
      const expected = row ? Buffer.from(row.password_digest, 'hex') : dummyDigest;
      const matches = expected.length === digest.length && timingSafeEqual(digest, expected);
      return row && usablePassword && matches ? safeUser(row) : null;
    },
    async createSession(userId) {
      if (typeof userId !== 'string' || !userId) throw new TypeError('userId must be a nonempty string');
      await ready();
      await pool.query('DELETE FROM bp_sessions WHERE expires_at <= $1', [Date.now()]);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = Date.now() + sessionTtlMs;
      await pool.query('INSERT INTO bp_sessions (token_digest, user_id, expires_at) VALUES ($1, $2, $3)', [tokenDigest(token), userId, expiresAt]);
      return { token, expiresAt };
    },
    async getSession(token) {
      if (!validToken(token)) return null;
      await ready();
      const digest = tokenDigest(token);
      const { rows: [row] } = await pool.query(`SELECT u.id, u.name, u.email, u.created_at, s.expires_at
        FROM bp_sessions s JOIN bp_users u ON u.id = s.user_id WHERE s.token_digest = $1`, [digest]);
      if (!row) return null;
      const expiresAt = Number(row.expires_at);
      if (expiresAt <= Date.now()) {
        await pool.query('DELETE FROM bp_sessions WHERE token_digest = $1', [digest]);
        return null;
      }
      return { user: safeUser(row), expiresAt };
    },
    async deleteSession(token) {
      if (!validToken(token)) return;
      await ready();
      await pool.query('DELETE FROM bp_sessions WHERE token_digest = $1', [tokenDigest(token)]);
    },
    async close() {
      closing ??= pool.end();
      await closing;
    },
  };
}
