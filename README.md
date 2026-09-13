# Lidex Wallet — Multi-Chain Non-Custodial Wallet

A multi-chain non-custodial wallet with **BTC + ETH + BNB + SOL**, plus **Send / Receive / Swap / Earn / NFTs / dApp discovery / Activity**, in a mobile-first UI.

> ⚠️ **Alpha software.** Real cryptography is implemented (BIP-39, HD derivation, AES-256-GCM vault), and mainnet sends work — but get a professional security audit + bug bounty before promoting to real users with significant funds.

## Quick start

```bash
cd lidex-wallet
npm install
cp .env.example .env   # optional — defaults use public RPCs
npm run dev            # → http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## What works out of the box

| Feature | Status |
|---|---|
| Create / import wallet (12-word BIP-39) | ✅ real |
| HD addresses: ETH/BNB (`m/44'/60'…`), BTC native-segwit (`m/84'/0'…`), SOL (`m/44'/501'…`) | ✅ real |
| Encrypted vault (AES-256-GCM + PBKDF2 210k), auto-lock | ✅ real |
| Live balances (public RPCs + Blockstream) + CoinGecko prices | ✅ real |
| Send ETH / BNB / SOL / BTC (fee estimation + explorer link) | ✅ real mainnet |
| Receive with QR + copy/share | ✅ real |
| Swap screen with indicative quotes | 🟡 demo quotes — wire 0x/Jupiter key for execution (see `src/screens/Swap.tsx`) |
| Earn / staking screen | 🟡 UI + reward math — wire native delegation txs for prod |
| NFTs screen | 🟡 curated preview — add `VITE_ALCHEMY_KEY` for live fetch |
| Discover + WalletConnect pairing input | 🟡 UI — add `@walletconnect/sign-client` + project ID for live sessions |
| Activity (BTC live + local history) | 🟡 partial — add Etherscan/Alchemy/Helius keys for full EVM/SOL history |

## Project structure

```
src/
  lib/
    chains.ts     chain configs + RPCs
    crypto.ts     BIP-39 + HD derivation (ethers / bitcoinjs / solana)
    vault.ts      AES-GCM encrypted storage
    balances.ts   RPC balance fetching
    prices.ts     CoinGecko with offline fallback
    tx.ts         send + fee estimation + broadcast
    tokens.ts     token lists, staking options, dApps
  store/
    walletStore.ts  zustand state (seed in memory only)
  components/     Layout, TokenRow, ChainBadge…
  screens/        Onboarding, Unlock, Home, Send, Receive, Swap, Earn, Nfts, Discover, Activity, Settings
```

## Going production

1. **Keys:** add `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_0X_API_KEY`, `VITE_ALCHEMY_KEY`, Helius/Etherscan keys.
2. **Swap:** implement `src/lib/swap.ts`: 0x quote → `approve` → send tx; Jupiter for Solana; LI.FI for cross-chain.
3. **Staking:** SOL stake-program delegate, Lido/RocketPool deposits, BNB stake.
4. **History/indexing:** Alchemy Transfers API (EVM), Helius (SOL), Blockstream (BTC done).
5. **Hardening:** see `SECURITY.md` — audit, CSP, transaction simulation (Blowfish), phishing lists, Sentry, E2E tests.
6. **Mobile:** wrap with Capacitor / React Native (core in `lib/` is portable).

## Scripts

- `npm run dev` — dev server (host 0.0.0.0:5173)
- `npm run build` — typecheck + production build

## Disclaimer

Non-custodial: you hold your keys, you bear the risk. Not financial advice. Verify every address and start with small test amounts.
