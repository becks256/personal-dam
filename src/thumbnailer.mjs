import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { getMediaType } from './metadata.mjs';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const THUMB_SIZE = 320;

function thumbFilename(srcPath) {
  return createHash('sha256').update(srcPath).digest('hex') + '.jpg';
}

export async function generateThumbnail(srcPath, thumbDir) {
  mkdirSync(thumbDir, { recursive: true });
  const outPath = path.join(thumbDir, thumbFilename(srcPath));

  if (existsSync(outPath)) return outPath;

  const type = getMediaType(srcPath);
  if (!type) return null;

  try {
    if (type === 'image') {
      await sharp(srcPath)
        .rotate()
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toFile(outPath);
    } else {
      await generateVideoThumbnail(srcPath, outPath);
    }
    return outPath;
  } catch {
    return null;
  }
}

function generateVideoThumbnail(srcPath, outPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps: ['00:00:00'],
        filename: path.basename(outPath),
        folder: path.dirname(outPath),
        size: `${THUMB_SIZE}x?`,
      });
  });
}
