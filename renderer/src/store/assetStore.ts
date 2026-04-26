import { create } from 'zustand';
import type { Asset, AssetQuery } from '../types';

const PAGE_SIZE = 100;

interface AssetState {
  assets: Asset[];
  total: number;
  query: AssetQuery;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  fetchAssets: (q?: Partial<AssetQuery>) => Promise<void>;
  fetchMore: () => Promise<void>;
  updateLocalAsset: (id: number, update: Partial<Asset>) => void;
  removeAsset: (id: number) => void;
  setQuery: (q: Partial<AssetQuery>) => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  total: 0,
  query: { limit: PAGE_SIZE, offset: 0, sortBy: 'date_modified', sortDir: 'desc' },
  loading: false,
  loadingMore: false,
  hasMore: false,

  setQuery: (q) => {
    const next = { ...get().query, ...q, offset: 0 };
    set({ query: next });
    get().fetchAssets();
  },

  fetchAssets: async (q) => {
    const query = q ? { ...get().query, ...q, offset: 0 } : { ...get().query, offset: 0 };
    set({ loading: true, query: { ...get().query, ...query } });
    try {
      const result = await window.dam.getAssets(query);
      set({
        assets: result.assets,
        total: result.total,
        loading: false,
        hasMore: result.assets.length < result.total,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchMore: async () => {
    const { assets, total, query, loading, loadingMore, hasMore } = get();
    if (loading || loadingMore || !hasMore) return;
    const nextOffset = assets.length;
    if (nextOffset >= total) return;
    set({ loadingMore: true });
    try {
      const result = await window.dam.getAssets({ ...query, offset: nextOffset, limit: PAGE_SIZE });
      const merged = [...assets, ...result.assets];
      set({
        assets: merged,
        total: result.total,
        loadingMore: false,
        hasMore: merged.length < result.total,
        query: { ...query, offset: nextOffset },
      });
    } catch {
      set({ loadingMore: false });
    }
  },

  updateLocalAsset: (id, update) => {
    set(s => ({
      assets: s.assets.map(a => a.id === id ? { ...a, ...update } : a),
    }));
  },

  removeAsset: (id) => {
    set(s => ({
      assets: s.assets.filter(a => a.id !== id),
      total: s.total - 1,
    }));
  },
}));
