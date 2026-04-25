// renderer/src/pages/Browse.tsx
import React from 'react';
import SearchBar from '../components/SearchBar';
import AssetGrid from '../components/AssetGrid';
import AssetModal from '../components/AssetModal';
import BulkActionBar from '../components/BulkActionBar';
import { useUiStore } from '../store/uiStore';

export default function Browse() {
  const modalOpen = useUiStore(s => s.modalOpen);
  return (
    <div className="relative flex flex-col h-full">
      <SearchBar />
      <AssetGrid />
      <BulkActionBar />
      {modalOpen && <AssetModal />}
    </div>
  );
}
