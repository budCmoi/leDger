import { startTransition, useEffect, useRef } from 'react';

import { bootstrapApi, isUnauthorizedError } from '../services/api';
import { firebaseAuthService } from '../services/firebase-auth';
import { useAppStore } from '../store/useAppStore';

export const useBootApp = () => {
  const hasBootedRef = useRef(false);
  const setAuthSession = useAppStore((state) => state.setAuthSession);
  const setUnauthenticated = useAppStore((state) => state.setUnauthenticated);
  const setDashboard = useAppStore((state) => state.setDashboard);
  const setTransactions = useAppStore((state) => state.setTransactions);
  const setInvoices = useAppStore((state) => state.setInvoices);

  const applyBootstrap = (payload: Awaited<ReturnType<typeof bootstrapApi.loadAuthenticatedApp>>) => {
    startTransition(() => {
      setAuthSession(payload.session);
      setDashboard(payload.dashboard);
      setTransactions(payload.transactions);
      setInvoices(payload.invoices);
    });
  };

  useEffect(() => {
    if (hasBootedRef.current) {
      return;
    }

    hasBootedRef.current = true;

    const boot = async () => {
      try {
        applyBootstrap(await bootstrapApi.loadAuthenticatedApp());
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          console.error(error);
          startTransition(() => {
            setUnauthenticated();
          });
          return;
        }

        try {
          const restoredSession = await firebaseAuthService.restoreSession();

          if (!restoredSession) {
            startTransition(() => {
              setUnauthenticated();
            });
            return;
          }

          applyBootstrap(restoredSession);
        } catch (restoreError) {
          if (!isUnauthorizedError(restoreError)) {
            console.error(restoreError);
          }

          startTransition(() => {
            setUnauthenticated();
          });
        }
      }
    };

    void boot();
  }, [setAuthSession, setDashboard, setInvoices, setTransactions, setUnauthenticated]);
};