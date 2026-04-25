import React, { useEffect, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';
import { useCategoryStore } from '../store/categoryStore';

export default function Sidebar() {
  const { activePage, setPage, crawlerProgress } = useUiStore();
  const { setQuery } = useAssetStore();
  const { categories, activeCategory, fetchCategories, createCategory, deleteCategory, renameCategory, setActiveCategory } = useCategoryStore();
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  function selectCategory(id: number | null) {
    setActiveCategory(id);
    setQuery({ categoryId: id ?? undefined, offset: 0 });
  }

  async function commitCreate() {
    const name = newName.trim();
    setCreating(false);
    setNewName('');
    if (name) await createCategory(name);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await deleteCategory(id);
    if (activeCategory === id) selectCategory(null);
  }

  function startRename(e: React.MouseEvent, id: number, current: string) {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(current);
  }

  async function commitRename(id: number) {
    if (renameValue.trim()) await renameCategory(id, renameValue.trim());
    setRenamingId(null);
  }

  return (
    <aside className="w-52 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-sm font-semibold tracking-wide text-zinc-300">DAM</h1>
      </div>

      <nav className="p-2 space-y-1 border-b border-zinc-800">
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

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Categories</span>
          <button
            onClick={() => { setCreating(true); setNewName(''); }}
            className="text-zinc-500 hover:text-zinc-200 text-base leading-none"
            title="New category"
          >+</button>
        </div>

        {/* All */}
        <button
          onClick={() => selectCategory(null)}
          className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
            activeCategory === null
              ? 'text-white bg-zinc-700'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          All assets
        </button>

        {creating && (
          <div className="px-3 py-1.5">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={commitCreate}
              onKeyDown={e => {
                if (e.key === 'Enter') commitCreate();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              placeholder="Category name…"
              className="w-full bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        )}

        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => selectCategory(cat.id)}
            className={`group flex items-center gap-1 px-3 py-1.5 cursor-pointer transition-colors ${
              activeCategory === cat.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {renamingId === cat.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => commitRename(cat.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(cat.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-zinc-800 text-sm text-zinc-200 px-1 rounded focus:outline-none min-w-0"
              />
            ) : (
              <span className="flex-1 text-sm truncate">{cat.name}</span>
            )}
            <span className="text-[10px] text-zinc-600 shrink-0">{cat.assetCount}</span>
            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
              <button
                onClick={e => startRename(e, cat.id, cat.name)}
                className="text-zinc-500 hover:text-zinc-200 text-xs px-0.5"
                title="Rename"
              >✎</button>
              <button
                onClick={e => handleDelete(e, cat.id)}
                className="text-zinc-500 hover:text-red-400 text-xs px-0.5"
                title="Delete"
              >×</button>
            </div>
          </div>
        ))}
      </div>

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
