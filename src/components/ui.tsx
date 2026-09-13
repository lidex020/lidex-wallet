import { CHAINS, type ChainId } from '../lib/chains';
import { fmtUSD } from '../lib/prices';

export function ChainBadge({ chain, size = 40 }: { chain: ChainId; size?: number }) {
  const c = CHAINS[chain];
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: c.color, fontSize: size * 0.45 }}
    >
      {c.icon}
    </div>
  );
}

export function UsdChange({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {up ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 mt-6 mb-3">
      <h3 className="font-bold text-[15px]">{children}</h3>
      {right}
    </div>
  );
}

export function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card mx-5 p-8 text-center">
      <div className="text-3xl mb-2">🫙</div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{desc}</div>
    </div>
  );
}

export function TokenRow({
  chain,
  balance,
  usd,
  change,
  onClick,
}: {
  chain: ChainId;
  balance: number;
  usd: number;
  change: number;
  onClick?: () => void;
}) {
  const c = CHAINS[chain];
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition text-left">
      <ChainBadge chain={chain} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px]">{c.symbol}</div>
        <div className="text-xs text-slate-500">{c.name}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-[15px]">
          {balance.toFixed(balance < 1 ? 5 : 4)} <span className="text-slate-400 font-semibold text-xs">{c.symbol}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-slate-500">{fmtUSD(balance * usd)}</span>
          <UsdChange value={change} />
        </div>
      </div>
    </button>
  );
}
