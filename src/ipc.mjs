// dam/src/ipc.mjs
import { ipcMain, dialog, app, shell } from 'electron';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import {
  getAssets, getAssetById, updateAsset, deleteAsset,
  addTag, removeTag, getAllTags,
  getSetting, setSetting,
  getCategories, createCategory, deleteCategory, renameCategory,
  assignCategory, removeFromCategory, bulkAssignCategory, mergeCategories,
} from './db.mjs';
import { startCrawl } from './crawler.mjs';
import { startWatcher, stopWatcher } from './watcher.mjs';

const thumbDir = path.join(app.getPath('userData'), 'thumbnails');
let activeCrawl = null;

export function registerIpcHandlers(mainWindow) {
  ipcMain.handle('assets:get', (_e, query) => getAssets(query));
  ipcMain.handle('assets:getById', (_e, id) => getAssetById(id));
  ipcMain.handle('assets:update', (_e, { id, update }) => { updateAsset(id, update); });

  ipcMain.handle('assets:delete', async (_e, { id, deleteFile }) => {
    const row = deleteAsset(id);
    if (deleteFile && row) {
      await unlink(row.path).catch(() => {});
      if (row.thumbnail_path) await unlink(row.thumbnail_path).catch(() => {});
    }
  });

  ipcMain.handle('assets:showInFolder', (_e, filePath) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('tags:add', (_e, { assetId, tag }) => { addTag(assetId, tag); });
  ipcMain.handle('tags:remove', (_e, { assetId, tag }) => { removeTag(assetId, tag); });
  ipcMain.handle('tags:getAll', () => getAllTags());

  // ── Categories ────────────────────────────────────────────────────────────
  ipcMain.handle('categories:getAll', () => getCategories());
  ipcMain.handle('categories:create', (_e, { name, description }) => createCategory(name, description));
  ipcMain.handle('categories:delete', (_e, id) => { deleteCategory(id); });
  ipcMain.handle('categories:rename', (_e, { id, name }) => { renameCategory(id, name); });
  ipcMain.handle('categories:assign', (_e, { assetId, categoryId }) => { assignCategory(assetId, categoryId); });
  ipcMain.handle('categories:remove', (_e, { assetId, categoryId }) => { removeFromCategory(assetId, categoryId); });
  ipcMain.handle('categories:bulkAssign', (_e, { assetIds, categoryId }) => { bulkAssignCategory(assetIds, categoryId); });
  ipcMain.handle('categories:merge', (_e, { sourceIds, targetId }) => { mergeCategories(sourceIds, targetId); });

  ipcMain.handle('crawler:start', (_e, paths) => {
    if (activeCrawl) activeCrawl.stop();
    activeCrawl = startCrawl(paths, thumbDir, (progress) => {
      mainWindow.webContents.send('crawler:progress', progress);
    });
  });

  ipcMain.handle('crawler:stop', () => {
    if (activeCrawl) { activeCrawl.stop(); activeCrawl = null; }
  });

  ipcMain.handle('settings:get', () => {
    const crawlPaths = getSetting('crawlPaths') ?? [];
    return { crawlPaths };
  });

  ipcMain.handle('settings:save', (_e, settings) => {
    setSetting('crawlPaths', settings.crawlPaths);
    stopWatcher();
    if (settings.crawlPaths.length > 0) {
      startWatcher(settings.crawlPaths, thumbDir);
    }
  });

  ipcMain.handle('dialog:selectDir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
