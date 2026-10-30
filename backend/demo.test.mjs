import assert from 'node:assert/strict';
import { getDemoAccounts, getDemoOverview, getDemoTrades, getDemoPayouts } from './demo.mjs';

const user = 'demo-user';
const first = 'BP-20481';
const second = 'BP-19832';
const bad = call => assert.throws(call, { statusCode: 400, code: 'VALIDATION_ERROR' });
const accounts = getDemoAccounts(user);
assert.equal(accounts.length, 2);
assert.deepEqual(accounts[0], {
  id: first, size: 100000, balance: 108450, equity: 108682, profit: 8450,
  profitPercent: 8.45, dailyLoss: 480, maxLoss: 1200, status: 'Funded', demo: true,
});
assert.equal(accounts[1].id, second);
assert.equal(accounts[1].size, 50000);
for (const fn of [getDemoAccounts, getDemoOverview, getDemoTrades, getDemoPayouts]) {
  for (const invalid of ['', '  ', null, undefined, 42, {}]) bad(() => fn(invalid, first));
}
for (const fn of [getDemoOverview, getDemoTrades, getDemoPayouts]) {
  assert.throws(() => fn(user, 'unknown'), { statusCode: 404, code: 'ACCOUNT_NOT_FOUND' });
  for (const invalid of ['', null, 42]) bad(() => fn(user, invalid));
  assert.deepEqual(fn(user, first), fn(user, first));
}
assert.deepEqual(getDemoAccounts(user), getDemoAccounts(user));
accounts[0].balance = 0;
assert.equal(getDemoAccounts(user)[0].balance, 108450);

const trades = getDemoTrades(user, first);
assert.equal(trades.demo, true);
assert.equal(trades.total, 12);
assert.equal(trades.page, 1);
assert.equal(trades.pageSize, 20);
assert.equal(new Set(trades.items.map(trade => trade.id)).size, 12);
assert.deepEqual(new Set(trades.items.map(trade => trade.symbol)), new Set(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']));
const smaller = getDemoTrades(user, second).items;
for (const [index, trade] of trades.items.entries()) {
  assert.deepEqual(Object.keys(trade), ['id', 'symbol', 'side', 'size', 'entry', 'exit', 'pnl', 'date', 'time', 'duration']);
  assert.equal(typeof trade.size, 'number');
  assert.equal(smaller[index].size, trade.size / 2);
  assert.equal(smaller[index].pnl, trade.pnl / 2);
  const expected = trade.size * (trade.exit - trade.entry) / trade.entry * (trade.side === 'Long' ? 1 : -1);
  assert.ok(Math.abs(trade.pnl - expected) < 0.005);
  assert.match(trade.date, /^\d{4}-\d{2}-\d{2}$/);
}
const btc = getDemoTrades(user, first, { query: ' btc ', side: 'Long', pageSize: 1, page: 2 });
assert.equal(btc.total, 2);
assert.equal(btc.items.length, 1);
assert.equal(btc.items[0].id, trades.items[6].id);
bad(() => getDemoTrades(user, first, { side: 'Buy' }));
assert.equal(getDemoTrades(user, first, { query: 'BTC/USDT' }).total, 4);
assert.equal(trades.items.filter(trade => trade.side === 'Long').length, 6);
assert.ok(trades.items.every(trade => trade.date === '2026-10-30'));
assert.deepEqual(getDemoTrades(user, first, { page: Number.MAX_SAFE_INTEGER, pageSize: 100 }).items, []);
bad(() => getDemoTrades(user, first, { query: 'a'.repeat(101) }));
assert.equal(getDemoTrades(user, first, { query: 'no-match' }).total, 0);
assert.deepEqual(getDemoTrades(user, first, { page: 100 }).items, []);
for (const options of [null, [], 'bad', { query: 2 }, { side: 'wrong' }, { page: 0 }, { page: 1.5 }, { page: Infinity }, { page: '1' }, { pageSize: 0 }, { pageSize: 101 }, { pageSize: NaN }]) {
  bad(() => getDemoTrades(user, first, options));
}
bad(() => getDemoOverview(user, first, '1Y'));
for (const account of getDemoAccounts(user)) {
  const overview = getDemoOverview(user, account.id);
  assert.equal(overview.demo, true);
  assert.equal(overview.recentTrades.length, 5);
  assert.deepEqual(overview.recentTrades, getDemoTrades(user, account.id).items.slice(0, 5));
  assert.equal(overview.metrics.recentTradeCount, 12);
  assert.equal(overview.metrics.recentPnl, getDemoTrades(user, account.id).items.reduce((sum, trade) => sum + trade.pnl, 0));
  assert.notEqual(overview.metrics.recentPnl, account.profit);
  assert.deepEqual(overview.risk.daily, { limit: account.size * 0.04, used: account.dailyLoss, remaining: account.size * 0.04 - account.dailyLoss });
  assert.deepEqual(overview.risk.overall, { limit: account.size * 0.06, used: account.maxLoss, remaining: account.size * 0.06 - account.maxLoss });
  for (const [range, length] of [['1W', 7], ['1M', 30], ['ALL', 90]]) {
    const points = getDemoOverview(user, account.id, range).equity;
    assert.equal(points.length, length);
    assert.equal(points.at(-1).value, account.equity);
    assert.equal(points.at(-1).date, '2026-10-30');
    points.forEach((point, index) => {
      assert.ok(Number.isFinite(point.value));
      assert.equal(new Date(point.date).toISOString().slice(0, 10), point.date);
      if (index) assert.ok(points[index - 1].date < point.date);
    });
  }
  assert.deepEqual(getDemoOverview(user, account.id, 'ALL').equity.slice(-7), getDemoOverview(user, account.id, '1W').equity);
  const payouts = getDemoPayouts(user, account.id);
  assert.equal(payouts.demo, true);
  assert.equal(payouts.asset, 'USDC');
  assert.equal(payouts.profitSplit, 0.9);
  assert.equal(payouts.available + payouts.items.reduce((sum, payout) => sum + payout.amount, 0), account.profit * 0.9);
  assert.deepEqual(overview.payouts, payouts.items);
}
trades.items[0].pnl = 0;
assert.equal(getDemoTrades(user, first).items[0].pnl, 480);
console.log('Demo backend checks passed');
