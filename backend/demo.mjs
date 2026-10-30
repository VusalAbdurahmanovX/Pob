// Synthetic, read-only demo fixtures. These are not trading or payout records.
const ACCOUNTS = [
  { id: 'BP-20481', size: 100000, balance: 108450, equity: 108682, profit: 8450, profitPercent: 8.45, dailyLoss: 480, maxLoss: 1200, status: 'Funded' },
  { id: 'BP-19832', size: 50000, balance: 54225, equity: 54341, profit: 4225, profitPercent: 8.45, dailyLoss: 240, maxLoss: 600, status: 'Funded' },
];
const END_DATE = Date.UTC(2026, 9, 30);
const DAY = 86400000;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

function fail(message, statusCode = 400, code = 'VALIDATION_ERROR') {
  throw Object.assign(new Error(message), { statusCode, code });
}

function validateUser(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('userId must be a nonempty string');
}

function accountFor(userId, accountId) {
  validateUser(userId);
  if (typeof accountId !== 'string' || !accountId.trim()) fail('accountId must be a nonempty string');
  const account = ACCOUNTS.find(item => item.id === accountId);
  if (!account) fail('Demo account not found', 404, 'ACCOUNT_NOT_FOUND');
  return { ...account, demo: true };
}

export function getDemoAccounts(userId) {
  validateUser(userId);
  return ACCOUNTS.map(account => ({ ...account, demo: true }));
}

// Entry notional, not token quantity. PNL is the corresponding closed price move.
const TRADES = [
  ['BTC/USDT', 'Long', 24000, 68000, 69360, '10:42:18', '2h 14m'],
  ['ETH/USDT', 'Short', 15000, 3500, 3430, '09:18:42', '1h 32m'],
  ['SOL/USDT', 'Long', 10000, 160, 156.8, '08:04:12', '48m'],
  ['BTC/USDT', 'Short', 20000, 70000, 69300, '16:22:06', '3h 8m'],
  ['ETH/USDT', 'Long', 18000, 3400, 3502, '14:10:30', '2h 46m'],
  ['SOL/USDT', 'Short', 12000, 165, 168.3, '11:36:54', '1h 5m'],
  ['BTC/USDT', 'Long', 25000, 66000, 67980, '10:05:24', '4h 12m'],
  ['ETH/USDT', 'Short', 16000, 3600, 3636, '15:48:12', '52m'],
  ['SOL/USDT', 'Long', 8000, 150, 156, '13:20:18', '2h 20m'],
  ['BTC/USDT', 'Short', 22000, 69000, 67620, '09:42:36', '3h 44m'],
  ['ETH/USDT', 'Long', 14000, 3300, 3366, '17:06:48', '1h 18m'],
  ['SOL/USDT', 'Short', 9000, 155, 158.1, '12:14:00', '36m'],
];

function tradesFor(account) {
  const scale = account.size / 100000;
  return TRADES.map(([symbol, side, notional, entry, exit, time, duration], index) => ({
    id: `${account.id}-DEMO-${String(index + 1).padStart(3, '0')}`,
    symbol, side, size: notional * scale, entry, exit,
    pnl: round(notional * scale * (exit - entry) / entry * (side === 'Long' ? 1 : -1)),
    date: '2026-10-30',
    time, duration,
  }));
}

export function getDemoTrades(userId, accountId, options = {}) {
  const account = accountFor(userId, accountId);
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('Trade options must be an object');
  const { query = '', side = 'All', page = 1, pageSize = 20 } = options;
  if (typeof query !== 'string' || query.length > 100) fail('query must be a string of at most 100 characters');
  if (!['All', 'Long', 'Short'].includes(side)) fail('side must be All, Long or Short');
  if (!Number.isSafeInteger(page) || page < 1) fail('page must be a positive integer');
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) fail('pageSize must be an integer between 1 and 100');
  const search = query.trim().toLowerCase();
  const filtered = tradesFor(account).filter(trade =>
    (side === 'All' || trade.side === side) &&
    (!search || `${trade.symbol} ${trade.id}`.toLowerCase().includes(search)));
  const start = page > Math.ceil(filtered.length / pageSize) ? filtered.length : (page - 1) * pageSize;
  return { demo: true, items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
}

export function getDemoPayouts(userId, accountId) {
  const account = accountFor(userId, accountId);
  const scale = account.size / 100000;
  return {
    demo: true,
    items: [
      { id: `${account.id}-DEMO-PAYOUT-001`, date: '2026-10-15', amount: 1800 * scale, asset: 'USDC', status: 'Paid' },
      { id: `${account.id}-DEMO-PAYOUT-002`, date: '2026-09-30', amount: 1350 * scale, asset: 'USDC', status: 'Paid' },
    ],
    available: round(account.profit * 0.9 - 3150 * scale),
    asset: 'USDC',
    profitSplit: 0.9,
  };
}

export function getDemoOverview(userId, accountId, range = '1M') {
  const account = accountFor(userId, accountId);
  if (!['1W', '1M', 'ALL'].includes(range)) fail('range must be 1W, 1M or ALL');
  const count = { '1W': 7, '1M': 30, ALL: 90 }[range];
  // ponytail: fixed illustrative history; replace with ledger series only for a real-data product.
  const equity = Array.from({ length: count }, (_, index) => {
    const day = 90 - count + index;
    const progress = day / 89;
    const value = account.size + (account.equity - account.size) * progress +
      Math.sin(day * 0.8) * account.size * 0.0015 * Math.sin(Math.PI * progress);
    return { date: new Date(END_DATE - (count - 1 - index) * DAY).toISOString().slice(0, 10), value: index === count - 1 ? account.equity : round(value) };
  });
  const trades = tradesFor(account);
  const dailyLimit = account.size * 0.04;
  const overallLimit = account.size * 0.06;
  return {
    demo: true, account,
    metrics: {
      balance: account.balance, equity: account.equity, profit: account.profit,
      profitPercent: account.profitPercent, dailyLoss: account.dailyLoss, maxLoss: account.maxLoss,
      recentPnl: round(trades.reduce((sum, trade) => sum + trade.pnl, 0)),
      recentTradeCount: trades.length,
      recentWinRate: round(trades.filter(trade => trade.pnl > 0).length / trades.length * 100),
    },
    risk: {
      daily: { limit: dailyLimit, used: account.dailyLoss, remaining: dailyLimit - account.dailyLoss },
      overall: { limit: overallLimit, used: account.maxLoss, remaining: overallLimit - account.maxLoss },
    },
    equity, recentTrades: trades.slice(0, 5), payouts: getDemoPayouts(userId, accountId).items,
  };
}
