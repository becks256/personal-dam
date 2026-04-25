import { create } from 'zustand';
import type { Category } from '../types';

interface CategoryState {
  categories: Category[];
  activeCategory: number | null;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, description?: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  renameCategory: (id: number, name: string) => Promise<void>;
  setActiveCategory: (id: number | null) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  activeCategory: null,

  fetchCategories: async () => {
    const categories = await window.dam.getCategories();
    set({ categories });
  },

  createCategory: async (name, description = '') => {
    await window.dam.createCategory(name, description);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    await window.dam.deleteCategory(id);
    if (get().activeCategory === id) set({ activeCategory: null });
    await get().fetchCategories();
  },

  renameCategory: async (id, name) => {
    await window.dam.renameCategory(id, name);
    await get().fetchCategories();
  },

  setActiveCategory: (id) => set({ activeCategory: id }),
}));
