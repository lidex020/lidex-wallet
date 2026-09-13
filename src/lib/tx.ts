import axios from 'axios';
import { JsonRpcProvider, Wallet, parseEther, formatEther } from 'ethers';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import { Buffer } from 'buffer';
import { CHAINS } from './chains';
import { getPrivateKey, deriveAllAccounts } from './crypto';

const ECPair = ECPairFactory(tinysecp as any);

export async function sendEvm(
  chain: 'ethereum' | 'bnb',
  mnemonic: string,
  to: string,
  amount: string
): Promise<string> {
  const provider = new JsonRpcProvider(CHAINS[chain].rpcUrl);
  const priv = getPrivateKey(mnemonic, chain);
  const wallet = new Wallet(priv, provider);
  const tx = await wallet.sendTransaction({ to, value: parseEther(amount) });
  await tx.wait(1).catch(() => undefined);
  return tx.hash;
}

export async function estimateEvmFee(chain: 'ethereum' | 'bnb'): Promise<string> {
  try {
    const provider = new JsonRpcProvider(CHAINS[chain].rpcUrl);
    const fee = await provider.getFeeData();
    const gas = 21000n;
    const price = fee.maxFeePerGas ?? fee.gasPrice ?? 0n;
    return formatEther(gas * price);
  } catch {
    return chain === 'ethereum' ? '0.0008' : '0.00015';
  }
}

export async function sendSol(mnemonic: string, to: string, amountSol: number): Promise<string> {
  const conn = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
  const hex = getPrivateKey(mnemonic, 'solana');
  const secret = Uint8Array.from(Buffer.from(hex, 'hex'));
  const kp = Keypair.fromSecretKey(secret);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: kp.publicKey,
      toPubkey: new PublicKey(to),
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );
  tx.feePayer = kp.publicKey;
  const { blockhash } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(kp);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, 'confirmed').catch(() => undefined);
  return sig;
}

interface Utxo {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

export async function sendBtc(mnemonic: string, to: string, amountBtc: number, feeRateSatVb = 8): Promise<string> {
  const base = CHAINS.bitcoin.rpcUrl;
  const accounts = deriveAllAccounts(mnemonic);
  const from = accounts.bitcoin.address;
  const privHex = getPrivateKey(mnemonic, 'bitcoin');
  const key = ECPair.fromPrivateKey(Buffer.from(privHex, 'hex'));
  const network = bitcoin.networks.bitcoin;
  const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(key.publicKey), network });
  if (!p2wpkh.output || !p2wpkh.address) throw new Error('BTC signer init failed');

  const { data: utxos } = await axios.get<Utxo[]>(`${base}/address/${from}/utxo`, { timeout: 10000 });
  if (!utxos.length) throw new Error('No UTXOs — fund this address first.');

  const amountSat = Math.round(amountBtc * 1e8);
  const psbt = new bitcoin.Psbt({ network });
  let inputSum = 0;
  for (const u of utxos) {
    psbt.addInput({
      hash: u.txid,
      index: u.vout,
      witnessUtxo: { script: p2wpkh.output, value: u.value },
    });
    inputSum += u.value;
    // rough vsize: 68 per input + 31 per output + 10
    const estVsize = psbt.inputCount * 68 + 2 * 31 + 10;
    if (inputSum >= amountSat + estVsize * feeRateSatVb) break;
  }
  const estVsize = psbt.inputCount * 68 + 2 * 31 + 10;
  const fee = estVsize * feeRateSatVb;
  if (inputSum < amountSat + fee) throw new Error(`Insufficient BTC (need ${(amountSat + fee) / 1e8})`);
  const change = inputSum - amountSat - fee;

  psbt.addOutput({ address: to, value: amountSat });
  if (change > 546) psbt.addOutput({ address: from, value: change });

  psbt.signAllInputs(key as any);
  psbt.finalizeAllInputs();
  const hex = psbt.extractTransaction().toHex();
  const { data: txid } = await axios.post(`${base}/tx`, hex, {
    headers: { 'Content-Type': 'text/plain' },
    timeout: 15000,
  });
  return typeof txid === 'string' ? txid : String(txid);
}

export async function fetchBtcFeeEstimate(): Promise<number> {
  try {
    const { data } = await axios.get(`${CHAINS.bitcoin.rpcUrl}/fee-estimates`, { timeout: 8000 });
    return Math.round(data?.['6'] ?? data?.['3'] ?? 8);
  } catch {
    return 8;
  }
}

export function explorerTxUrl(chain: 'ethereum' | 'bnb' | 'bitcoin' | 'solana', hash: string): string {
  const base = CHAINS[chain].explorer;
  if (chain === 'ethereum' || chain === 'bnb') return `${base}/tx/${hash}`;
  if (chain === 'bitcoin') return `${base}/tx/${hash}`;
  return `${base}/tx/${hash}`;
}
