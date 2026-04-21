// dam/main.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, protocol, net } from 'electron';
import { registerIpcHandlers } from './src/ipc.mjs';
import { getSetting } from './src/db.mjs';
import { startWatcher } from './src/watcher.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const thumbDir = path.join(app.getPath('userData'), 'thumbnails');

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'thumb', privileges: { secure: true, supportFetchAPI: true } },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  protocol.handle('thumb', (request) => {
    const filePath = decodeURIComponent(request.url.slice('thumb://'.length));
    return net.fetch(`file://${filePath}`);
  });

  registerIpcHandlers(win);
  win.setTitle('DAM — Digital Asset Manager');

  const savedPaths = getSetting('crawlPaths') ?? [];
  if (savedPaths.length > 0) startWatcher(savedPaths, thumbDir);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
