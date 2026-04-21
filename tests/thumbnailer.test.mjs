// dam/tests/thumbnailer.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateThumbnail } from '../src/thumbnailer.mjs';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');

let thumbDir;
beforeAll(() => { thumbDir = mkdtempSync(join(tmpdir(), 'dam-thumb-')); });
afterAll(() => { rmSync(thumbDir, { recursive: true, force: true }); });

describe('generateThumbnail', () => {
  it('creates a JPEG thumbnail for an image', async () => {
    const outPath = await generateThumbnail(
      resolve(fixturesDir, 'sample.jpg'),
      thumbDir
    );
    expect(outPath).not.toBeNull();
    expect(existsSync(outPath)).toBe(true);
    expect(outPath).toMatch(/\.jpg$/);
  });

  it('returns the same path on second call (cache hit)', async () => {
    const path1 = await generateThumbnail(resolve(fixturesDir, 'sample.jpg'), thumbDir);
    const path2 = await generateThumbnail(resolve(fixturesDir, 'sample.jpg'), thumbDir);
    expect(path1).toBe(path2);
  });

  it('creates a JPEG thumbnail for a video', async () => {
    const outPath = await generateThumbnail(
      resolve(fixturesDir, 'sample.mp4'),
      thumbDir
    );
    expect(outPath).not.toBeNull();
    expect(existsSync(outPath)).toBe(true);
  });
});
