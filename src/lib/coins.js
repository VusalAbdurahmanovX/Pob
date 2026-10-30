import {
  TokenADA, TokenARB, TokenAVAX, TokenBNB, TokenBTC, TokenDOGE, TokenETH,
  TokenLINK, TokenSOL, TokenSUI, TokenTON, TokenUSDC, TokenXRP,
} from '@web3icons/react';

export const PAIRS = [
  { symbol: 'BTC', name: 'Bitcoin', Icon: TokenBTC },
  { symbol: 'ETH', name: 'Ethereum', Icon: TokenETH },
  { symbol: 'SOL', name: 'Solana', Icon: TokenSOL },
  { symbol: 'XRP', name: 'XRP', Icon: TokenXRP },
  { symbol: 'BNB', name: 'BNB', Icon: TokenBNB },
  { symbol: 'DOGE', name: 'Dogecoin', Icon: TokenDOGE },
  { symbol: 'ADA', name: 'Cardano', Icon: TokenADA },
  { symbol: 'AVAX', name: 'Avalanche', Icon: TokenAVAX },
  { symbol: 'LINK', name: 'Chainlink', Icon: TokenLINK },
  { symbol: 'TON', name: 'Toncoin', Icon: TokenTON },
  { symbol: 'SUI', name: 'Sui', Icon: TokenSUI },
  { symbol: 'ARB', name: 'Arbitrum', Icon: TokenARB },
];

export const PAYOUT_COINS = [
  { symbol: 'USDC', Icon: TokenUSDC },
  { symbol: 'BTC', Icon: TokenBTC },
  { symbol: 'ETH', Icon: TokenETH },
];
