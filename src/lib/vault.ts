/**
 * Encrypted vault: AES-GCM 256 with PBKDF2 (210k iterations, SHA-256).
 * Stores { ciphertext, iv, salt } as base64 in localStorage.
 * Seed NEVER leaves device unencrypted.
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function b64e(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function b64d(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', ENC.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 210000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface VaultBlob {
  v: 1;
  iv: string;
  salt: string;
  data: string;
  createdAt: number;
}

export async function encryptSeed(mnemonic: string, password: string): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ENC.encode(mnemonic));
  return { v: 1, iv: b64e(iv), salt: b64e(salt), data: b64e(ct), createdAt: Date.now() };
}

export async function decryptSeed(blob: VaultBlob, password: string): Promise<string> {
  const key = await deriveKey(password, b64d(blob.salt));
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64d(blob.iv) as BufferSource },
    key,
    b64d(blob.data) as BufferSource
  );
  return DEC.decode(pt);
}

const LS_KEY = 'lidex.vault.v1';
const LEGACY_VAULT_KEY = 'trustclone.vault.v1'; // pre-rebrand wallets
const LEGACY_META_KEY = 'trustclone.meta.v1';

export function saveVault(blob: VaultBlob) {
  localStorage.setItem(LS_KEY, JSON.stringify(blob));
  localStorage.removeItem(LEGACY_VAULT_KEY);
}
export function loadVault(): VaultBlob | null {
  try {
    let raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // migrate pre-rebrand vault
      raw = localStorage.getItem(LEGACY_VAULT_KEY);
      if (raw) {
        localStorage.setItem(LS_KEY, raw);
        localStorage.removeItem(LEGACY_VAULT_KEY);
      }
    }
    if (!raw) return null;
    return JSON.parse(raw) as VaultBlob;
  } catch {
    return null;
  }
}
export function clearVault() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem('lidex.meta.v1');
  localStorage.removeItem('lidex.history.v1');
  localStorage.removeItem(LEGACY_VAULT_KEY);
  localStorage.removeItem(LEGACY_META_KEY);
  localStorage.removeItem('trustclone.history.v1');
}
