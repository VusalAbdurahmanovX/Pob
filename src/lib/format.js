const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = value => usd.format(value);
export const shortMoney = value => `$${value / 1000}K`;
