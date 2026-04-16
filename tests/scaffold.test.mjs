import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

describe('project scaffold', () => {
  it('has required top-level files', () => {
    const required = [
      'main.mjs',
      'preload.cjs',
      'package.json',
      'vite.config.ts',
      'vitest.config.mjs',
      'tailwind.config.js',
      'postcss.config.js',
      'tsconfig.json',
    ];
    for (const f of required) {
      expect(existsSync(join(root, f)), `missing: ${f}`).toBe(true);
    }
  });

  it('has renderer source files', () => {
    const required = [
      'renderer/index.html',
      'renderer/src/main.tsx',
      'renderer/src/App.tsx',
      'renderer/src/index.css',
    ];
    for (const f of required) {
      expect(existsSync(join(root, f)), `missing: ${f}`).toBe(true);
    }
  });
});
