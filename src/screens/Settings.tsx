import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, Lock, LogOut, ShieldCheck, Copy, Trash2 } from 'lucide-react';
import { useWallet } from '../store/walletStore';
import { loadVault, decryptSeed } from '../lib/vault';
import { CHAIN_LIST } from '../lib/chains';
import { maskAddress } from '../lib/crypto';

export default function Settings() {
  const nav = useNavigate();
  const { lock, logout, hideBalance, toggleHide, accounts } = useWallet();
  const [pw, setPw] = useState('');
  const [revealed, setRevealed] = useState('');

  const reveal = async () => {
    try {
      const v = loadVault();
      if (!v) return toast.error('No vault');
      const m = await decryptSeed(v, pw);
      setRevealed(m);
    } catch {
      toast.error('Wrong password');
    }
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="p-2.5 card"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-extrabold">Settings</h1>
      </div>

      <div className="card mt-5 divide-y divide-slate-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Eye size={17} /></span>
            <span className="font-bold text-sm">Hide balance</span>
          </div>
          <button onClick={toggleHide} className={`w-12 h-7 rounded-full transition ${hideBalance ? 'bg-brand-600' : 'bg-slate-200'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full mt-1 transition-all ${hideBalance ? 'ml-6' : 'ml-1'}`} />
          </button>
        </div>
        <button onClick={() => { lock(); nav('/unlock'); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50">
          <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Lock size={17} /></span>
          <span className="font-bold text-sm">Lock wallet now</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={17} /></span>
          <div>
            <div className="font-bold text-sm">Security</div>
            <div className="text-[11px] text-slate-500">AES-256-GCM • PBKDF2 210k • Auto-lock 10 min • Keys never leave device</div>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-[15px] mt-6 mb-2">My addresses</h3>
      <div className="card divide-y divide-slate-50 overflow-hidden">
        {CHAIN_LIST.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ background: c.color }}>{c.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">{c.name}</div>
              <div className="text-[11px] font-mono text-slate-500 truncate">{maskAddress(accounts?.[c.id]?.address || '')}</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(accounts?.[c.id]?.address || ''); toast.success(`${c.symbol} address copied`); }}
              className="p-2 text-slate-400 hover:text-brand-600"
            >
              <Copy size={15} />
            </button>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-[15px] mt-6 mb-2">Recovery phrase</h3>
      <div className="card p-4">
        {!revealed ? (
          <>
            <p className="text-xs text-slate-500">Enter your password to reveal. Never share these words.</p>
            <div className="flex gap-2 mt-2.5">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="input !py-2.5 text-sm" />
              <button onClick={reveal} className="bg-ink text-white text-xs font-bold px-4 rounded-2xl">Reveal</button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {revealed.split(' ').map((w, i) => (
                <div key={i} className="seed-chip !py-1.5 text-xs"><span className="text-slate-400">{i + 1}</span> {w}</div>
              ))}
            </div>
            <button onClick={() => { setRevealed(''); setPw(''); }} className="text-xs font-bold text-slate-400 mt-3">Hide</button>
          </>
        )}
      </div>

      <button
        onClick={() => {
          if (confirm('Remove wallet from this device? You need your recovery phrase to restore.')) {
            logout();
            nav('/onboarding');
          }
        }}
        className="w-full mt-6 mb-2 bg-rose-50 text-rose-600 font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm"
      >
        <Trash2 size={16} /> Remove wallet from device
      </button>
      <p className="text-center text-[11px] text-slate-400 pb-4">Lidex Wallet v1.0 • Non-custodial • DYOR, not financial advice</p>
    </div>
  );
}
