import { useEffect } from 'react';
import { io } from 'socket.io-client';

import { bootstrapApi, isUnauthorizedError, SOCKET_BASE_URL } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export const useRealtimeSync = () => {
  const authStatus = useAppStore((state) => state.authStatus);
  const user = useAppStore((state) => state.user);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);
  const setUnauthenticated = useAppStore((state) => state.setUnauthenticated);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let syncing = false;

    const refreshWorkspace = async () => {
      if (syncing) {
        return;
      }

      syncing = true;

      try {
        setRestaurantBootstrap(await bootstrapApi.loadRestaurantWorkspace());
      } catch (error) {
        if (isUnauthorizedError(error)) {
          setUnauthenticated();
        } else {
          console.error(error);
        }
      } finally {
        syncing = false;
      }
    };

    const socket = io(SOCKET_BASE_URL || undefined, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('inventory:updated', () => {
      void refreshWorkspace();
    });
    socket.on('dashboard:updated', () => {
      void refreshWorkspace();
    });
    socket.on('journal:updated', () => {
      void refreshWorkspace();
    });

    return () => {
      socket.disconnect();
    };
  }, [authStatus, setRestaurantBootstrap, setUnauthenticated, user]);
};