import type { Server } from 'socket.io';

let realtimeServer: Server | null = null;

export const setRealtimeServer = (server: Server) => {
  realtimeServer = server;
};

const createRealtimePayload = () => ({
  syncedAt: new Date().toISOString(),
});

export const broadcastInventoryUpdate = () => {
  realtimeServer?.emit('inventory:updated', createRealtimePayload());
};

export const broadcastDashboardUpdate = () => {
  realtimeServer?.emit('dashboard:updated', createRealtimePayload());
};

export const broadcastJournalUpdate = () => {
  realtimeServer?.emit('journal:updated', createRealtimePayload());
};