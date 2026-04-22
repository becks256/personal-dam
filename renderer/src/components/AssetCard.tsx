// renderer/src/components/AssetCard.tsx
import React from 'react';
import type { Asset } from '../types';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';

interface Props { asset: Asset; }

export default function AssetCard({ asset }: Props) {
  const openModal = useUiStore(s => s.openModal);
  const updateLocalAsset = useAssetStore(s => s.updateLocalAsset);

  const thumbSrc = asset.thumbnail_path
    ? `thumb://${encodeURIComponent(asset.thumbnail_path)}`
    : null;

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !asset.favorite;
    updateLocalAsset(asset.id, { favorite: next });
    await window.dam.updateAsset(asset.id, { favorite: next });
  }

  return (
    <div
      onClick={() => openModal(asset)}
      className="group relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-zinc-600 transition-colors"
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

      <div className="absolute top-1.5 left-1.5">
        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded uppercase tracking-wider text-zinc-400">
          {asset.type === 'video' ? '▶ vid' : 'img'}
        </span>
      </div>

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
