# Security

## Threat model

- **Protects against:** casual device access (password + encryption), network eavesdropping (HTTPS RPCs), accidental loss (recovery phrase backup flow).
- **Does NOT yet protect against:** compromised device/OS, clipboard stealers, malicious RPC responses, phishing dApps, supply-chain attacks on dependencies. A production wallet needs the hardening below + an external audit.

## Implemented

- BIP-39 mnemonic generated with audited `bip39` lib (128-bit entropy, 12 words).
- Standard HD paths; `bitcoinjs-lib` + `ethers` + `@solana/web3.js` — all widely audited.
- Vault: AES-256-GCM, random 16-byte salt + 12-byte IV per encryption, PBKDF2-SHA256 210,000 iterations (OWASP 2023 guidance).
- Seed exists in plaintext only in memory while unlocked; `lock()` wipes it; 10-minute auto-lock.
- No analytics, no seed transmission — verify with DevTools Network tab.

## Before mainnet launch — checklist

- [ ] External audit of `lib/crypto.ts`, `lib/vault.ts`, `lib/tx.ts` + dependency review (`npm audit`, Socket).
- [ ] Content-Security-Policy + `trusted-types`; block inline injection; serve over HTTPS only.
- [ ] Transaction simulation + warnings (Blowfish/Hexagate) before every send/swap/dApp signature.
- [ ] Address poisoning + token scam lists (e.g. head-warning on first-interaction addresses).
- [ ] Biometric unlock (WebAuthn) instead of password-only; Argon2id option.
- [ ] Testnet E2E suite (Sepolia, BSC Chapel, devnet, testnet3) in CI.
- [ ] Bug bounty (Immunefi) + responsible disclosure contact.
- [ ] Signed builds / reproducible builds for mobile + extension releases.
- [ ] Incident plan: RPC compromise, dependency CVE, key-rotation guidance for users.

## User guidance (show in-app)

1. Write your 12 words on paper, offline. Never type them anywhere except restore.
2. Start with a tiny test transaction on each network.
3. Bookmark dApps; never connect from links in DMs.
4. Verify the full address on a second channel for large sends.
5. Updates only from official builds.

## Reporting

Found a vulnerability? Please do NOT open a public issue — rotate any exposed keys immediately and contact the maintainer privately.
