import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { isMediaFile, getMediaType, extractMetadata } from './metadata.mjs';
import { generateThumbnail } from './thumbnailer.mjs';
import { upsertAsset, setThumbnailPath, getOrCreateCategory, assignCategory } from './db.mjs';

const SKIP_DIRS = new Set(['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information']);

export async function walkForMedia(rootDir, onFile, isAborted) {
  if (isAborted()) return;
  let entries;
  try {
    entries = await readdir(rootDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (isAborted()) return;
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      await walkForMedia(entryPath, onFile, isAborted);
    } else if (entry.isFile() && isMediaFile(entryPath)) {
      await onFile(entryPath);
    }
  }
}

export function startCrawl(rootPaths, thumbDir, onProgress) {
  let aborted = false;
  const isAborted = () => aborted;
  const stop = () => { aborted = true; };

  const progress = { scanned: 0, found: 0, indexed: 0, currentPath: '', done: false };

  async function run() {
    for (const root of rootPaths) {
      if (aborted) break;
      progress.scanned++;
      progress.currentPath = root;
      onProgress({ ...progress });

      await walkForMedia(root, async (filePath) => {
        if (aborted) return;
        progress.found++;
        progress.currentPath = filePath;
        onProgress({ ...progress });

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

          progress.indexed++;
          onProgress({ ...progress });
        } catch (err) {
          console.error('[crawler] failed to index', filePath, err?.message ?? err);
        }
      }, isAborted);
    }

    progress.done = true;
    onProgress({ ...progress });
  }

  run().catch(console.error);
  return { stop };
}
