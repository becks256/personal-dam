// renderer/src/pages/Settings.tsx
import React, { useEffect, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';

export default function Settings() {
  const [paths, setPaths] = useState<string[]>([]);
  const [crawling, setCrawling] = useState(false);
  const crawlerProgress = useUiStore(s => s.crawlerProgress);
  const fetchAssets = useAssetStore(s => s.fetchAssets);

  useEffect(() => {
    window.dam.getSettings().then(s => setPaths(s.crawlPaths));
  }, []);

  async function addDirectory() {
    const dir = await window.dam.selectDirectory();
    if (!dir || paths.includes(dir)) return;
    const next = [...paths, dir];
    setPaths(next);
    await window.dam.saveSettings({ crawlPaths: next });
  }

  async function removeDirectory(p: string) {
    const next = paths.filter(x => x !== p);
    setPaths(next);
    await window.dam.saveSettings({ crawlPaths: next });
  }

  async function startCrawl() {
    if (paths.length === 0) return;
    setCrawling(true);
    await window.dam.startCrawl(paths);
  }

  async function stopCrawl() {
    await window.dam.stopCrawl();
    setCrawling(false);
    fetchAssets();
  }

  useEffect(() => {
    if (crawlerProgress?.done) {
      setCrawling(false);
      fetchAssets();
    }
  }, [crawlerProgress?.done]);

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-lg font-semibold text-zinc-200 mb-6">Settings</h2>

      <section className="mb-8">
        <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Crawl Paths</h3>

        {paths.length === 0 && (
          <p className="text-sm text-zinc-600 mb-3">No directories configured. Add one to start indexing.</p>
        )}

        <div className="space-y-2 mb-3">
          {paths.map(p => (
            <div key={p} className="flex items-center gap-3 bg-zinc-900 px-3 py-2 rounded border border-zinc-800">
              <span className="flex-1 text-sm text-zinc-300 break-all">{p}</span>
              <button
                onClick={() => removeDirectory(p)}
                className="text-xs text-zinc-500 hover:text-red-400 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addDirectory}
          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded"
        >
          + Add Directory
        </button>
      </section>

      <section>
        <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Index</h3>

        <div className="flex gap-3 mb-4">
          <button
            onClick={startCrawl}
            disabled={crawling || paths.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded"
          >
            {crawling ? 'Indexing…' : 'Start Crawl'}
          </button>
          {crawling && (
            <button
              onClick={stopCrawl}
              className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded"
            >
              Stop
            </button>
          )}
        </div>

        {crawlerProgress && (
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-sm space-y-1">
            <div className="text-zinc-300 font-medium">
              {crawlerProgress.done ? 'Indexing complete' : 'Indexing…'}
            </div>
            <div className="text-zinc-500">
              {crawlerProgress.indexed} indexed · {crawlerProgress.found} found
            </div>
            {!crawlerProgress.done && (
              <div className="text-zinc-600 text-xs truncate">{crawlerProgress.currentPath}</div>
            )}
            {crawlerProgress.error && (
              <div className="text-red-400 text-xs">{crawlerProgress.error}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
