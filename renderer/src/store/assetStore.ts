// renderer/src/store/assetStore.ts
import { create } from 'zustand';
import type { Asset, AssetQuery, AssetUpdate } from '../types';

interface AssetState {
  assets: Asset[];
  total: number;
  query: AssetQuery;
  loading: boolean;
  fetchAssets: (q?: Partial<AssetQuery>) => Promise<void>;
  updateLocalAsset: (id: number, update: Partial<Asset>) => void;
  setQuery: (q: Partial<AssetQuery>) => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  total: 0,
  query: { limit: 200, offset: 0, sortBy: 'date_modified', sortDir: 'desc' },
  loading: false,

  setQuery: (q) => {
    set(s => ({ query: { ...s.query, ...q } }));
    get().fetchAssets();
  },

  fetchAssets: async (q) => {
    const query = q ? { ...get().query, ...q } : get().query;
    set({ loading: true });
    try {
      const result = await window.dam.getAssets(query);
      set({ assets: result.assets, total: result.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateLocalAsset: (id, update) => {
    set(s => ({
      assets: s.assets.map(a => a.id === id ? { ...a, ...update } : a),
    }));
  },
}));
