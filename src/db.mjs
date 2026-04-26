// dam/src/db.mjs
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

function resolveDbPath() {
  if (process.env.DAM_DB_PATH) return process.env.DAM_DB_PATH;
  // Running inside Electron — use app userData
  try {
    const require = createRequire(import.meta.url);
    const { app } = require('electron');
    const userData = app.getPath('userData');
    mkdirSync(userData, { recursive: true });
    return path.join(userData, 'dam.db');
  } catch {
    // Fallback for test env where electron is not available
    return path.join(process.cwd(), '.dam-test.db');
  }
}

const db = new Database(resolveDbPath());

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image','video')),
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_sec REAL,
    date_taken TEXT,
    date_modified TEXT NOT NULL,
    make TEXT,
    model TEXT,
    gps_lat REAL,
    gps_lng REAL,
    rating INTEGER NOT NULL DEFAULT 0,
    favorite INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    thumbnail_path TEXT,
    indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS asset_categories (
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, category_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
    filename, description,
    content=assets,
    content_rowid=id
  );

  CREATE TRIGGER IF NOT EXISTS assets_fts_insert AFTER INSERT ON assets BEGIN
    INSERT INTO assets_fts(rowid, filename, description) VALUES (new.id, new.filename, new.description);
  END;
  CREATE TRIGGER IF NOT EXISTS assets_fts_update AFTER UPDATE OF filename, description ON assets BEGIN
    INSERT INTO assets_fts(assets_fts, rowid, filename, description) VALUES ('delete', old.id, old.filename, old.description);
    INSERT INTO assets_fts(rowid, filename, description) VALUES (new.id, new.filename, new.description);
  END;
  CREATE TRIGGER IF NOT EXISTS assets_fts_delete AFTER DELETE ON assets BEGIN
    INSERT INTO assets_fts(assets_fts, rowid, filename, description) VALUES ('delete', old.id, old.filename, old.description);
  END;
`);

// ── upsertAsset ──────────────────────────────────────────────────────────────
const stmtUpsert = db.prepare(`
  INSERT INTO assets (path, filename, type, size_bytes, width, height, duration_sec,
    date_taken, date_modified, make, model, gps_lat, gps_lng, thumbnail_path, indexed_at)
  VALUES (@path, @filename, @type, @size_bytes, @width, @height, @duration_sec,
    @date_taken, @date_modified, @make, @model, @gps_lat, @gps_lng, @thumbnail_path, datetime('now'))
  ON CONFLICT(path) DO UPDATE SET
    filename = excluded.filename, size_bytes = excluded.size_bytes,
    width = excluded.width, height = excluded.height,
    duration_sec = excluded.duration_sec, date_taken = excluded.date_taken,
    date_modified = excluded.date_modified, make = excluded.make,
    model = excluded.model, gps_lat = excluded.gps_lat, gps_lng = excluded.gps_lng,
    thumbnail_path = excluded.thumbnail_path, type = excluded.type,
    indexed_at = datetime('now')
  RETURNING id
`);

export function upsertAsset(asset) {
  return stmtUpsert.get(asset); // { id }
}

// ── getAssetById ─────────────────────────────────────────────────────────────
const stmtById = db.prepare(`
  SELECT a.*, GROUP_CONCAT(t.name, '||') AS tag_str,
    (SELECT GROUP_CONCAT(c.name, '||')
     FROM asset_categories ac JOIN categories c ON c.id = ac.category_id
     WHERE ac.asset_id = a.id) AS category_str
  FROM assets a
  LEFT JOIN asset_tags atags ON atags.asset_id = a.id
  LEFT JOIN tags t ON t.id = atags.tag_id
  WHERE a.id = ?
  GROUP BY a.id
