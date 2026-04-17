import { startTransition, useEffect, useRef } from 'react';

import { authApi, dashboardApi, invoiceApi, isUnauthorizedError, transactionApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export const useBootApp = () => {
  const hasBootedRef = useRef(false);
  const setAuthSession = useAppStore((state) => state.setAuthSession);
  const setUnauthenticated = useAppStore((state) => state.setUnauthenticated);
  const setDashboard = useAppStore((state) => state.setDashboard);
  const setTransactions = useAppStore((state) => state.setTransactions);
  const setInvoices = useAppStore((state) => state.setInvoices);

  useEffect(() => {
    if (hasBootedRef.current) {
      return;
    }

    hasBootedRef.current = true;

    const boot = async () => {
      try {
        const session = await authApi.getSession();
        const [dashboard, transactions, invoices] = await Promise.all([
          dashboardApi.get(),
          transactionApi.list(),
          invoiceApi.list(),
        ]);

        startTransition(() => {
          setAuthSession(session);
          setDashboard(dashboard);
          setTransactions(transactions);
          setInvoices(invoices);
        });
      } catch (error) {
        if (isUnauthorizedError(error)) {
          startTransition(() => {
            setUnauthenticated();
          });
          return;
        }

        console.error(error);
        startTransition(() => {
          setUnauthenticated();
        });
      }
    };

    void boot();
  }, [setAuthSession, setDashboard, setInvoices, setTransactions, setUnauthenticated]);
};