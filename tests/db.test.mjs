// dam/tests/db.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tmpDir;
let mod;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'dam-test-'));
  process.env.DAM_DB_PATH = join(tmpDir, 'test.db');
  mod = await import('../src/db.mjs');
});

afterAll(() => {
  mod?.default?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.DAM_DB_PATH;
});

describe('db', () => {
  it('upserts an asset and retrieves it by id', () => {
    const { upsertAsset, getAssetById } = mod;
    const { id } = upsertAsset({
      path: '/photos/test.jpg',
      filename: 'test.jpg',
      type: 'image',
      size_bytes: 12345,
      width: 1920,
      height: 1080,
      duration_sec: null,
      date_taken: '2024-06-01T10:00:00.000Z',
      date_modified: '2024-06-01T10:00:00.000Z',
      make: 'Canon',
      model: 'EOS R5',
      gps_lat: 37.7749,
      gps_lng: -122.4194,
      thumbnail_path: '/tmp/thumb.jpg',
    });
    expect(id).toBeGreaterThan(0);
    const row = getAssetById(id);
    expect(row.filename).toBe('test.jpg');
    expect(row.make).toBe('Canon');
    expect(row.tags).toEqual([]);
  });

  it('adds and removes tags', () => {
    const { upsertAsset, getAssetById, addTag, removeTag } = mod;
    const { id } = upsertAsset({
      path: '/photos/tagged.jpg', filename: 'tagged.jpg', type: 'image',
      size_bytes: 1000, width: null, height: null, duration_sec: null,
      date_taken: null, date_modified: '2024-01-01T00:00:00.000Z',
      make: null, model: null, gps_lat: null, gps_lng: null, thumbnail_path: null,
    });
    addTag(id, 'vacation');
    addTag(id, 'beach');
    const row = getAssetById(id);
    expect(row.tags).toContain('vacation');
    expect(row.tags).toContain('beach');
    removeTag(id, 'vacation');
    const updated = getAssetById(id);
    expect(updated.tags).not.toContain('vacation');
  });

  it('queries assets with search filter', () => {
    const { upsertAsset, getAssets } = mod;
    upsertAsset({
      path: '/photos/sunset.png', filename: 'sunset.png', type: 'image',
      size_bytes: 500, width: null, height: null, duration_sec: null,
      date_taken: null, date_modified: '2024-01-01T00:00:00.000Z',
      make: null, model: null, gps_lat: null, gps_lng: null, thumbnail_path: null,
    });
    const { assets, total } = getAssets({ search: 'sunset' });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(assets.some(a => a.filename === 'sunset.png')).toBe(true);
  });

  it('updates asset metadata', () => {
    const { upsertAsset, getAssetById, updateAsset } = mod;
    const { id } = upsertAsset({
      path: '/photos/rate.jpg', filename: 'rate.jpg', type: 'image',
      size_bytes: 100, width: null, height: null, duration_sec: null,
      date_taken: null, date_modified: '2024-01-01T00:00:00.000Z',
      make: null, model: null, gps_lat: null, gps_lng: null, thumbnail_path: null,
    });
    updateAsset(id, { rating: 4, favorite: true, description: 'Nice shot' });
    const row = getAssetById(id);
    expect(row.rating).toBe(4);
    expect(row.favorite).toBe(true);
    expect(row.description).toBe('Nice shot');
  });
});
