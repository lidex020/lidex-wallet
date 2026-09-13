import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, RefreshCw, Send, Download, ArrowLeftRight, History, Settings, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../store/walletStore';
import { CHAIN_LIST } from '../lib/chains';
import { fmtUSD } from '../lib/prices';
import { TokenRow } from '../components/ui';

export default function Home() {
  const nav = useNavigate();
  const { balances, prices, refresh, refreshing, hideBalance, toggleHide, totalUsd, accounts } = useWallet();

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = totalUsd();
  const dayChange = CHAIN_LIST.reduce((s, c) => s + (balances[c.id] * (prices[c.id]?.usd || 0) * (prices[c.id]?.change24h || 0)) / 100, 0);

  const actions = [
    { label: 'Send', icon: Send, go: '/send' },
    { label: 'Receive', icon: Download, go: '/receive' },
    { label: 'Swap', icon: ArrowLeftRight, go: '/swap' },
    { label: 'History', icon: History, go: '/activity' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-brand-700 to-brand-600 text-white px-5 pt-6 pb-24 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lidex-icon.png" alt="Lidex" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30" />
            <span className="font-bold">Lidex Wallet</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleHide} className="p-2.5 rounded-xl hover:bg-white/10">
              {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={() => refresh()} className="p-2.5 rounded-xl hover:bg-white/10">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => nav('/settings')} className="p-2.5 rounded-xl hover:bg-white/10">
              <Settings size={18} />
            </button>
          </div>
        </div>
        <div className="text-center mt-6">
          <div className="text-white/60 text-xs font-semibold tracking-widest">TOTAL BALANCE</div>
          <div className="text-[42px] leading-tight font-extrabold tracking-tight">
            {hideBalance ? '••••••' : fmtUSD(total)}
          </div>
          <div className={`text-sm font-semibold ${dayChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {hideBalance ? '' : `${dayChange >= 0 ? '+' : ''}${fmtUSD(dayChange)} (${dayChange >= 0 ? '+' : ''}${total > 0 ? ((dayChange / Math.max(total - dayChange, 1)) * 100).toFixed(2) : '0.00'}%) today`}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 -mt-12">
        <div className="card p-4 grid grid-cols-4 gap-1">
          {actions.map(({ label, icon: Icon, go }) => (
            <button key={label} onClick={() => nav(go)} className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-slate-50">
              <span className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon size={19} />
              </span>
              <span className="text-[11px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tokens */}
      <div className="flex items-center justify-between px-5 mt-6 mb-2">
        <h3 className="font-bold text-[15px]">Tokens</h3>
        <button
          onClick={() => {
            const all = CHAIN_LIST.map((c) => `${c.symbol}: ${accounts?.[c.id].address}`).join('\n');
            navigator.clipboard.writeText(all);
            toast.success('All addresses copied');
          }}
          className="text-xs font-bold text-brand-600 flex items-center gap-1"
        >
          <Copy size={13} /> Copy all
        </button>
      </div>
      <div className="card mx-4 divide-y divide-slate-50 overflow-hidden">
        {CHAIN_LIST.map((c) => (
          <TokenRow
            key={c.id}
            chain={c.id}
            balance={balances[c.id]}
            usd={prices[c.id]?.usd || 0}
            change={prices[c.id]?.change24h || 0}
            onClick={() => nav(`/receive?chain=${c.id}`)}
          />
        ))}
      </div>

      {total === 0 && (
        <div className="card mx-4 mt-4 p-5 bg-gradient-to-br from-brand-50 to-white">
          <div className="font-bold text-sm">👋 New wallet, zero balance</div>
          <p className="text-[13px] text-slate-500 mt-1">
            Tap <b>Receive</b> to show your QR code and fund your wallet. Start with a small test amount.
          </p>
          <button onClick={() => nav('/receive')} className="btn-primary mt-3 !py-2.5 text-sm">
            Show my addresses
          </button>
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}
