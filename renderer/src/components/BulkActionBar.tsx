import React, { useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { useCategoryStore } from '../store/categoryStore';

export default function BulkActionBar() {
  const { selectedIds, clearSelection } = useUiStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [busy, setBusy] = useState(false);

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

      <button
        onClick={clearSelection}
        className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
