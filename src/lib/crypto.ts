import * as bip39 from 'bip39';
import { HDNodeWallet } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as tinysecp from 'tiny-secp256k1';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import type { ChainId } from './chains';
import { CHAINS } from './chains';

const bip32 = BIP32Factory(tinysecp as any);

export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 12 words
}

export function validateMnemonic(m: string): boolean {
  return bip39.validateMnemonic(m.trim().toLowerCase().replace(/\s+/g, ' '));
}

function seedFromMnemonic(mnemonic: string): Buffer {
  return bip39.mnemonicToSeedSync(normalize(mnemonic));
}

function normalize(m: string) {
  return m.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface DerivedAccount {
  chain: ChainId;
  address: string;
  publicKey: string;
  path: string;
}

/** Derive EVM (ETH/BNB share same address since same path) */
function deriveEVM(seed: Buffer, path: string): { address: string; privateKey: string; publicKey: string } {
  const node = HDNodeWallet.fromSeed(seed).derivePath(path);
  return { address: node.address, privateKey: node.privateKey, publicKey: node.publicKey };
}

function deriveBTC(seed: Buffer, path: string): { address: string; privateKey: string; publicKey: string } {
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(path);
  if (!child.publicKey) throw new Error('BTC derivation failed');
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: bitcoin.networks.bitcoin,
  });
  if (!address) throw new Error('BTC address failed');
  return {
    address,
    privateKey: child.privateKey ? Buffer.from(child.privateKey).toString('hex') : '',
    publicKey: Buffer.from(child.publicKey).toString('hex'),
  };
}

function deriveSOL(seed: Buffer, path: string): { address: string; privateKey: string; publicKey: string } {
  const derived = derivePath(path, seed.toString('hex'));
  const kp = Keypair.fromSeed(Buffer.from(derived.key));
  return {
    address: kp.publicKey.toBase58(),
    privateKey: Buffer.from(kp.secretKey).toString('hex'),
    publicKey: kp.publicKey.toBase58(),
  };
}

export function deriveAllAccounts(mnemonic: string): Record<ChainId, DerivedAccount> {
  const seed = seedFromMnemonic(mnemonic);
  const eth = deriveEVM(seed, CHAINS.ethereum.derivationPath);
  const bnb = deriveEVM(seed, CHAINS.bnb.derivationPath);
  const btc = deriveBTC(seed, CHAINS.bitcoin.derivationPath);
  const sol = deriveSOL(seed, CHAINS.solana.derivationPath);
  return {
    ethereum: { chain: 'ethereum', address: eth.address, publicKey: eth.publicKey, path: CHAINS.ethereum.derivationPath },
    bnb: { chain: 'bnb', address: bnb.address, publicKey: bnb.publicKey, path: CHAINS.bnb.derivationPath },
    bitcoin: { chain: 'bitcoin', address: btc.address, publicKey: btc.publicKey, path: CHAINS.bitcoin.derivationPath },
    solana: { chain: 'solana', address: sol.address, publicKey: sol.publicKey, path: CHAINS.solana.derivationPath },
  };
}

/** Get private key for signing (kept in memory only, never persisted in plaintext) */
export function getPrivateKey(mnemonic: string, chain: ChainId): string {
  const seed = seedFromMnemonic(mnemonic);
  if (chain === 'ethereum' || chain === 'bnb') {
    return deriveEVM(seed, CHAINS[chain].derivationPath).privateKey;
  }
  if (chain === 'bitcoin') return deriveBTC(seed, CHAINS.bitcoin.derivationPath).privateKey;
  return deriveSOL(seed, CHAINS.solana.derivationPath).privateKey;
}

export function maskAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
