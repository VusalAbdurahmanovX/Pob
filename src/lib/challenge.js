export const SIZES = [10000, 25000, 50000, 100000, 200000];

const fees = new Map([[10000, 99], [25000, 179], [50000, 299], [100000, 499], [200000, 949]]);

export const PLANS = {
  1: { name: '1-Step', target: '10%', maxLoss: '6%', dailyLoss: '4%', phases: [10] },
  2: { name: '2-Step', target: '8% / 5%', maxLoss: '8%', dailyLoss: '4%', phases: [8, 5] },
};

export function getChallenge(size, mode) {
  if (!fees.has(size) || ![1, 2].includes(mode)) throw new RangeError('Invalid challenge selection');
  const base = fees.get(size);
  return {
    ...PLANS[mode],
    size,
    mode,
    baseFee: base,
    fee: mode === 1 ? base : Math.round(base * 0.8),
  };
}
