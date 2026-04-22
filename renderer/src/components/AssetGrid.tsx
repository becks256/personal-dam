// renderer/src/components/AssetGrid.tsx
import React, { useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import AssetCard from './AssetCard';
import { useAssetStore } from '../store/assetStore';

const CARD_SIZE = 180;
const GAP = 12;

export default function AssetGrid() {
  const { assets, total, loading, fetchAssets } = useAssetStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(800);

  useEffect(() => { fetchAssets(); }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const colCount = Math.max(1, Math.floor((containerWidth + GAP) / (CARD_SIZE + GAP)));
  const rowCount = Math.ceil(assets.length / colCount);
  const containerHeight = window.innerHeight - 120;

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  if (!loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 text-sm gap-2">
        <span>No assets found.</span>
        <span className="text-zinc-600 text-xs">Add crawl paths in Settings to get started.</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1">
      <FixedSizeGrid
        columnCount={colCount}
        columnWidth={CARD_SIZE + GAP}
        rowCount={rowCount}
        rowHeight={CARD_SIZE + GAP + 32}
        height={containerHeight}
        width={containerWidth}
      >
        {({ rowIndex, columnIndex, style }) => {
          const idx = rowIndex * colCount + columnIndex;
          if (idx >= assets.length) return null;
          return (
            <div style={{ ...style, padding: GAP / 2 }}>
              <AssetCard asset={assets[idx]} />
            </div>
          );
        }}
      </FixedSizeGrid>
      <div className="px-4 py-2 text-xs text-zinc-600">
        {assets.length} of {total} assets
      </div>
    </div>
  );
}
