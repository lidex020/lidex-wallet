import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { CHAINS, type ChainId } from '../lib/chains';
import { useWallet } from '../store/walletStore';
import { ChainBadge } from '../components/ui';
import { explorerTxUrl } from '../lib/tx';
import { maskAddress } from '../lib/crypto';

interface HistItem {
  chain: ChainId;
  hash: string;
  to?: string;
  amount?: number;
  dir: 'sent' | 'received';
  ts: number;
  pending?: boolean;
}

function localHistory(): HistItem[] {
  try {
    return JSON.parse(
      localStorage.getItem('lidex.history.v1') || localStorage.getItem('trustclone.history.v1') || '[]'
    );
  } catch {
    return [];
  }
}

export default function Activity() {
  const nav = useNavigate();
  const accounts = useWallet((s) => s.accounts);
  const [items, setItems] = useState<HistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const local = localHistory();
      let btc: HistItem[] = [];
      try {
        if (accounts?.bitcoin.address) {
          const { data } = await axios.get(`${CHAINS.bitcoin.rpcUrl}/address/${accounts.bitcoin.address}/txs`, { timeout: 8000 });
          btc = (Array.isArray(data) ? data.slice(0, 10) : []).map((t: any) => ({
            chain: 'bitcoin' as ChainId,
            hash: t.txid,
            ts: (t.status?.block_time || Date.now() / 1000) * 1000,
            dir: 'received' as const,
            amount: (t.vout?.reduce((s: number, o: any) => s + (o.value || 0), 0) || 0) / 1e8,
          }));
        }
      } catch {}
      const merged = [...local, ...btc].sort((a, b) => b.ts - a.ts).slice(0, 50);
      setItems(merged);
      setLoading(false);
    })();
  }, [accounts]);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="p-2.5 card"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-extrabold">Activity</h1>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3.5 mt-4 text-xs text-brand-900">
        Live BTC history via Blockstream. EVM/SOL history needs an indexer key (Etherscan / Alchemy / Helius) — local
        sends are always recorded on-device.
      </div>

      {loading ? (
        <div className="card mt-4 p-6 text-center text-sm text-slate-500">Loading history…</div>
      ) : items.length === 0 ? (
        <div className="card mt-4 p-8 text-center">
          <div className="text-3xl">📭</div>
          <div className="font-bold mt-2">No transactions yet</div>
          <div className="text-sm text-slate-500">Your sends and receives will show up here.</div>
        </div>
      ) : (
        <div className="card mt-4 divide-y divide-slate-50 overflow-hidden">
          {items.map((t, i) => (
            <a
              key={i}
              href={explorerTxUrl(t.chain, t.hash)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50"
            >
              <div className="relative">
                <ChainBadge chain={t.chain} size={40} />
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${t.dir === 'sent' ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                  {t.dir === 'sent' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm capitalize">{t.dir} {CHAINS[t.chain].symbol}</div>
                <div className="text-[11px] text-slate-400 font-mono">{maskAddress(t.hash)} • {new Date(t.ts).toLocaleString()}</div>
              </div>
              <div className="text-right">
                {t.amount ? <div className="font-bold text-sm">{t.amount.toFixed(5)}</div> : null}
                <ExternalLink size={13} className="text-slate-300 ml-auto" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
