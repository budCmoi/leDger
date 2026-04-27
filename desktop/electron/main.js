const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const BACKEND_PORT = Number(process.env.LEDGER_DESKTOP_PORT || 4000);
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const HEALTH_URL = `${BACKEND_URL}/healthz`;
const RENDERER_DEV_URL = process.env.ELECTRON_RENDERER_URL;

let backendProcess = null;

const isDev = !app.isPackaged;

const getBackendEntryPath = () => {
  const root = isDev ? app.getAppPath() : process.resourcesPath;
  return path.join(root, 'backend', 'dist', 'server.js');
};

const waitForBackend = (timeoutMs = 40000) =>
  new Promise((resolve, reject) => {
    const startTime = Date.now();

    const poll = () => {
      const request = http.get(HEALTH_URL, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Le backend local ne repond pas.'));
          return;
        }

        setTimeout(poll, 500);
      });

      request.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Impossible de joindre le backend local.'));
          return;
        }

        setTimeout(poll, 500);
      });
    };

    poll();
  });

const stopBackend = () => {
  if (!backendProcess || backendProcess.killed) {
    return;
  }

  backendProcess.kill('SIGTERM');
  backendProcess = null;
};

const startBackend = async () => {
  if (isDev) {
    return;
  }

  const backendEntry = getBackendEntryPath();

  if (!existsSync(backendEntry)) {
    throw new Error(`Backend introuvable: ${backendEntry}`);
  }

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: isDev ? app.getAppPath() : process.resourcesPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(BACKEND_PORT),
      CLIENT_URL: `${BACKEND_URL},http://localhost:${BACKEND_PORT}`,
    },
  });

  backendProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendProcess.on('exit', (code) => {
    if (!app.isQuitting) {
      dialog.showErrorBox('Backend arrete', `Le backend local s est arrete (code ${code ?? 'inconnu'}).`);
      app.quit();
    }
  });

  await waitForBackend();
};

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#080808',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'LeDger Desktop',
  });

  if (isDev && RENDERER_DEV_URL) {
    await mainWindow.loadURL(RENDERER_DEV_URL);
    return;
  }

  await startBackend();
  await mainWindow.loadURL(BACKEND_URL);
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopBackend();
});

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox('Echec de demarrage', String(error?.message ?? error));
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});