import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS, TRADES, PAYOUTS, getEquitySeries, filterTrades, summarizeTrades } from './dashboard.js';

test('dashboard fixtures have stable identities and supported values', () => {
  assert.equal(ACCOUNTS.length, 2);
  assert.deepEqual(ACCOUNTS[0], { id: 'BP-20481', name: 'Funded Account', size: 100000, balance: 108450, equity: 108682, profit: 8450, profitPercent: 8.45, dailyLoss: 480, maxLoss: 1200, status: 'Funded' });
  assert.equal(ACCOUNTS[1].size, 50000);
  assert.equal(TRADES.length, 12);
  assert.equal(new Set(TRADES.map(({ id }) => id)).size, 12);
  for (const trade of TRADES) {
    assert.ok(['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].includes(trade.symbol));
    assert.ok(['Long', 'Short'].includes(trade.side));
    assert.match(trade.size, /^\$[\d,]+$/);
    assert.ok([trade.entry, trade.exit, trade.pnl].every(Number.isFinite));
    assert.equal(trade.date, '2026-10-30');
    assert.match(trade.time, /^\d{2}:\d{2}$/);
    assert.ok(trade.duration);
  }
  assert.ok(PAYOUTS.length > 0);
  for (const payout of PAYOUTS) {
    assert.equal(payout.status, 'Paid');
    assert.equal(payout.asset, 'USDC');
    assert.ok(payout.amount > 0);
  }
});

test('equity series are deterministic, range-specific, and end at account equity', () => {
  for (const account of ACCOUNTS) {
    for (const [range, length] of [['1W', 7], ['1M', 30], ['ALL', 90]]) {
      const series = getEquitySeries(range, account);
      assert.equal(series.length, length);
      assert.ok(series.every(Number.isFinite));
      assert.equal(series.at(-1), account.equity);
      assert.deepEqual(series, getEquitySeries(range, account));
    }
    assert.equal(getEquitySeries('ALL', account)[0], account.size);
  }
  for (const range of ['1D', 'toString', null, undefined]) {
    assert.throws(() => getEquitySeries(range, ACCOUNTS[0]), RangeError);
  }
  for (const account of [null, {}, { ...ACCOUNTS[0], id: 'unknown' }, { ...ACCOUNTS[0], equity: NaN }, { ...ACCOUNTS[0], size: -1 }]) {
    assert.throws(() => getEquitySeries('1W', account), RangeError);
  }
});

test('trade search combines case-insensitive query and side without mutation', () => {
  const snapshot = structuredClone(TRADES);
  assert.deepEqual(filterTrades(TRADES), TRADES);
  assert.equal(filterTrades(TRADES, ' btc ', 'Long').length, 2);
  assert.equal(filterTrades(TRADES, 'tr-1042')[0], TRADES[0]);
  assert.equal(filterTrades(TRADES, 'unknown').length, 0);
  assert.equal(filterTrades(TRADES, '', 'Short').length, 6);
  assert.deepEqual(TRADES, snapshot);
  assert.throws(() => filterTrades(TRADES, '', 'Buy'), RangeError);
  assert.throws(() => filterTrades(null), TypeError);
  assert.throws(() => filterTrades(TRADES, 123), TypeError);
});

test('trade summaries cover wins, losses, breakevens and finite no-loss values', () => {
  assert.deepEqual(summarizeTrades([{ pnl: 200 }, { pnl: -50 }, { pnl: 0 }]), {
    wins: 1, total: 3, winRate: (1 / 3) * 100, profitFactor: 4, netPnl: 150,
  });
  assert.deepEqual(summarizeTrades([]), { wins: 0, total: 0, winRate: 0, profitFactor: 0, netPnl: 0 });
  assert.equal(summarizeTrades([{ pnl: -10 }]).profitFactor, 0);
  assert.equal(summarizeTrades([{ pnl: 20 }]).profitFactor, Number.MAX_SAFE_INTEGER);
  const summary = summarizeTrades(TRADES);
  assert.equal(summary.wins, 9);
  assert.equal(summary.total, 12);
  assert.equal(summary.winRate, 75);
  assert.equal(summary.netPnl, 1838);
  assert.ok(Object.values(summary).every(Number.isFinite));
  assert.throws(() => summarizeTrades([{ pnl: Infinity }]), TypeError);
  assert.throws(() => summarizeTrades(null), TypeError);
});
 test('module exports only its public data and helpers', async () => {
  assert.deepEqual(Object.keys(await import('./dashboard.js')).sort(), [
    'ACCOUNTS', 'PAYOUTS', 'TRADES', 'filterTrades', 'getEquitySeries', 'summarizeTrades',
  ]);
});
