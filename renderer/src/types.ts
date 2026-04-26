// renderer/src/types.ts

export interface Asset {
  id: number;
  path: string;
  filename: string;
  type: 'image' | 'video';
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_sec: number | null;
  date_taken: string | null;    // ISO 8601
  date_modified: string;        // ISO 8601
  make: string | null;
  model: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  rating: number;               // 0–5
  favorite: boolean;
  description: string;
  thumbnail_path: string | null; // absolute fs path; served via thumb:// protocol
  tags: string[];
  categories: string[];     // category names this asset belongs to
}

export interface AssetQuery {
  search?: string;              // FTS5 search on filename + description
  type?: 'image' | 'video' | 'all';
  tags?: string[];              // AND filter — asset must have all listed tags
  favorite?: boolean;
  ratingMin?: number;           // 0–5
  dateFrom?: string;            // ISO date, filter on date_taken
  dateTo?: string;
  sortBy?: 'date_taken' | 'date_modified' | 'filename' | 'rating' | 'size_bytes';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  categoryId?: number;      // filter by category
}

export interface AssetUpdate {
  rating?: number;
  favorite?: boolean;
  description?: string;
}

export interface CrawlerProgress {
  scanned: number;   // directories visited
  found: number;     // media files discovered
  indexed: number;   // successfully inserted/updated in DB
  currentPath: string;
  done: boolean;
  error?: string;
}

export interface Settings {
  crawlPaths: string[];         // directories to crawl
}

export interface Category {
  id: number;
  name: string;
  description: string;
  assetCount: number;
}

// window.dam shape — preload exposes this via contextBridge
export interface DamApi {
  getAssets(query: AssetQuery): Promise<{ assets: Asset[]; total: number }>;
  getAssetById(id: number): Promise<Asset | null>;
  updateAsset(id: number, update: AssetUpdate): Promise<void>;
  addTag(assetId: number, tag: string): Promise<void>;
  removeTag(assetId: number, tag: string): Promise<void>;
  getAllTags(): Promise<string[]>;
  startCrawl(paths: string[]): Promise<void>;
  stopCrawl(): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  selectDirectory(): Promise<string | null>;
  /** Register a crawler progress listener. Returns cleanup fn. */
  onCrawlerProgress(cb: (progress: CrawlerProgress) => void): () => void;
  getCategories(): Promise<Category[]>;
  createCategory(name: string, description?: string): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  renameCategory(id: number, name: string): Promise<void>;
  assignCategory(assetId: number, categoryId: number): Promise<void>;
  removeFromCategory(assetId: number, categoryId: number): Promise<void>;
  bulkAssignCategory(assetIds: number[], categoryId: number): Promise<void>;
  deleteAsset(id: number, deleteFile: boolean): Promise<void>;
  showInFolder(filePath: string): Promise<void>;
}

declare global {
  interface Window { dam: DamApi; }
}
