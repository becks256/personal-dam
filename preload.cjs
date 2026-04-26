// dam/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dam', {
  getAssets:   (query)         => ipcRenderer.invoke('assets:get', query),
  getAssetById:(id)            => ipcRenderer.invoke('assets:getById', id),
  updateAsset: (id, update)    => ipcRenderer.invoke('assets:update', { id, update }),
  deleteAsset: (id, deleteFile) => ipcRenderer.invoke('assets:delete', { id, deleteFile }),
  showInFolder: (filePath)     => ipcRenderer.invoke('assets:showInFolder', filePath),
  addTag:      (assetId, tag)  => ipcRenderer.invoke('tags:add', { assetId, tag }),
  removeTag:   (assetId, tag)  => ipcRenderer.invoke('tags:remove', { assetId, tag }),
  getAllTags:   ()              => ipcRenderer.invoke('tags:getAll'),
  startCrawl:  (paths)         => ipcRenderer.invoke('crawler:start', paths),
  stopCrawl:   ()              => ipcRenderer.invoke('crawler:stop'),
  getSettings: ()              => ipcRenderer.invoke('settings:get'),
  saveSettings:(settings)      => ipcRenderer.invoke('settings:save', settings),
  selectDirectory: ()          => ipcRenderer.invoke('dialog:selectDir'),
  // Categories
  getCategories:      ()                    => ipcRenderer.invoke('categories:getAll'),
  createCategory:     (name, description)   => ipcRenderer.invoke('categories:create', { name, description }),
  deleteCategory:     (id)                  => ipcRenderer.invoke('categories:delete', id),
  renameCategory:     (id, name)            => ipcRenderer.invoke('categories:rename', { id, name }),
  assignCategory:     (assetId, categoryId) => ipcRenderer.invoke('categories:assign', { assetId, categoryId }),
  removeFromCategory: (assetId, categoryId) => ipcRenderer.invoke('categories:remove', { assetId, categoryId }),
  bulkAssignCategory: (assetIds, categoryId) => ipcRenderer.invoke('categories:bulkAssign', { assetIds, categoryId }),
  mergeCategories:    (sourceIds, targetId)  => ipcRenderer.invoke('categories:merge', { sourceIds, targetId }),
  onCrawlerProgress: (cb) => {
    const handler = (_event, progress) => cb(progress);
    ipcRenderer.on('crawler:progress', handler);
    return () => ipcRenderer.removeListener('crawler:progress', handler);
  },
});
