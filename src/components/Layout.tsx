import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ArrowLeftRight, Sprout, Image, Compass } from 'lucide-react';

const TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { to: '/earn', label: 'Earn', icon: Sprout },
  { to: '/nfts', label: 'NFTs', icon: Image },
  { to: '/discover', label: 'Discover', icon: Compass },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 pb-24">{children}</div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
        <div className="m-3 mb-4 bg-white/95 backdrop-blur border border-slate-200 rounded-3xl shadow-[0_10px_40px_rgba(2,6,23,0.12)] px-2 py-2 grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 rounded-2xl text-[11px] font-semibold transition ${
                  isActive ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
