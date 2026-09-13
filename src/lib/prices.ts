import axios from 'axios';
import { COINGECKO_IDS, type ChainId } from './chains';

// Fallback mock prices (used offline / rate-limited)
const FALLBACK: Record<ChainId, { usd: number; change24h: number }> = {
  bitcoin: { usd: 97400, change24h: 1.8 },
  ethereum: { usd: 3420, change24h: 2.4 },
  bnb: { usd: 695, change24h: -0.6 },
  solana: { usd: 214, change24h: 3.1 },
};

export interface PriceInfo {
  usd: number;
  change24h: number;
  sparkline?: number[];
}

export async function fetchPrices(): Promise<Record<ChainId, PriceInfo>> {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids,
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_sparkline: false,
      },
      timeout: 8000,
    });
    const out = {} as Record<ChainId, PriceInfo>;
    (Object.keys(COINGECKO_IDS) as ChainId[]).forEach((c) => {
      const g = data[COINGECKO_IDS[c]];
      out[c] = g
        ? { usd: g.usd ?? FALLBACK[c].usd, change24h: g.usd_24h_change ?? FALLBACK[c].change24h }
        : { ...FALLBACK[c] };
    });
    return out;
  } catch {
    return {
      bitcoin: { ...FALLBACK.bitcoin },
      ethereum: { ...FALLBACK.ethereum },
      bnb: { ...FALLBACK.bnb },
      solana: { ...FALLBACK.solana },
    };
  }
}

export function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(4)}`;
}
