import { createServer } from 'node:http';

import { Server as SocketIOServer } from 'socket.io';

import { app } from './app';
import { connectDatabase } from './config/database';
import { clientUrls, env } from './config/env';
import { setRealtimeServer } from './services/realtime.service';

const startServer = async () => {
  await connectDatabase();

  const httpServer = createServer(app);
  const realtimeServer = new SocketIOServer(httpServer, {
    cors: {
      origin: clientUrls,
      credentials: true,
    },
  });

  realtimeServer.on('connection', (socket) => {
    socket.emit('system:ready', {
      connectedAt: new Date().toISOString(),
    });
  });

  setRealtimeServer(realtimeServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Ledger Premium API running on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});