export type ChainId = 'ethereum' | 'bnb' | 'bitcoin' | 'solana';

export interface ChainConfig {
  id: ChainId;
  name: string;
  symbol: string;
  decimals: number;
  coinType: number; // SLIP-44
  derivationPath: string;
  rpcUrl: string;
  explorer: string;
  color: string;
  icon: string; // emoji/SVG fallback
}

const env = (k: string, fallback: string) => (import.meta.env as any)[k] || fallback;

export const CHAINS: Record<ChainId, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    coinType: 60,
    derivationPath: "m/44'/60'/0'/0/0",
    rpcUrl: env('VITE_ETH_RPC', 'https://ethereum.publicnode.com'),
    explorer: 'https://etherscan.io',
    color: '#627EEA',
    icon: 'Ξ',
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    coinType: 60,
    derivationPath: "m/44'/60'/0'/0/0",
    rpcUrl: env('VITE_BNB_RPC', 'https://bsc.publicnode.com'),
    explorer: 'https://bscscan.com',
    color: '#F0B90B',
    icon: 'B',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    coinType: 0,
    derivationPath: "m/84'/0'/0'/0/0", // native segwit
    rpcUrl: env('VITE_BTC_API', 'https://blockstream.info/api'),
    explorer: 'https://mempool.space',
    color: '#F7931A',
    icon: '₿',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    coinType: 501,
    derivationPath: "m/44'/501'/0'/0'",
    rpcUrl: env('VITE_SOL_RPC', 'https://api.mainnet-beta.solana.com'),
    explorer: 'https://solscan.io',
    color: '#14F195',
    icon: '◎',
  },
};

export const CHAIN_LIST = Object.values(CHAINS);

export const COINGECKO_IDS: Record<ChainId, string> = {
  ethereum: 'ethereum',
  bnb: 'binancecoin',
  bitcoin: 'bitcoin',
  solana: 'solana',
};
