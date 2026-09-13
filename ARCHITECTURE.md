# Architecture

## Principles

1. **Keys never leave the device.** The mnemonic lives in memory only while unlocked; at rest it is AES-256-GCM ciphertext in `localStorage`.
2. **No custodial backend.** All chain interaction is direct RPC from the client. Optional indexers only for prices/history/quotes.
3. **Portable core.** `src/lib` (derivation, signing, vault) has no React dependency — reusable in React Native / extensions.

## Data flow

```
Onboarding → bip39.generateMnemonic()
           → deriveAllAccounts()  [ethers HDNodeWallet | bip32+bitcoinjs p2wpkh | ed25519-hd-key+solana]
           → encryptSeed(pw) → localStorage vault + address meta

Unlock     → decryptSeed(vault, pw) → memory-only mnemonic → refresh()

Home       → fetchAllBalances(addresses)  [JsonRpcProvider.getBalance | Blockstream | Connection.getBalance]
           → fetchPrices()                [CoinGecko simple/price + 24h change, fallback table]

Send       → validate → estimate fee → sign locally → broadcast → explorer link + local history
  EVM: Wallet(priv, provider).sendTransaction
  SOL: Keypair.fromSecretKey → SystemProgram.transfer → sendRawTransaction
  BTC: Blockstream UTXOs → PSBT → signAllInputs → POST /tx
```

## Key derivation (SLIP-44)

| Chain | Path | Scheme |
|---|---|---|
| ETH/BNB | `m/44'/60'/0'/0/0` | secp256k1 (ethers HDNodeWallet) |
| BTC | `m/84'/0'/0'/0/0` | segwit v0 p2wpkh (bip32 + bitcoinjs-lib) |
| SOL | `m/44'/501'/0'/0'` | ed25519 (ed25519-hd-key + @solana/web3.js) |

## Storage

| Key | Contents | Sensitivity |
|---|---|---|
| `lidex.vault.v1` | `{iv, salt, data}` AES-GCM | high — needs password + KDF |
| `lidex.meta.v1` | derived addresses | low — public |
| `lidex.history.v1` | local send records | low |

## Production extensions

- **Swap execution:** new `src/lib/swap.ts` — 0x `GET /swap/quote` → populate tx → sign; Jupiter `/quote` + `/swap` → deserialize versioned tx → sign.
- **NFTs:** Alchemy `getNftsForOwner` (EVM), Helius/Metaplex DAS (SOL), Hiro/Ordinals API (BTC).
- **Staking:** `@solana/web3.js` stake program; Lido `submit()`; BNB `stakeBNB`.
- **WalletConnect:** `@walletconnect/sign-client` + `@walletconnect/utils` for `personal_sign`, `eth_sendTransaction`, `solana_signTransaction`.
- **Backend (optional):** thin proxy for API keys + price caching + push alerts; never handles seeds.
- **Mobile:** Capacitor wrapper now; migrate screens to React Native later — `lib/` moves unchanged.

## Testing strategy (recommended)

- Unit: derivation vectors (BIP-39 test mnemonics → expected addresses), vault encrypt/decrypt round-trip, fee math.
- Integration: sends on Sepolia / BSC testnet / Solana devnet / BTC testnet3 with faucet funds.
- E2E: Playwright onboarding → receive → mocked send → lock/unlock.
