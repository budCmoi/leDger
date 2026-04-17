import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const startServer = async () => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`Ledger Premium API running on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});