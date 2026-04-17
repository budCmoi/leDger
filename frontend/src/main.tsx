import { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useBootApp } from './hooks/useBootApp';
import { AppLayout } from './layouts/AppLayout';
import './index.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-paper text-white">
    <div className="space-y-3 text-center">
      <p className="premium-label">Booting</p>
      <p className="text-lg uppercase tracking-[0.24em] text-white/65">Ledger Premium</p>
    </div>
  </div>
);

const App = () => {
  useBootApp();

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<LandingPage />} path="/" />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<DashboardPage />} path="/dashboard" />
              <Route element={<TransactionsPage />} path="/transactions" />
              <Route element={<InvoicesPage />} path="/invoices" />
              <Route element={<ReportsPage />} path="/reports" />
              <Route element={<ProfilePage />} path="/profile" />
              <Route element={<AdminRoute />}>
                <Route element={<AdminPage />} path="/admin-secret" />
              </Route>
            </Route>
          </Route>
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);