// dam/src/metadata.mjs
import { stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

export const MEDIA_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.tiff', '.tif', '.bmp'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv', '.wmv'],
};

const ALL_EXTENSIONS = new Set([...MEDIA_EXTENSIONS.image, ...MEDIA_EXTENSIONS.video]);

export function getMediaType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (MEDIA_EXTENSIONS.image.includes(ext)) return 'image';
  if (MEDIA_EXTENSIONS.video.includes(ext)) return 'video';
  return null;
}

export function isMediaFile(filePath) {
  return ALL_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function extractImageMetadata(filePath) {
  const [fileStats, sharpMeta, exif] = await Promise.all([
    stat(filePath),
    sharp(filePath).metadata().catch(() => ({})),
    exifr.parse(filePath, {
      pick: ['DateTimeOriginal', 'Make', 'Model', 'latitude', 'longitude'],
    }).catch(() => null),
  ]);

  let dateTaken = null;
  if (exif?.DateTimeOriginal) {
    if (exif.DateTimeOriginal instanceof Date) {
      dateTaken = exif.DateTimeOriginal.toISOString();
    } else {
      // EXIF raw format: "YYYY:MM:DD HH:MM:SS" — normalize to ISO so SQLite text sort works
      const normalized = String(exif.DateTimeOriginal).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      const d = new Date(normalized);
      dateTaken = isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  return {
    size_bytes: fileStats.size,
    width: sharpMeta.width ?? null,
    height: sharpMeta.height ?? null,
    duration_sec: null,
    date_taken: dateTaken,
    date_modified: fileStats.mtime.toISOString(),
    make: exif?.Make ?? null,
    model: exif?.Model ?? null,
    gps_lat: exif?.latitude ?? null,
    gps_lng: exif?.longitude ?? null,
  };
}

export async function extractVideoMetadata(filePath) {
  const fileStats = await stat(filePath);

  const probe = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const videoStream = probe.streams?.find(s => s.codec_type === 'video');
  const duration = probe.format?.duration ? parseFloat(probe.format.duration) : null;

  return {
    size_bytes: fileStats.size,
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    duration_sec: duration,
    date_taken: null,
    date_modified: fileStats.mtime.toISOString(),
    make: null,
    model: null,
    gps_lat: null,
    gps_lng: null,
  };
}

export async function extractMetadata(filePath) {
  const type = getMediaType(filePath);
  if (type === 'image') return extractImageMetadata(filePath);
  if (type === 'video') return extractVideoMetadata(filePath);
  throw new Error(`Unsupported file type: ${filePath}`);
}
