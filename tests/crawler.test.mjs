// dam/tests/crawler.test.mjs
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { walkForMedia } from '../src/crawler.mjs';

let tmpDir;
beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'dam-walk-'));
  mkdirSync(join(tmpDir, 'sub', '.hidden'), { recursive: true });
  writeFileSync(join(tmpDir, 'a.jpg'), 'fake');
  writeFileSync(join(tmpDir, 'b.mp4'), 'fake');
  writeFileSync(join(tmpDir, 'sub', 'c.png'), 'fake');
  writeFileSync(join(tmpDir, 'sub', '.hidden', 'd.jpg'), 'fake'); // should be skipped
  writeFileSync(join(tmpDir, 'readme.txt'), 'ignore');
});
afterAll(() => { rmSync(tmpDir, { recursive: true, force: true }); });

describe('walkForMedia', () => {
  it('finds media files but skips hidden dirs and non-media files', async () => {
    const found = [];
    await walkForMedia(tmpDir, (filePath) => found.push(filePath), () => false);
    expect(found).toHaveLength(3); // a.jpg, b.mp4, sub/c.png
    expect(found.some(f => f.endsWith('a.jpg'))).toBe(true);
    expect(found.some(f => f.endsWith('b.mp4'))).toBe(true);
    expect(found.some(f => f.endsWith('c.png'))).toBe(true);
    expect(found.every(f => !f.includes('.hidden'))).toBe(true);
  });

  it('stops walking when aborted', async () => {
    const found = [];
    let callCount = 0;
    await walkForMedia(tmpDir, (f) => { found.push(f); callCount++; }, () => callCount >= 1);
    expect(found).toHaveLength(1);
  });
});
