import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sprout, X } from 'lucide-react';
import { STAKING_OPTIONS } from '../lib/tokens';
import { CHAINS } from '../lib/chains';
import { useWallet } from '../store/walletStore';
import { ChainBadge } from '../components/ui';

export default function Earn() {
  const { balances, prices } = useWallet();
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState('');

  const totalStakedUsd = 0; // wire to on-chain stake accounts in prod

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-extrabold">Earn</h1>
      <p className="text-sm text-slate-500">Stake and earn yield on your crypto</p>

      <div className="card mt-4 p-5 bg-gradient-to-br from-emerald-500 to-teal-600 !border-0 text-white">
        <div className="flex items-center gap-2 text-white/80 text-xs font-bold"><Sprout size={14} /> TOTAL EARNING</div>
        <div className="text-3xl font-extrabold mt-1">${totalStakedUsd.toFixed(2)}</div>
        <div className="text-white/70 text-xs mt-1">Est. APY up to 7.1% on SOL</div>
      </div>

      <div className="space-y-3 mt-4">
        {STAKING_OPTIONS.map((s, i) => {
          const bal = balances[s.chain];
          return (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <ChainBadge chain={s.chain} />
                <div className="flex-1">
                  <div className="font-bold text-[15px]">{s.protocol}</div>
                  <div className="text-xs text-slate-500">{CHAINS[s.chain].name} • {s.lock}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-emerald-600">{s.apy}%</div>
                  <div className="text-[11px] text-slate-400 font-semibold">APY</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Available: <b className="text-slate-800">{bal.toFixed(4)} {CHAINS[s.chain].symbol}</b> (≈ ${(bal * (prices[s.chain]?.usd || 0)).toFixed(2)})</span>
                <button onClick={() => { setSelected(i); setAmount(''); }} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs">
                  Stake
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[28px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg">Stake {CHAINS[STAKING_OPTIONS[selected].chain].symbol}</h2>
              <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 rounded-xl"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {STAKING_OPTIONS[selected].protocol} • {STAKING_OPTIONS[selected].apy}% APY • {STAKING_OPTIONS[selected].lock}
            </p>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="input mt-4 text-xl font-extrabold" />
            <div className="text-xs text-slate-500 mt-2">
              Est. yearly rewards: <b className="text-emerald-600">{((parseFloat(amount) || 0) * STAKING_OPTIONS[selected].apy / 100).toFixed(5)} {CHAINS[STAKING_OPTIONS[selected].chain].symbol}</b>
            </div>
            <button
              onClick={() => {
                if (!(parseFloat(amount) > 0)) return toast.error('Enter an amount');
                if (parseFloat(amount) > balances[STAKING_OPTIONS[selected].chain]) return toast.error('Insufficient balance');
                toast.success('Staking flow staged (demo). Native delegation tx wired in prod build.');
                setSelected(null);
              }}
              className="btn-primary mt-4"
            >
              Confirm stake
            </button>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Prod: SOL → stake program delegate; ETH → Lido/RocketPool deposit contract; BNB → stakeBNB. Unstaking periods apply.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
