import React, { useEffect, useRef, useCallback } from 'react';
import { FixedSizeGrid } from 'react-window';
import AssetCard from './AssetCard';
import { useAssetStore } from '../store/assetStore';

const CARD_SIZE = 180;
const GAP = 12;

export default function AssetGrid() {
  const { assets, total, loading, loadingMore, hasMore, fetchAssets, fetchMore } = useAssetStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(800);
  const [containerHeight, setContainerHeight] = React.useState(600);

  useEffect(() => { fetchAssets(); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      setContainerWidth(rect.width);
      setContainerHeight(rect.height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const colCount = Math.max(1, Math.floor((containerWidth + GAP) / (CARD_SIZE + GAP)));
  const rowCount = Math.ceil(assets.length / colCount) + (hasMore ? 1 : 0); // +1 sentinel row for loading

  const handleItemsRendered = useCallback(({ visibleRowStopIndex }: { visibleRowStopIndex: number }) => {
    const dataRowCount = Math.ceil(assets.length / colCount);
    if (visibleRowStopIndex >= dataRowCount - 2 && hasMore && !loadingMore) {
      fetchMore();
    }
  }, [assets.length, colCount, hasMore, loadingMore, fetchMore]);

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
    <div ref={containerRef} className="flex-1 overflow-hidden">
      <FixedSizeGrid
        columnCount={colCount}
        columnWidth={CARD_SIZE + GAP}
        rowCount={rowCount}
        rowHeight={CARD_SIZE + GAP + 32}
        height={containerHeight - 28}
        width={containerWidth}
        onItemsRendered={handleItemsRendered}
      >
        {({ rowIndex, columnIndex, style }) => {
          const idx = rowIndex * colCount + columnIndex;
          if (idx >= assets.length) {
            // Render loading indicator in first cell of sentinel row
            if (columnIndex === 0 && loadingMore) {
              return (
                <div style={style} className="flex items-center justify-center text-zinc-600 text-xs">
                  Loading more…
                </div>
              );
            }
            return null;
          }
          return (
            <div style={{ ...style, padding: GAP / 2 }}>
              <AssetCard asset={assets[idx]} />
            </div>
          );
        }}
      </FixedSizeGrid>
      <div className="px-4 py-1 text-xs text-zinc-600">
        {assets.length} of {total} assets
      </div>
    </div>
  );
}
