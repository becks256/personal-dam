// renderer/src/components/AssetModal.tsx
import React, { useEffect, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { useAssetStore } from '../store/assetStore';
import StarRating from './StarRating';
import TagEditor from './TagEditor';
import MetadataPanel from './MetadataPanel';
import type { Asset } from '../types';

export default function AssetModal() {
  const { selectedAsset, closeModal } = useUiStore();
  const updateLocalAsset = useAssetStore(s => s.updateLocalAsset);
  const [asset, setAsset] = useState<Asset | null>(selectedAsset);
  const [description, setDescription] = useState(selectedAsset?.description ?? '');
  const [showMeta, setShowMeta] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeModal(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  if (!asset) return null;

  const thumbSrc = asset.thumbnail_path
    ? `thumb://${encodeURIComponent(asset.thumbnail_path)}`
    : null;
  const fullSrc = `thumb://${encodeURIComponent(asset.path)}`;

  async function handleRatingChange(rating: number) {
    setAsset(a => a ? { ...a, rating } : a);
    updateLocalAsset(asset.id, { rating });
    await window.dam.updateAsset(asset.id, { rating });
  }

  async function handleFavoriteToggle() {
    const next = !asset.favorite;
    setAsset(a => a ? { ...a, favorite: next } : a);
    updateLocalAsset(asset.id, { favorite: next });
    await window.dam.updateAsset(asset.id, { favorite: next });
  }

  async function handleDescriptionBlur() {
    if (description === asset.description) return;
    setAsset(a => a ? { ...a, description } : a);
    updateLocalAsset(asset.id, { description });
    await window.dam.updateAsset(asset.id, { description });
  }

  function handleTagsChange(tags: string[]) {
    setAsset(a => a ? { ...a, tags } : a);
    updateLocalAsset(asset.id, { tags });
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-zinc-900 rounded-xl flex w-[90vw] max-w-5xl h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden">
          {asset.type === 'video' ? (
            <video src={fullSrc} controls className="max-w-full max-h-full" />
          ) : (
            <img src={fullSrc} alt={asset.filename} className="max-w-full max-h-full object-contain" />
          )}
        </div>

        <div className="w-72 flex flex-col border-l border-zinc-800 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-medium text-zinc-200 break-all">{asset.filename}</h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-200 ml-2">✕</button>
            </div>
          </div>

          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <StarRating value={asset.rating} onChange={handleRatingChange} />
              <button
                onClick={handleFavoriteToggle}
                className={`text-xl transition-colors ${asset.favorite ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-300'}`}
              >
                ♥
              </button>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add description…"
              rows={3}
              className="w-full bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 px-2 py-1.5 rounded resize-none focus:outline-none"
            />
          </div>

          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tags</h3>
            <TagEditor tags={asset.tags} assetId={asset.id} onTagsChange={handleTagsChange} />
          </div>

          <div className="p-4">
            <button
              onClick={() => setShowMeta(v => !v)}
              className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1"
            >
              Metadata {showMeta ? '▲' : '▼'}
            </button>
            {showMeta && <MetadataPanel asset={asset} />}
          </div>
        </div>
      </div>
    </div>
  );
}
