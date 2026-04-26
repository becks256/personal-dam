import React, { useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';
import { useCategoryStore } from '../store/categoryStore';

export default function BulkActionBar() {
  const { selectedIds, clearSelection } = useUiStore();
  const { categories, fetchCategories } = useCategoryStore();
  const removeAsset = useAssetStore(s => s.removeAsset);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedIds.size === 0) return null;

  async function handleAssign(categoryId: number) {
    setBusy(true);
    try {
      await window.dam.bulkAssignCategory([...selectedIds], categoryId);
      await fetchCategories();
      clearSelection();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(deleteFiles: boolean) {
    setBusy(true);
    try {
      await Promise.all([...selectedIds].map(id => window.dam.deleteAsset(id, deleteFiles)));
      for (const id of selectedIds) removeAsset(id);
      clearSelection();
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl px-4 py-2.5 z-40">
      <span className="text-sm text-zinc-300 font-medium whitespace-nowrap">
        {selectedIds.size} selected
      </span>

      <div className="w-px h-4 bg-zinc-700" />

      <select
        disabled={busy || categories.length === 0}
        defaultValue=""
        onChange={e => { if (e.target.value) handleAssign(Number(e.target.value)); }}
        className="bg-zinc-700 text-sm text-zinc-200 px-2 py-1 rounded focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        <option value="" disabled>Assign category…</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-zinc-700" />

      {!confirmDelete ? (
        <button
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          Delete…
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 whitespace-nowrap">Delete from:</span>
          <button
            disabled={busy}
            onClick={() => handleDelete(false)}
            className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors disabled:opacity-50"
          >
            Library only
          </button>
          <button
            disabled={busy}
            onClick={() => handleDelete(true)}
            className="text-xs px-2 py-1 bg-red-800 hover:bg-red-700 text-red-100 rounded transition-colors disabled:opacity-50"
          >
            + Files
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="w-px h-4 bg-zinc-700" />

      <button
        onClick={() => { clearSelection(); setConfirmDelete(false); }}
        className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
