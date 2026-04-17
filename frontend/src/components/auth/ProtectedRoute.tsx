import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppStore } from '../../store/useAppStore';

export const ProtectedRoute = () => {
  const location = useLocation();
  const authStatus = useAppStore((state) => state.authStatus);
  const bootstrapped = useAppStore((state) => state.bootstrapped);
  const nextPath = `${location.pathname}${location.search}${location.hash}`;

  if (!bootstrapped || authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-white">
        <div className="space-y-3 text-center">
          <p className="premium-label">Syncing workspace</p>
          <p className="text-lg uppercase tracking-[0.25em] text-white/70">Loading Ledger Premium</p>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <Navigate replace to={`/login?next=${encodeURIComponent(nextPath)}`} />;
  }

  return <Outlet />;
};