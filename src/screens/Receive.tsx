import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CHAIN_LIST, type ChainId } from '../lib/chains';
import { useWallet } from '../store/walletStore';
import { ChainBadge } from '../components/ui';

export default function Receive() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const accounts = useWallet((s) => s.accounts);
  const [chain, setChain] = useState<ChainId>((params.get('chain') as ChainId) || 'ethereum');
  const addr = accounts?.[chain]?.address || '';
  const cfg = CHAIN_LIST.find((c) => c.id === chain)!;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="p-2.5 card"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-extrabold">Receive</h1>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-6">
        {CHAIN_LIST.map((c) => (
          <button
            key={c.id}
            onClick={() => setChain(c.id)}
            className={`rounded-2xl border p-2.5 flex flex-col items-center gap-1 transition ${
              chain === c.id ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 bg-white'
            }`}
          >
            <ChainBadge chain={c.id} size={30} />
            <span className="text-[11px] font-bold">{c.symbol}</span>
          </button>
        ))}
      </div>

      <div className="card mt-4 p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <ChainBadge chain={chain} size={28} />
          <span className="font-bold">{cfg.name} address</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 mt-4 inline-block shadow-inner">
          {addr ? <QRCodeSVG value={addr} size={190} level="M" /> : <div className="w-[190px] h-[190px] bg-slate-100 animate-pulse rounded-2xl" />}
        </div>
        <div className="mt-4 bg-slate-50 rounded-2xl p-3.5 font-mono text-[13px] break-all select-all">{addr}</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => { navigator.clipboard.writeText(addr); toast.success('Address copied'); }}
            className="btn-secondary !py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Copy size={15} /> Copy
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.share({ title: `My ${cfg.symbol} address`, text: addr });
              } catch {
                navigator.clipboard.writeText(addr);
                toast.success('Address copied');
              }
            }}
            className="btn-secondary !py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 mt-4 text-xs text-rose-800 leading-relaxed">
        ⚠️ Only send <b>{cfg.symbol} on {cfg.name}</b> to this address. Sending any other asset or network will result
        in permanent loss.
      </div>
    </div>
  );
}
