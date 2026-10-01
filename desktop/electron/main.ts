import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startUDPDiscovery } from './discovery';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs')
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  startUDPDiscovery('PC-Escritorio-Etec');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});