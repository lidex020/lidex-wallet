import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, ExternalLink, ScanLine } from 'lucide-react';
import { DAPPS } from '../lib/tokens';

export default function Discover() {
  const [q, setQ] = useState('');
  const [wc, setWc] = useState('');
  const filtered = DAPPS.filter((d) => (d.name + d.category + d.desc).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-extrabold">Discover</h1>
      <p className="text-sm text-slate-500">Explore dApps and connect via WalletConnect</p>

      <div className="relative mt-4">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dApps" className="input !pl-11" />
      </div>

      <div className="card mt-4 p-4">
        <div className="font-bold text-sm flex items-center gap-2"><ScanLine size={15} /> WalletConnect</div>
        <p className="text-xs text-slate-500 mt-1">Paste a pairing URI from any dApp to connect this wallet.</p>
        <div className="flex gap-2 mt-2.5">
          <input value={wc} onChange={(e) => setWc(e.target.value)} placeholder="wc:…" className="input !py-2.5 text-xs font-mono" />
          <button
            onClick={() => {
              if (!wc.startsWith('wc:')) return toast.error('Invalid WalletConnect URI');
              toast.success('Pairing URI accepted (demo). Add VITE_WALLETCONNECT_PROJECT_ID + @walletconnect/sign-client for live sessions.');
              setWc('');
            }}
            className="bg-ink text-white text-xs font-bold px-4 rounded-2xl whitespace-nowrap"
          >
            Connect
          </button>
        </div>
      </div>

      <div className="space-y-2.5 mt-4">
        {filtered.map((d) => (
          <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="card p-4 flex items-center gap-3 hover:shadow-lg transition">
            <div className="w-11 h-11 rounded-2xl text-white font-black flex items-center justify-center text-lg" style={{ background: d.color }}>
              {d.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] flex items-center gap-2">{d.name}<span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">{d.category}</span></div>
              <div className="text-xs text-slate-500 truncate">{d.desc}</div>
            </div>
            <ExternalLink size={16} className="text-slate-300" />
          </a>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
