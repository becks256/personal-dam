// renderer/src/components/SearchBar.tsx
import React, { useState } from 'react';
import { useAssetStore } from '../store/assetStore';

type SortBy = 'date_modified' | 'date_taken' | 'filename' | 'rating' | 'size_bytes';
type SortDir = 'asc' | 'desc';

export default function SearchBar() {
  const setQuery = useAssetStore(s => s.setQuery);
  const [text, setText] = useState('');
  const [type, setType] = useState<'all' | 'image' | 'video'>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date_modified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery({ search: text || undefined, type, favorite: favoriteOnly || undefined, sortBy, sortDir, offset: 0 });
  }

  function handleSortBy(val: SortBy) {
    setSortBy(val);
    setQuery({ sortBy: val, sortDir, offset: 0 });
  }

  function handleSortDir(val: SortDir) {
    setSortDir(val);
    setQuery({ sortBy, sortDir: val, offset: 0 });
  }

  function handleReset() {
    setText('');
    setType('all');
    setFavoriteOnly(false);
    setSortBy('date_modified');
    setSortDir('desc');
    setQuery({ search: undefined, type: 'all', favorite: undefined, sortBy: 'date_modified', sortDir: 'desc', offset: 0 });
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900"
    >
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Search files…"
        className="flex-1 bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-600"
      />

      <select
        value={type}
        onChange={e => setType(e.target.value as typeof type)}
        className="bg-zinc-800 text-sm text-zinc-300 px-2 py-1.5 rounded focus:outline-none"
      >
        <option value="all">All types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm text-zinc-400 cursor-pointer">
        <input
          type="checkbox"
          checked={favoriteOnly}
          onChange={e => setFavoriteOnly(e.target.checked)}
          className="accent-amber-400"
        />
        Favorites
      </label>

      <div className="w-px h-5 bg-zinc-700" />

      <select
        value={sortBy}
        onChange={e => handleSortBy(e.target.value as SortBy)}
        className="bg-zinc-800 text-sm text-zinc-300 px-2 py-1.5 rounded focus:outline-none"
      >
        <option value="date_modified">Date modified</option>
        <option value="date_taken">Date taken</option>
        <option value="filename">Filename</option>
        <option value="rating">Rating</option>
        <option value="size_bytes">File size</option>
      </select>

      <button
        type="button"
        onClick={() => handleSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
        className="bg-zinc-800 text-sm text-zinc-300 px-2 py-1.5 rounded hover:bg-zinc-700 transition-colors"
        title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
      >
        {sortDir === 'desc' ? '↓' : '↑'}
      </button>

      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded"
      >
        Search
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 rounded"
      >
        Reset
      </button>
    </form>
  );
}