`);

function parseRow(row) {
  if (!row) return null;
  const { tag_str, category_str, ...rest } = row;
  return {
    ...rest,
    favorite: rest.favorite === 1,
    tags: tag_str ? tag_str.split('||') : [],
    categories: category_str ? category_str.split('||') : [],
  };
}

export function getAssetById(id) {
  return parseRow(stmtById.get(id));
}

// ── getAssets ────────────────────────────────────────────────────────────────
export function getAssets(query = {}) {
  const {
    search, type, tags = [], favorite, ratingMin,
    dateFrom, dateTo, categoryId,
    sortBy = 'date_modified', sortDir = 'desc',
    limit = 100, offset = 0,
  } = query;

  const conditions = [];
  const params = {};

  if (search) {
    conditions.push(`a.id IN (SELECT rowid FROM assets_fts WHERE assets_fts MATCH @search)`);
    // Build a prefix-search query: each whitespace-separated token gets a * suffix
    // This allows "sun" to match "sunset", "sunrise", etc.
    params.search = search
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(t => `${t.replace(/['"*]/g, '')}*`)
      .join(' ');
  }
  if (type && type !== 'all') {
    conditions.push('a.type = @type');
    params.type = type;
  }
  if (favorite === true)  { conditions.push('a.favorite = 1'); }
  if (favorite === false) { conditions.push('a.favorite = 0'); }
  if (ratingMin != null) {
    conditions.push('a.rating >= @ratingMin');
    params.ratingMin = ratingMin;
  }
  if (dateFrom) {
    conditions.push('a.date_taken >= @dateFrom');
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    conditions.push('a.date_taken <= @dateTo');
    params.dateTo = dateTo;
  }
  if (tags.length > 0) {
    for (let i = 0; i < tags.length; i++) {
      conditions.push(`a.id IN (
        SELECT at2.asset_id FROM asset_tags at2
        JOIN tags t ON t.id = at2.tag_id
        WHERE t.name = @tag${i} COLLATE NOCASE
      )`);
      params[`tag${i}`] = tags[i];
    }
  }
  if (categoryId != null) {
    conditions.push('a.id IN (SELECT asset_id FROM asset_categories WHERE category_id = @categoryId)');
    params.categoryId = categoryId;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const allowedSort = ['date_taken','date_modified','filename','rating','size_bytes'];
  const col = allowedSort.includes(sortBy) ? sortBy : 'date_modified';
  const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const countSql = `SELECT COUNT(*) as n FROM assets a ${where}`;
  const rowSql = `
    SELECT a.*, GROUP_CONCAT(t.name, '||') AS tag_str,
      (SELECT GROUP_CONCAT(c.name, '||')
       FROM asset_categories ac JOIN categories c ON c.id = ac.category_id
       WHERE ac.asset_id = a.id) AS category_str
    FROM assets a
    LEFT JOIN asset_tags atags ON atags.asset_id = a.id
    LEFT JOIN tags t ON t.id = atags.tag_id
    ${where}
    GROUP BY a.id
    ORDER BY CASE WHEN a.${col} IS NULL THEN 1 ELSE 0 END, a.${col} ${dir}
    LIMIT @limit OFFSET @offset
  `;

  const total = db.prepare(countSql).get(params).n;
  const assets = db.prepare(rowSql).all({ ...params, limit, offset }).map(parseRow);
  return { assets, total };
}

// ── updateAsset ──────────────────────────────────────────────────────────────
export function updateAsset(id, update) {
  const fields = [];
  const params = { id };
  if (update.rating != null) { fields.push('rating = @rating'); params.rating = update.rating; }
  if (update.favorite != null) { fields.push('favorite = @favorite'); params.favorite = update.favorite ? 1 : 0; }
  if (update.description != null) { fields.push('description = @description'); params.description = update.description; }
  if (fields.length === 0) return;
  db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = @id`).run(params);
}

// ── tags ─────────────────────────────────────────────────────────────────────
export function addTag(assetId, tagName) {
  const insertTag = db.transaction(() => {
    db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(tagName);
    const tag = db.prepare(`SELECT id FROM tags WHERE name = ? COLLATE NOCASE`).get(tagName);
    db.prepare(`INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)`).run(assetId, tag.id);
  });
  insertTag();
}

export function removeTag(assetId, tagName) {
  const tag = db.prepare(`SELECT id FROM tags WHERE name = ? COLLATE NOCASE`).get(tagName);
  if (!tag) return;
  db.prepare(`DELETE FROM asset_tags WHERE asset_id = ? AND tag_id = ?`).run(assetId, tag.id);
}

export function getAllTags() {
  return db.prepare(`SELECT name FROM tags ORDER BY name`).all().map(r => r.name);
}

// ── settings ─────────────────────────────────────────────────────────────────
export function getSetting(key) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setSetting(key, value) {
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .run(key, JSON.stringify(value));
}

export function setThumbnailPath(assetId, thumbPath) {
  db.prepare(`UPDATE assets SET thumbnail_path = ? WHERE id = ?`).run(thumbPath, assetId);
}

// ── categories ────────────────────────────────────────────────────────────────
export function getCategories() {
  return db.prepare(`
    SELECT c.id, c.name, c.description,
      COUNT(ac.asset_id) as assetCount
    FROM categories c
    LEFT JOIN asset_categories ac ON ac.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
}

export function createCategory(name, description = '') {
  return db.prepare(`INSERT INTO categories (name, description) VALUES (?, ?) RETURNING id, name, description`)
    .get(name, description);
}

export function deleteCategory(id) {
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
}

export function renameCategory(id, name) {
  db.prepare(`UPDATE categories SET name = ? WHERE id = ?`).run(name, id);
}

export function getOrCreateCategory(name) {
  db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`).run(name);
  return db.prepare(`SELECT id FROM categories WHERE name = ? COLLATE NOCASE`).get(name);
}

export function assignCategory(assetId, categoryId) {
  db.prepare(`INSERT OR IGNORE INTO asset_categories (asset_id, category_id) VALUES (?, ?)`)
    .run(assetId, categoryId);
}

export function removeFromCategory(assetId, categoryId) {
  db.prepare(`DELETE FROM asset_categories WHERE asset_id = ? AND category_id = ?`)
    .run(assetId, categoryId);
}

export function bulkAssignCategory(assetIds, categoryId) {
  const stmt = db.prepare(`INSERT OR IGNORE INTO asset_categories (asset_id, category_id) VALUES (?, ?)`);
  db.transaction(() => { for (const id of assetIds) stmt.run(id, categoryId); })();
}

export default db;
