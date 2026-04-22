import { startTransition, useEffect, useRef } from 'react';

import { bootstrapApi, isUnauthorizedError } from '../services/api';
import { firebaseAuthService } from '../services/firebase-auth';
import { useAppStore } from '../store/useAppStore';

export const useBootApp = () => {
  const hasBootedRef = useRef(false);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);
  const setUnauthenticated = useAppStore((state) => state.setUnauthenticated);

  const applyBootstrap = (payload: Awaited<ReturnType<typeof bootstrapApi.loadRestaurantWorkspace>>) => {
    startTransition(() => {
      setRestaurantBootstrap(payload);
    });
  };

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
  }, [setRestaurantBootstrap, setUnauthenticated]);
};