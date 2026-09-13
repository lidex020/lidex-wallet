import axios from 'axios';
import { JsonRpcProvider, formatEther, formatUnits } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { CHAINS, type ChainId } from './chains';

const providerCache: Partial<Record<ChainId, JsonRpcProvider>> = {};
function evmProvider(chain: ChainId): JsonRpcProvider {
  if (!providerCache[chain]) providerCache[chain] = new JsonRpcProvider(CHAINS[chain].rpcUrl);
  return providerCache[chain]!;
}

export async function fetchEvmBalance(chain: 'ethereum' | 'bnb', address: string): Promise<number> {
  try {
    const bal = await evmProvider(chain).getBalance(address);
    return parseFloat(formatEther(bal));
  } catch {
    return 0;
  }
}

export async function fetchBtcBalance(address: string): Promise<number> {
  try {
    const base = CHAINS.bitcoin.rpcUrl;
    const { data } = await axios.get(`${base}/address/${address}`, { timeout: 8000 });
    const funded = data?.chain_stats?.funded_txo_sum ?? 0;
    const spent = data?.chain_stats?.spent_txo_sum ?? 0;
    return (funded - spent) / 1e8;
  } catch {
    return 0;
  }
}

export async function fetchSolBalance(address: string): Promise<number> {
  try {
    const conn = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
    const lamports = await conn.getBalance(new PublicKey(address));
    return lamports / 1e9;
  } catch {
    return 0;
  }
}

export async function fetchAllBalances(addresses: Record<ChainId, string>): Promise<Record<ChainId, number>> {
  const [eth, bnb, btc, sol] = await Promise.all([
    fetchEvmBalance('ethereum', addresses.ethereum),
    fetchEvmBalance('bnb', addresses.bnb),
    fetchBtcBalance(addresses.bitcoin),
    fetchSolBalance(addresses.solana),
  ]);
  return { ethereum: eth, bnb, bitcoin: btc, solana: sol };
}

export async function fetchErc20Balance(
  chain: 'ethereum' | 'bnb',
  tokenAddress: string,
  walletAddress: string,
  decimals = 18
): Promise<number> {
  try {
    const provider = evmProvider(chain);
    const iface = ['function balanceOf(address) view returns (uint256)'];
    const { Contract } = await import('ethers');
    const c = new Contract(tokenAddress, iface, provider);
    const bal = await c.balanceOf(walletAddress);
    return parseFloat(formatUnits(bal, decimals));
  } catch {
    return 0;
  }
}
