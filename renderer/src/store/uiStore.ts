// renderer/src/store/uiStore.ts
import { create } from 'zustand';
import type { Asset, CrawlerProgress } from '../types';

interface UiState {
  selectedAsset: Asset | null;
  modalOpen: boolean;
  crawlerProgress: CrawlerProgress | null;
  activePage: 'browse' | 'settings';
  openModal: (asset: Asset) => void;
  closeModal: () => void;
  setCrawlerProgress: (p: CrawlerProgress | null) => void;
  setPage: (page: 'browse' | 'settings') => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedAsset: null,
  modalOpen: false,
  crawlerProgress: null,
  activePage: 'browse',

  openModal: (asset) => set({ selectedAsset: asset, modalOpen: true }),
  closeModal: () => set({ modalOpen: false, selectedAsset: null }),
  setCrawlerProgress: (p) => set({ crawlerProgress: p }),
  setPage: (page) => set({ activePage: page }),
}));
