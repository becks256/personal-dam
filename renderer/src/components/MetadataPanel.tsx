// renderer/src/components/MetadataPanel.tsx
import React from 'react';
import type { Asset } from '../types';

interface Props { asset: Asset; }

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <tr>
      <td className="py-0.5 pr-3 text-zinc-500 text-xs whitespace-nowrap">{label}</td>
      <td className="py-0.5 text-zinc-300 text-xs break-all">{String(value)}</td>
    </tr>
  );
}

export default function MetadataPanel({ asset }: Props) {
  const dims = asset.width && asset.height ? `${asset.width} × ${asset.height}` : null;
  const fileSize = asset.size_bytes > 1_000_000
    ? `${(asset.size_bytes / 1_000_000).toFixed(1)} MB`
    : `${(asset.size_bytes / 1_000).toFixed(0)} KB`;

  return (
    <table className="w-full">
      <tbody>
        <Row label="File" value={asset.filename} />
        <Row label="Type" value={asset.type} />
        <Row label="Size" value={fileSize} />
        <Row label="Dimensions" value={dims} />
        {asset.duration_sec != null && (
          <Row label="Duration" value={`${asset.duration_sec.toFixed(1)}s`} />
        )}
        <Row label="Date taken" value={asset.date_taken?.replace('T', ' ').slice(0, 19)} />
        <Row label="Modified" value={asset.date_modified?.replace('T', ' ').slice(0, 19)} />
        <Row label="Camera" value={[asset.make, asset.model].filter(Boolean).join(' ')} />
        {asset.gps_lat != null && (
          <Row label="GPS" value={`${asset.gps_lat.toFixed(5)}, ${asset.gps_lng?.toFixed(5)}`} />
        )}
        <Row label="Path" value={asset.path} />
      </tbody>
    </table>
  );
}
