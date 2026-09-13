import { useState } from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useWallet } from '../store/walletStore';

const DEMO_NFTS = [
  { name: 'Neon Ape #1337', collection: 'Neon Apes', chain: 'Ethereum', gradient: 'from-violet-500 to-fuchsia-500', emoji: '🦍' },
  { name: 'Solana Monkey #42', collection: 'SMB', chain: 'Solana', gradient: 'from-amber-400 to-orange-600', emoji: '🐵' },
  { name: 'BTC Ordinal #888', collection: 'Ordinals', chain: 'Bitcoin', gradient: 'from-orange-400 to-rose-500', emoji: '👾' },
  { name: 'BNB Punk #7', collection: 'BNB Punks', chain: 'BNB Chain', gradient: 'from-sky-400 to-blue-600', emoji: '🤖' },
];

export default function Nfts() {
  const accounts = useWallet((s) => s.accounts);
  const [tab, setTab] = useState<'all' | string>('all');

  const list = tab === 'all' ? DEMO_NFTS : DEMO_NFTS.filter((n) => n.chain === tab);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-extrabold">NFTs</h1>
      <p className="text-sm text-slate-500">Collectibles across all networks</p>

      <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
        {['all', 'Ethereum', 'BNB Chain', 'Solana', 'Bitcoin'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
              tab === t ? 'bg-ink text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3.5 mt-4 text-xs text-brand-900">
        <b>Live mode:</b> add <code>VITE_ALCHEMY_KEY</code> to fetch real NFTs via Alchemy (EVM + Solana). Showing curated
        preview below for <span className="font-mono">{accounts?.ethereum.address.slice(0, 10)}…</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {list.map((n, i) => (
          <div key={i} className="card overflow-hidden">
            <div className={`h-36 bg-gradient-to-br ${n.gradient} flex items-center justify-center text-5xl`}>{n.emoji}</div>
            <div className="p-3">
              <div className="font-bold text-sm truncate">{n.name}</div>
              <div className="text-[11px] text-slate-500">{n.collection} • {n.chain}</div>
              <button className="mt-2 text-[11px] font-bold text-brand-600 flex items-center gap-1">
                View <ExternalLink size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="card mt-4 p-8 text-center">
          <ImageIcon className="mx-auto text-slate-300" size={36} />
          <div className="font-bold mt-2">No NFTs on {tab}</div>
          <div className="text-sm text-slate-500">They'll appear here once you own some.</div>
        </div>
      )}
    </div>
  );
}
