export const ACCOUNTS = [
  { id: 'BP-20481', name: 'Funded Account', size: 100000, balance: 108450, equity: 108682, profit: 8450, profitPercent: 8.45, dailyLoss: 480, maxLoss: 1200, status: 'Funded' },
  { id: 'BP-19832', name: 'Funded Account', size: 50000, balance: 52760, equity: 52894, profit: 2760, profitPercent: 5.52, dailyLoss: 210, maxLoss: 650, status: 'Funded' },
];

export const TRADES = [
  { id: 'TR-1042', symbol: 'BTC/USDT', side: 'Long', size: '$24,500', entry: 67420, exit: 68185, pnl: 278, date: '2026-10-30', time: '14:32', duration: '2h 14m' },
  { id: 'TR-1041', symbol: 'ETH/USDT', side: 'Short', size: '$18,000', entry: 3528.4, exit: 3492.8, pnl: 182, date: '2026-10-30', time: '13:48', duration: '48m' },
  { id: 'TR-1040', symbol: 'SOL/USDT', side: 'Long', size: '$12,000', entry: 172.85, exit: 171.12, pnl: -120, date: '2026-10-30', time: '12:56', duration: '1h 06m' },
  { id: 'TR-1039', symbol: 'BTC/USDT', side: 'Short', size: '$32,000', entry: 68120, exit: 67345, pnl: 364, date: '2026-10-30', time: '11:24', duration: '3h 12m' },
  { id: 'TR-1038', symbol: 'ETH/USDT', side: 'Long', size: '$16,500', entry: 3462.5, exit: 3510.75, pnl: 230, date: '2026-10-30', time: '10:42', duration: '1h 38m' },
  { id: 'TR-1037', symbol: 'SOL/USDT', side: 'Short', size: '$9,000', entry: 174.2, exit: 176.52, pnl: -120, date: '2026-10-30', time: '09:18', duration: '42m' },
  { id: 'TR-1036', symbol: 'BTC/USDT', side: 'Long', size: '$28,000', entry: 66980, exit: 67684, pnl: 294, date: '2026-10-30', time: '08:34', duration: '2h 08m' },
  { id: 'TR-1035', symbol: 'ETH/USDT', side: 'Short', size: '$14,000', entry: 3540, exit: 3508.4, pnl: 125, date: '2026-10-30', time: '07:52', duration: '56m' },
  { id: 'TR-1034', symbol: 'SOL/USDT', side: 'Long', size: '$15,000', entry: 169.8, exit: 173.36, pnl: 314, date: '2026-10-30', time: '06:45', duration: '1h 24m' },
  { id: 'TR-1033', symbol: 'BTC/USDT', side: 'Short', size: '$20,000', entry: 67250, exit: 68057, pnl: -240, date: '2026-10-30', time: '05:36', duration: '38m' },
  { id: 'TR-1032', symbol: 'ETH/USDT', side: 'Long', size: '$22,000', entry: 3418.2, exit: 3466.36, pnl: 310, date: '2026-10-30', time: '04:28', duration: '2h 46m' },
  { id: 'TR-1031', symbol: 'SOL/USDT', side: 'Short', size: '$11,000', entry: 175.6, exit: 172.07, pnl: 221, date: '2026-10-30', time: '03:12', duration: '1h 12m' },
];

export const PAYOUTS = [
  { id: 'PO-0832', date: '2026-10-24', amount: 4200, status: 'Paid', asset: 'USDC' },
  { id: 'PO-0761', date: '2026-10-10', amount: 3150, status: 'Paid', asset: 'USDC' },
  { id: 'PO-0694', date: '2026-09-26', amount: 2800, status: 'Paid', asset: 'USDC' },
];

export function getEquitySeries(range, account) {
  const count = { '1W': 7, '1M': 30, ALL: 90 }[range];
  if (!Number.isInteger(count)) throw new RangeError('Range must be 1W, 1M, or ALL');
  if (!account || !ACCOUNTS.some(({ id }) => id === account.id)
    || !Number.isFinite(account.equity) || account.equity <= 0
    || !Number.isFinite(account.size) || account.size <= 0) {
    throw new RangeError('Select a valid funded account');
  }
  const start = range === 'ALL' ? account.size : account.equity - account.size * (range === '1W' ? 0.019 : 0.061);
  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return account.equity;
    const progress = index / (count - 1);
    const variation = Math.sin(index * 1.7) * Math.sin(Math.PI * progress) * account.size * 0.0035;
    return Math.round((start + (account.equity - start) * progress + variation) * 100) / 100;
  });
}

export function filterTrades(trades, query = '', side = 'All') {
  if (!Array.isArray(trades) || typeof query !== 'string') throw new TypeError('Expected trades and a search string');
  if (!['All', 'Long', 'Short'].includes(side)) throw new RangeError('Side must be All, Long, or Short');
  const search = query.trim().toLowerCase();
  return trades.filter((trade) => {
    if (!trade || typeof trade.symbol !== 'string' || typeof trade.id !== 'string'
      || !['Long', 'Short'].includes(trade.side)) throw new TypeError('Invalid trade');
    return (side === 'All' || trade.side === side)
      && `${trade.symbol} ${trade.id}`.toLowerCase().includes(search);
  });
}

export function summarizeTrades(trades) {
  if (!Array.isArray(trades)) throw new TypeError('Expected a trades array');
  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  for (const trade of trades) {
    if (!trade || !Number.isFinite(trade.pnl)) throw new TypeError('Trade P&L must be finite');
    if (trade.pnl > 0) { wins += 1; grossProfit += trade.pnl; }
    else grossLoss -= trade.pnl;
  }
  const total = trades.length;
  return {
    wins,
    total,
    winRate: total ? (wins / total) * 100 : 0,
    // ponytail: cap unbounded profit factor until the UI supports an infinity state.
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Number.MAX_SAFE_INTEGER : 0,
    netPnl: grossProfit - grossLoss,
  };
}
