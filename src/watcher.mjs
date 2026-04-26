import chokidar from 'chokidar';
import path from 'node:path';
import { isMediaFile, getMediaType, extractMetadata } from './metadata.mjs';
import { generateThumbnail } from './thumbnailer.mjs';
import { upsertAsset, setThumbnailPath, getOrCreateCategory, assignCategory } from './db.mjs';

let watcherInstance = null;

export function startWatcher(paths, thumbDir) {
  stopWatcher();

  watcherInstance = chokidar.watch(paths, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 200 },
  });

  watcherInstance
    .on('add', filePath => indexFile(filePath, thumbDir))
    .on('change', filePath => indexFile(filePath, thumbDir))
    .on('unlink', filePath => removeFile(filePath));
}

export function stopWatcher() {
  if (watcherInstance) {
    watcherInstance.close();
    watcherInstance = null;
  }
}

async function indexFile(filePath, thumbDir) {
  if (!isMediaFile(filePath)) return;
  try {
    const type = getMediaType(filePath);
    const meta = await extractMetadata(filePath);
    const filename = path.basename(filePath);
    const { id } = upsertAsset({ path: filePath, filename, type, thumbnail_path: null, ...meta });
    const folderName = path.basename(path.dirname(filePath));
    if (folderName) {
      const cat = getOrCreateCategory(folderName);
      if (cat) assignCategory(id, cat.id);
    }
    const thumbPath = await generateThumbnail(filePath, thumbDir);
    if (thumbPath) setThumbnailPath(id, thumbPath);
  } catch { /* skip */ }
}

function removeFile(_filePath) {
  // For now: no-op: soft-keep deleted assets; a future orphan sweep can remove them
}
