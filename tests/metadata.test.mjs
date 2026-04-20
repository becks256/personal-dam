// dam/tests/metadata.test.mjs
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { extractImageMetadata, extractVideoMetadata, MEDIA_EXTENSIONS } from '../src/metadata.mjs';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');

describe('MEDIA_EXTENSIONS', () => {
  it('includes common image and video types', () => {
    expect(MEDIA_EXTENSIONS.image).toContain('.jpg');
    expect(MEDIA_EXTENSIONS.image).toContain('.png');
    expect(MEDIA_EXTENSIONS.video).toContain('.mp4');
    expect(MEDIA_EXTENSIONS.video).toContain('.mov');
  });
});

describe('extractImageMetadata', () => {
  it('returns dimensions and date_modified for a JPEG without EXIF', async () => {
    const meta = await extractImageMetadata(resolve(fixturesDir, 'sample.jpg'));
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);
    expect(meta.date_modified).toBeDefined();
  });
});

describe('extractVideoMetadata', () => {
  it('returns duration and dimensions for an MP4', async () => {
    const meta = await extractVideoMetadata(resolve(fixturesDir, 'sample.mp4'));
    expect(meta.duration_sec).toBeGreaterThan(0);
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);
  });
});
