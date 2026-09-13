import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useWallet } from './store/walletStore';
import Onboarding from './screens/Onboarding';
import Unlock from './screens/Unlock';
import Home from './screens/Home';
import Send from './screens/Send';
import Receive from './screens/Receive';
import Swap from './screens/Swap';
import Earn from './screens/Earn';
import Nfts from './screens/Nfts';
import Discover from './screens/Discover';
import Activity from './screens/Activity';
import Settings from './screens/Settings';
import Layout from './components/Layout';

function Guard({ children }: { children: JSX.Element }) {
  const status = useWallet((s) => s.status);
  const loc = useLocation();
  if (status === 'onboarding') return <Navigate to="/onboarding" replace state={{ from: loc }} />;
  if (status === 'locked') return <Navigate to="/unlock" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  const init = useWallet((s) => s.init);
  const status = useWallet((s) => s.status);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="phone-frame">
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/unlock" element={<Unlock />} />
        <Route
          path="/*"
          element={
            <Guard>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/send" element={<Send />} />
                  <Route path="/receive" element={<Receive />} />
                  <Route path="/swap" element={<Swap />} />
                  <Route path="/earn" element={<Earn />} />
                  <Route path="/nfts" element={<Nfts />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </Layout>
            </Guard>
          }
        />
      </Routes>
      {status === 'onboarding' && null}
    </div>
  );
}
