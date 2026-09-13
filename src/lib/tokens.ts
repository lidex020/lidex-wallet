import type { ChainId } from './chains';

export interface TokenMeta {
  symbol: string;
  name: string;
  chain: ChainId;
  contract?: string;
  decimals: number;
  coingeckoId?: string;
  color: string;
}

export const POPULAR_TOKENS: TokenMeta[] = [
  { symbol: 'USDT', name: 'Tether USD', chain: 'ethereum', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, coingeckoId: 'tether', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, coingeckoId: 'usd-coin', color: '#2775CA' },
  { symbol: 'BNB', name: 'BNB', chain: 'bnb', decimals: 18, coingeckoId: 'binancecoin', color: '#F0B90B' },
  { symbol: 'USDT', name: 'Tether USD (BSC)', chain: 'bnb', contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, coingeckoId: 'tether', color: '#26A17B' },
  { symbol: 'JUP', name: 'Jupiter', chain: 'solana', decimals: 6, coingeckoId: 'jupiter', color: '#C7F284' },
];

export const STAKING_OPTIONS = [
  { chain: 'ethereum' as ChainId, protocol: 'Lido stETH', apy: 3.2, min: 0.01, lock: 'Flexible', risk: 'Low' },
  { chain: 'bnb' as ChainId, protocol: 'BNB Staking', apy: 2.8, min: 0.1, lock: 'Flexible', risk: 'Low' },
  { chain: 'solana' as ChainId, protocol: 'Native SOL', apy: 7.1, min: 0.01, lock: '~2 days unstake', risk: 'Low' },
  { chain: 'ethereum' as ChainId, protocol: 'Rocket Pool rETH', apy: 3.0, min: 0.01, lock: 'Flexible', risk: 'Low' },
];

export const DAPPS = [
  { name: 'Uniswap', category: 'DeFi', url: 'https://app.uniswap.org', desc: 'Swap tokens on Ethereum', color: '#FF007A' },
  { name: 'PancakeSwap', category: 'DeFi', url: 'https://pancakeswap.finance', desc: 'Swap on BNB Chain', color: '#1FC7D4' },
  { name: 'Jupiter', category: 'DeFi', url: 'https://jup.ag', desc: 'Solana aggregator', color: '#C7F284' },
  { name: 'OpenSea', category: 'NFT', url: 'https://opensea.io', desc: 'NFT marketplace', color: '#2081E2' },
  { name: 'Aave', category: 'Lending', url: 'https://app.aave.com', desc: 'Lend & borrow', color: '#B6509E' },
  { name: 'Lido', category: 'Staking', url: 'https://lido.fi', desc: 'Liquid ETH staking', color: '#00A3FF' },
];
