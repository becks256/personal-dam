// renderer/src/components/Sidebar.tsx
import React from 'react';
import { useUiStore } from '../store/uiStore';

export default function Sidebar() {
  const { activePage, setPage, crawlerProgress } = useUiStore();

  return (
    <aside className="w-48 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-sm font-semibold tracking-wide text-zinc-300">DAM</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {(['browse', 'settings'] as const).map(page => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`w-full text-left px-3 py-2 rounded text-sm capitalize transition-colors ${
              activePage === page
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {page}
          </button>
        ))}
      </nav>

      {crawlerProgress && !crawlerProgress.done && (
        <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
          <div className="text-zinc-400 font-medium mb-1">Indexing…</div>
          <div className="truncate">{crawlerProgress.currentPath.split('/').pop()}</div>
          <div className="mt-1">{crawlerProgress.indexed} indexed</div>
        </div>
      )}
    </aside>
  );
}
