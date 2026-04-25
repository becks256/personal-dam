// renderer/src/store/uiStore.ts
import { create } from 'zustand';
import type { Asset, CrawlerProgress } from '../types';

interface UiState {
  selectedAsset: Asset | null;
  modalOpen: boolean;
  crawlerProgress: CrawlerProgress | null;
  activePage: 'browse' | 'settings';
  selectedIds: Set<number>;
  openModal: (asset: Asset) => void;
  closeModal: () => void;
  setCrawlerProgress: (p: CrawlerProgress | null) => void;
  setPage: (page: 'browse' | 'settings') => void;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedAsset: null,
  modalOpen: false,
  crawlerProgress: null,
  activePage: 'browse',
  selectedIds: new Set(),

  openModal: (asset) => set({ selectedAsset: asset, modalOpen: true }),
  closeModal: () => set({ modalOpen: false, selectedAsset: null }),
  setCrawlerProgress: (p) => set({ crawlerProgress: p }),
  setPage: (page) => set({ activePage: page }),

  toggleSelect: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ selectedIds: next });
  },

  clearSelection: () => set({ selectedIds: new Set() }),
}));
