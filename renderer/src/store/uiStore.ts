// renderer/src/store/uiStore.ts
import { create } from 'zustand';
import type { Asset, CrawlerProgress } from '../types';

interface UiState {
  selectedAsset: Asset | null;
  modalOpen: boolean;
  crawlerProgress: CrawlerProgress | null;
  crawling: boolean;
  activePage: 'browse' | 'settings';
  selectedIds: Set<number>;
  lastSelectedId: number | null;
  openModal: (asset: Asset) => void;
  closeModal: () => void;
  setCrawlerProgress: (p: CrawlerProgress | null) => void;
  setCrawling: (v: boolean) => void;
  setPage: (page: 'browse' | 'settings') => void;
  toggleSelect: (id: number) => void;
  selectRange: (anchorId: number, targetId: number, assets: Asset[]) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedAsset: null,
  modalOpen: false,
  crawlerProgress: null,
  crawling: false,
  activePage: 'browse',
  selectedIds: new Set(),
  lastSelectedId: null,

  openModal: (asset) => set({ selectedAsset: asset, modalOpen: true }),
  closeModal: () => set({ modalOpen: false, selectedAsset: null }),
  setCrawlerProgress: (p) => set({ crawlerProgress: p }),
  setCrawling: (v) => set({ crawling: v }),
  setPage: (page) => set({ activePage: page }),

  toggleSelect: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ selectedIds: next, lastSelectedId: id });
  },

  selectRange: (anchorId, targetId, assets) => {
    const ids = assets.map(a => a.id);
    const a = ids.indexOf(anchorId);
    const b = ids.indexOf(targetId);
    if (a === -1 || b === -1) return;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const next = new Set(get().selectedIds);
    for (let i = lo; i <= hi; i++) next.add(ids[i]);
    set({ selectedIds: next, lastSelectedId: targetId });
  },

  clearSelection: () => set({ selectedIds: new Set(), lastSelectedId: null }),
}));
