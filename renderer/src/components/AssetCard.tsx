// renderer/src/components/AssetCard.tsx
import React from 'react';
import type { Asset } from '../types';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';

interface Props { asset: Asset; }

export default function AssetCard({ asset }: Props) {
  const openModal = useUiStore(s => s.openModal);
  const toggleSelect = useUiStore(s => s.toggleSelect);
  const selectedIds = useUiStore(s => s.selectedIds);
  const updateLocalAsset = useAssetStore(s => s.updateLocalAsset);

  const isSelected = selectedIds.has(asset.id);
  const anySelected = selectedIds.size > 0;

  const thumbSrc = asset.thumbnail_path
    ? `thumb://${encodeURIComponent(asset.thumbnail_path)}`
    : null;

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !asset.favorite;
    updateLocalAsset(asset.id, { favorite: next });
    await window.dam.updateAsset(asset.id, { favorite: next });
  }

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation();
    toggleSelect(asset.id);
  }

  return (
    <div
      onClick={() => anySelected ? toggleSelect(asset.id) : openModal(asset)}
      className={`group relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border transition-colors ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <div className="aspect-square bg-zinc-800 flex items-center justify-center">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={asset.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-zinc-600 text-xs">{asset.type}</span>
        )}
      </div>

      {/* Checkbox — always visible when selected or any selection active, else on hover */}
      <button
        onClick={handleCheckbox}
        className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border flex items-center justify-center text-xs transition-opacity ${
          isSelected
            ? 'bg-blue-600 border-blue-500 text-white opacity-100'
            : `bg-black/50 border-zinc-500 text-transparent ${anySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`
        }`}
      >
        {isSelected ? '✓' : ''}
      </button>

      <button
        onClick={toggleFavorite}
        className={`absolute top-1.5 right-1.5 text-sm transition-opacity ${
          asset.favorite
            ? 'opacity-100 text-amber-400'
            : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400'
        }`}
      >
        ♥
      </button>

      <div className="px-2 py-1.5">
        <p className="text-xs text-zinc-400 truncate">{asset.filename}</p>
      </div>
    </div>
  );
}
