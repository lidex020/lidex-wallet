import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { useWallet } from '../store/walletStore';

export default function Unlock() {
  const [password, setPassword] = useState('');
  const unlock = useWallet((s) => s.unlock);
  const loading = useWallet((s) => s.loading);
  const logout = useWallet((s) => s.logout);
  const nav = useNavigate();

  const go = async () => {
    try {
      await unlock(password);
      nav('/home');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-700 to-brand-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <img src="/lidex-icon.png" alt="Lidex Wallet" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/30 shadow-2xl" />
        <h1 className="text-xl font-extrabold mt-4">Welcome back</h1>
        <p className="text-white/60 text-sm">Enter your password to unlock</p>
        <input
          type="password"
          autoFocus
          className="mt-6 w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 outline-none placeholder:text-white/40 focus:border-white/60"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
        />
        <button
          onClick={go}
          disabled={loading || !password}
          className="w-full mt-3 bg-white text-brand-700 font-bold rounded-2xl py-3.5 disabled:opacity-50"
        >
          {loading ? 'Unlocking…' : 'Unlock wallet'}
        </button>
        <button
          onClick={() => {
            if (confirm('Remove wallet from this device? You will need your recovery phrase to restore.')) {
              logout();
              nav('/onboarding');
            }
          }}
          className="text-white/50 text-xs mt-6 underline"
        >
          Forgot password? Reset wallet
        </button>
        <Link to="/onboarding" className="text-white/50 text-xs mt-2">
          Use a different wallet
        </Link>
      </div>
    </div>
  );
}
