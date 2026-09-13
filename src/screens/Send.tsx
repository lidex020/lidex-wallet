import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { CHAIN_LIST, type ChainId } from '../lib/chains';
import { useWallet } from '../store/walletStore';
import { ChainBadge } from '../components/ui';
import { sendEvm, sendSol, sendBtc, estimateEvmFee, fetchBtcFeeEstimate, explorerTxUrl } from '../lib/tx';
import { maskAddress } from '../lib/crypto';

const HISTORY_KEY = 'lidex.history.v1';
const LEGACY_HISTORY_KEY = 'trustclone.history.v1';

function pushLocalHistory(entry: any) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem(LEGACY_HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({ ...entry, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 100)));
    localStorage.removeItem(LEGACY_HISTORY_KEY);
  } catch {}
}

export default function Send() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { accounts, balances, prices, mnemonic, refresh } = useWallet();
  const [chain, setChain] = useState<ChainId>((params.get('chain') as ChainId) || 'ethereum');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('…');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const cfg = CHAIN_LIST.find((c) => c.id === chain)!;
  const bal = balances[chain];
  const usd = useMemo(() => (parseFloat(amount) || 0) * (prices[chain]?.usd || 0), [amount, prices, chain]);

  useEffect(() => {
    setFee('…');
    if (chain === 'ethereum' || chain === 'bnb') estimateEvmFee(chain).then(setFee).catch(() => setFee('~'));
    else if (chain === 'solana') setFee('0.000005');
    else fetchBtcFeeEstimate().then((r) => setFee(`~${r} sat/vB`));
  }, [chain]);

  const valid = to.length > 20 && (parseFloat(amount) || 0) > 0 && parseFloat(amount) <= bal;

  const doSend = async () => {
    if (!mnemonic || !accounts) return;
    if (!valid) return toast.error('Check address and amount');
    setSending(true);
    try {
      let hash = '';
      if (chain === 'ethereum' || chain === 'bnb') hash = await sendEvm(chain, mnemonic, to, amount);
      else if (chain === 'solana') hash = await sendSol(mnemonic, to, parseFloat(amount));
      else hash = await sendBtc(mnemonic, to, parseFloat(amount));
      pushLocalHistory({ chain, hash, to, amount: parseFloat(amount), dir: 'sent' });
      toast.success('Transaction broadcast!');
      setConfirming(false);
      setTo('');
      setAmount('');
      refresh();
      window.open(explorerTxUrl(chain, hash), '_blank');
    } catch (e: any) {
      toast.error(e?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="p-2.5 card"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-extrabold">Send</h1>
      </div>

      {/* Chain picker */}
      <label className="text-xs font-bold text-slate-500 mt-6 block">NETWORK</label>
      <div className="grid grid-cols-4 gap-2 mt-2">
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

      <div className="card mt-4 p-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 font-semibold">From: {maskAddress(accounts?.[chain]?.address || '')}</span>
          <span className="font-bold">Bal: {bal.toFixed(5)} {cfg.symbol}</span>
        </div>
        <label className="text-xs font-bold text-slate-500 mt-4 block">RECIPIENT ADDRESS</label>
        <input className="input mt-1.5 font-mono text-sm" placeholder={`Paste ${cfg.symbol} address`} value={to} onChange={(e) => setTo(e.target.value.trim())} />
        <div className="flex items-center justify-between mt-4">
          <label className="text-xs font-bold text-slate-500">AMOUNT</label>
          <button onClick={() => setAmount(String(bal))} className="text-xs font-bold text-brand-600">MAX</button>
        </div>
        <div className="relative mt-1.5">
          <input className="input text-2xl font-extrabold pr-20" placeholder="0.00" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{cfg.symbol}</span>
        </div>
        <div className="text-sm text-slate-500 mt-1.5">≈ ${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</div>
        <div className="flex justify-between text-xs mt-3 pt-3 border-t border-slate-100">
          <span className="text-slate-500 font-semibold">Network fee (est.)</span>
          <span className="font-bold">{fee} {chain === 'bitcoin' ? '' : cfg.symbol}</span>
        </div>
      </div>

      <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-2xl p-3 mt-4 text-xs text-amber-800">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        Always verify the address and network. Blockchain transactions are irreversible. Start with a small test send.
      </div>

      <button disabled={!valid} onClick={() => setConfirming(true)} className="btn-primary mt-4">
        Review & Send
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => !sending && setConfirming(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[28px] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-lg text-center">Confirm transaction</h2>
            <div className="text-center my-5">
              <div className="text-4xl font-extrabold">{amount} {cfg.symbol}</div>
              <div className="text-slate-500 text-sm">≈ ${usd.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">From</span><span className="font-mono font-semibold">{maskAddress(accounts?.[chain]?.address || '')}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">To</span><span className="font-mono font-semibold break-all text-right">{to}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="font-semibold">{cfg.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="font-semibold">{fee}</span></div>
            </div>
            <button onClick={doSend} disabled={sending} className="btn-primary mt-5">
              {sending ? 'Broadcasting…' : `Confirm & Send ${cfg.symbol}`}
            </button>
            <button onClick={() => setConfirming(false)} disabled={sending} className="w-full text-center text-sm font-semibold text-slate-400 mt-3">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
