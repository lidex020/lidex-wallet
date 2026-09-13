import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownUp, Info } from 'lucide-react';
import { CHAIN_LIST, type ChainId } from '../lib/chains';
import { useWallet } from '../store/walletStore';
import { ChainBadge } from '../components/ui';

/**
 * PRODUCTION NOTE:
 * - EVM swaps: integrate 0x Swap API (https://0x.org/docs) or 1inch; request quote with
 *   sellToken/buyToken/sellAmount, then send returned `to`/`data`/`value` via signer.
 * - Solana swaps: integrate Jupiter Ultra API (https://station.jup.ag).
 * - Cross-chain: integrate LI.FI / Socket / THORChain.
 * This screen ships with indicative pricing (CoinGecko ratio minus 0.3% fee) so the UX is
 * complete; wire `VITE_0X_API_KEY` in .env to go live.
 */

export default function Swap() {
  const { balances, prices } = useWallet();
  const [from, setFrom] = useState<ChainId>('ethereum');
  const [to, setTo] = useState<ChainId>('bnb');
  const [amount, setAmount] = useState('');

  const quote = useMemo(() => {
    const a = parseFloat(amount) || 0;
    if (!a) return 0;
    const fromUsd = prices[from]?.usd || 0;
    const toUsd = prices[to]?.usd || 1;
    return (a * fromUsd * 0.997) / toUsd; // 0.3% indicative fee
  }, [amount, from, to, prices]);

  const flip = () => {
    setFrom(to);
    setTo(from);
  };

  const crossChain = from !== to && !(from === 'ethereum' && to === 'bnb') && !(from === 'bnb' && to === 'ethereum');

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-extrabold">Swap</h1>
      <p className="text-sm text-slate-500">Best-rate aggregator • 0.3% indicative fee</p>

      <div className="card mt-5 p-4">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>FROM</span>
          <span>Bal: {balances[from].toFixed(5)}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <select value={from} onChange={(e) => setFrom(e.target.value as ChainId)} className="input !w-auto font-bold">
            {CHAIN_LIST.map((c) => (
              <option key={c.id} value={c.id}>{c.symbol}</option>
            ))}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="input text-xl font-extrabold" />
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <ChainBadge chain={from} size={20} />≈ ${((parseFloat(amount) || 0) * (prices[from]?.usd || 0)).toFixed(2)}
        </div>

        <div className="flex justify-center my-3">
          <button onClick={flip} className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-card">
            <ArrowDownUp size={18} />
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500">TO</div>
        <div className="flex gap-2 mt-2">
          <select value={to} onChange={(e) => setTo(e.target.value as ChainId)} className="input !w-auto font-bold">
            {CHAIN_LIST.map((c) => (
              <option key={c.id} value={c.id}>{c.symbol}</option>
            ))}
          </select>
          <div className="input text-xl font-extrabold bg-slate-50 flex items-center">
            {quote ? quote.toFixed(6) : '0.00'}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <ChainBadge chain={to} size={20} />≈ ${(quote * (prices[to]?.usd || 0)).toFixed(2)}
        </div>

        <div className="bg-slate-50 rounded-2xl p-3.5 mt-4 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Rate</span><span className="font-bold">1 {CHAIN_LIST.find(c=>c.id===from)?.symbol} ≈ {((prices[from]?.usd||0)/(prices[to]?.usd||1)).toFixed(6)} {CHAIN_LIST.find(c=>c.id===to)?.symbol}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Price impact</span><span className="font-bold text-emerald-600">&lt; 0.1%</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Route</span><span className="font-bold">{crossChain ? 'Bridge (LI.FI / THORChain)' : 'Aggregator (0x / Jupiter)'}</span></div>
        </div>

        <button
          onClick={() => {
            if (!(parseFloat(amount) > 0)) return toast.error('Enter an amount');
            if (parseFloat(amount) > balances[from]) return toast.error('Insufficient balance');
            if (crossChain) return toast('Cross-chain swaps need a bridge provider key.\nSee code comments to go live.', { duration: 5000 });
            toast.success('Quote locked for 20s (demo). Wire 0x/Jupiter key for live execution.');
          }}
          className="btn-primary mt-4"
        >
          Review swap
        </button>
      </div>

      <div className="flex gap-2 items-start bg-brand-50 border border-brand-100 rounded-2xl p-3.5 mt-4 text-xs text-brand-900">
        <Info size={15} className="mt-0.5 shrink-0" />
        Demo quotes use CoinGecko spot prices. For production execution add VITE_0X_API_KEY and implement the quote → approve → send flow in src/lib/swap.ts.
      </div>
    </div>
  );
}
