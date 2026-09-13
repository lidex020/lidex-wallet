import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useWallet } from '../store/walletStore';
import { loadVault } from '../lib/vault';

export default function Onboarding() {
  const nav = useNavigate();
  const createWallet = useWallet((s) => s.createWallet);
  const importWallet = useWallet((s) => s.importWallet);
  const loading = useWallet((s) => s.loading);
  const [mode, setMode] = useState<'choice' | 'create' | 'import' | 'backup'>('choice');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phrase, setPhrase] = useState('');
  const [newMnemonic, setNewMnemonic] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [acked, setAcked] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasVault = !!loadVault();

  const doCreate = async () => {
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    try {
      const m = await createWallet(password);
      setNewMnemonic(m);
      setMode('backup');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const doImport = async () => {
    if (password.length < 8) return toast.error('Set a password (8+ chars) to encrypt your wallet');
    try {
      await importWallet(phrase, password);
      toast.success('Wallet imported');
      nav('/home');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <div className="px-6 pt-10 pb-8 text-center bg-[radial-gradient(600px_300px_at_50%_0%,rgba(34,197,94,0.25),transparent)]">
        <img src="/lidex-icon.png" alt="Lidex Wallet" className="w-72 mx-auto object-contain rounded-3xl" />
        <h1 className="text-4xl font-black mt-4 tracking-tight">Lidex</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="h-1.5 w-8 rounded-full bg-brand-500" />
          <span className="text-2xl font-black text-brand-500 tracking-tight">Wallet</span>
          <span className="h-1.5 w-8 rounded-full bg-brand-500" />
        </div>
        <p className="text-white/70 text-sm mt-3">Multi-chain • Non-custodial • You own your keys</p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] bg-white/10 rounded-full px-3 py-1.5 w-fit mx-auto">
          <ShieldCheck size={13} /> BTC • ETH • BNB • SOL
        </div>
      </div>

      <div className="flex-1 bg-[#f8fafc] text-slate-900 rounded-t-[28px] p-6 pb-10">
        {mode === 'choice' && (
          <>
            <h2 className="font-extrabold text-lg text-center">Get started</h2>
            <p className="text-sm text-slate-500 text-center mt-1 mb-6">
              Create a new wallet or import one with your 12-word recovery phrase.
            </p>
            <button onClick={() => setMode('create')} className="btn-primary flex items-center justify-center gap-2">
              <Plus size={18} /> Create new wallet
            </button>
            <button onClick={() => setMode('import')} className="btn-secondary mt-3 flex items-center justify-center gap-2">
              <Download size={18} /> Import existing wallet
            </button>
            {hasVault && (
              <Link to="/unlock" className="block text-center text-sm font-semibold text-brand-600 mt-5">
                I already have a wallet on this device → Unlock
              </Link>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
              Your recovery phrase never leaves this device. It is encrypted with AES-256-GCM and your password. Never
              share it with anyone.
            </p>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 className="font-extrabold text-lg">Secure your wallet</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">This password encrypts your keys on this device.</p>
            <label className="text-xs font-bold text-slate-500">PASSWORD</label>
            <div className="relative mt-1.5 mb-4">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <label className="text-xs font-bold text-slate-500">CONFIRM PASSWORD</label>
            <input
              type={showPw ? 'text' : 'password'}
              className="input mt-1.5"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button onClick={doCreate} disabled={loading} className="btn-primary mt-6">
              {loading ? 'Generating secure keys…' : 'Create wallet'}
            </button>
            <button onClick={() => setMode('choice')} className="w-full text-center text-sm font-semibold text-slate-400 mt-4">
              ← Back
            </button>
          </>
        )}

        {mode === 'backup' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[13px] text-amber-800 font-medium">
              ⚠️ Write these 12 words on paper and store offline. Anyone with them can steal your funds. Never screenshot
              or send them to anyone.
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {newMnemonic.split(' ').map((w, i) => (
                <div key={i} className="seed-chip">
                  <span className="text-slate-400 text-xs w-4">{i + 1}</span> {w}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newMnemonic);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-secondary mt-4 flex items-center justify-center gap-2 !py-2.5 text-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <label className="flex items-start gap-2.5 mt-5 text-sm cursor-pointer">
              <input type="checkbox" checked={acked} onChange={(e) => setAcked(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
              I have safely backed up my recovery phrase.
            </label>
            <button onClick={() => nav('/home')} disabled={!acked} className="btn-primary mt-4">
              Continue to wallet
            </button>
          </>
        )}

        {mode === 'import' && (
          <>
            <h2 className="font-extrabold text-lg">Import wallet</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">Enter your 12-word recovery phrase, words separated by spaces.</p>
            <textarea
              className="input min-h-[110px] resize-none"
              placeholder="abandon abandon abandon …"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
            <label className="text-xs font-bold text-slate-500 mt-4 block">NEW DEVICE PASSWORD</label>
            <input
              type={showPw ? 'text' : 'password'}
              className="input mt-1.5"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={doImport} disabled={loading} className="btn-primary mt-5">
              {loading ? 'Importing…' : 'Import wallet'}
            </button>
            <button onClick={() => setMode('choice')} className="w-full text-center text-sm font-semibold text-slate-400 mt-4">
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
