import { create } from 'zustand';
import type { ChainId } from '../lib/chains';
import { CHAINS } from '../lib/chains';
import { deriveAllAccounts, generateMnemonic, validateMnemonic, type DerivedAccount } from '../lib/crypto';
import { encryptSeed, decryptSeed, saveVault, loadVault, clearVault, type VaultBlob } from '../lib/vault';
import { fetchAllBalances } from '../lib/balances';
import { fetchPrices, type PriceInfo } from '../lib/prices';

type Status = 'onboarding' | 'locked' | 'unlocked';

interface WalletState {
  status: Status;
  mnemonic: string | null;
  accounts: Record<ChainId, DerivedAccount> | null;
  balances: Record<ChainId, number>;
  prices: Record<ChainId, PriceInfo>;
  loading: boolean;
  refreshing: boolean;
  hideBalance: boolean;
  currency: 'USD';
  error: string | null;
  lastRefresh: number | null;

  init: () => void;
  createWallet: (password: string) => Promise<string>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
  toggleHide: () => void;
  totalUsd: () => number;
}

const META_KEY = 'lidex.meta.v1';
const LEGACY_META_KEY = 'trustclone.meta.v1'; // pre-rebrand wallets

function saveMeta(accounts: Record<ChainId, DerivedAccount>) {
  localStorage.setItem(META_KEY, JSON.stringify({ accounts, savedAt: Date.now() }));
  localStorage.removeItem(LEGACY_META_KEY);
}
function loadMeta(): Record<ChainId, DerivedAccount> | null {
  try {
    let raw = localStorage.getItem(META_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_META_KEY); // migrate
      if (raw) {
        localStorage.setItem(META_KEY, raw);
        localStorage.removeItem(LEGACY_META_KEY);
      }
    }
    if (!raw) return null;
    return (JSON.parse(raw) as any).accounts ?? null;
  } catch {
    return null;
  }
}

let lockTimer: any = null;
function armAutoLock(lock: () => void, minutes = 10) {
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(lock, minutes * 60 * 1000);
}

export const useWallet = create<WalletState>((set, get) => ({
  status: 'onboarding',
  mnemonic: null,
  accounts: null,
  balances: { ethereum: 0, bnb: 0, bitcoin: 0, solana: 0 },
  prices: {
    ethereum: { usd: 0, change24h: 0 },
    bnb: { usd: 0, change24h: 0 },
    bitcoin: { usd: 0, change24h: 0 },
    solana: { usd: 0, change24h: 0 },
  },
  loading: false,
  refreshing: false,
  hideBalance: false,
  currency: 'USD',
  error: null,
  lastRefresh: null,

  init: () => {
    const vault = loadVault();
    const meta = loadMeta();
    if (vault && meta) set({ status: 'locked', accounts: meta });
    else set({ status: 'onboarding' });
    // fetch prices even before unlock for nice onboarding
    fetchPrices().then((prices) => set({ prices })).catch(() => undefined);
  },

  createWallet: async (password: string) => {
    set({ loading: true, error: null });
    try {
      const mnemonic = generateMnemonic();
      const accounts = deriveAllAccounts(mnemonic);
      const blob: VaultBlob = await encryptSeed(mnemonic, password);
      saveVault(blob);
      saveMeta(accounts);
      set({ status: 'unlocked', mnemonic, accounts, loading: false });
      armAutoLock(get().lock);
      get().refresh();
      return mnemonic;
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Failed to create wallet' });
      throw e;
    }
  },

  importWallet: async (mnemonic: string, password: string) => {
    const clean = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!validateMnemonic(clean)) throw new Error('Invalid recovery phrase. Check all 12 words.');
    set({ loading: true, error: null });
    try {
      const accounts = deriveAllAccounts(clean);
      const blob = await encryptSeed(clean, password);
      saveVault(blob);
      saveMeta(accounts);
      set({ status: 'unlocked', mnemonic: clean, accounts, loading: false });
      armAutoLock(get().lock);
      get().refresh();
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Import failed' });
      throw e;
    }
  },

  unlock: async (password: string) => {
    set({ loading: true, error: null });
    try {
      const vault = loadVault();
      if (!vault) throw new Error('No wallet found. Create or import one.');
      const mnemonic = await decryptSeed(vault, password);
      if (!validateMnemonic(mnemonic)) throw new Error('Decryption failed — wrong password?');
      const accounts = deriveAllAccounts(mnemonic);
      saveMeta(accounts);
      set({ status: 'unlocked', mnemonic, accounts, loading: false });
      armAutoLock(get().lock);
      get().refresh();
    } catch (e: any) {
      const msg = /operation|decrypt|malformed|error/i.test(e?.message || '')
        ? 'Wrong password. Try again.'
        : e?.message || 'Unlock failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  lock: () => {
    if (lockTimer) clearTimeout(lockTimer);
    set({ status: loadVault() ? 'locked' : 'onboarding', mnemonic: null, error: null });
  },

  logout: () => {
    clearVault();
    if (lockTimer) clearTimeout(lockTimer);
    set({
      status: 'onboarding',
      mnemonic: null,
      accounts: null,
      balances: { ethereum: 0, bnb: 0, bitcoin: 0, solana: 0 },
      error: null,
    });
  },

  refresh: async () => {
    const { accounts, refreshing } = get();
    if (!accounts || refreshing) return;
    set({ refreshing: true });
    try {
      const addresses: Record<ChainId, string> = {
        ethereum: accounts.ethereum.address,
        bnb: accounts.bnb.address,
        bitcoin: accounts.bitcoin.address,
        solana: accounts.solana.address,
      };
      const [balances, prices] = await Promise.all([
        fetchAllBalances(addresses),
        fetchPrices().catch(() => get().prices),
      ]);
      set({ balances, prices, lastRefresh: Date.now(), refreshing: false });
    } catch {
      set({ refreshing: false });
    }
  },

  toggleHide: () => set((s) => ({ hideBalance: !s.hideBalance })),

  totalUsd: () => {
    const { balances, prices } = get();
    return (Object.keys(balances) as ChainId[]).reduce(
      (sum, c) => sum + (balances[c] || 0) * (prices[c]?.usd || 0),
      0
    );
  },
}));

export function chainAddress(accounts: Record<ChainId, DerivedAccount> | null, c: ChainId): string {
  return accounts?.[c]?.address ?? '';
}
export function chainName(c: ChainId): string {
  return CHAINS[c].name;
}
