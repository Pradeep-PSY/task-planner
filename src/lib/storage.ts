/**
 * Storage module — compress/decompress, persist to localStorage.
 *
 * Storage keys:
 *   plan:v1:data   → lz-string compressToUTF16 of compact JSON
 *   plan:v1:meta   → plain JSON (small, uncompressed)
 *   plan:v1:backup → raw string backup if data was corrupt
 */

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import type {
  AppData,
  AppMeta,
  Category,
  CompactCategory,
  CompactData,
  CompactSubTask,
  CompactTask,
  Priority,
  SubTask,
  Task,
} from './types';

const KEY_DATA = 'plan:v1:data';
const KEY_META = 'plan:v1:meta';
const KEY_BACKUP = 'plan:v1:backup';

const CURRENT_VERSION = 1;

/* ------ Default categories ------ */

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Work', color: 'var(--cat-blue)' },
  { id: 2, name: 'Editing', color: 'var(--cat-green)' },
  { id: 3, name: 'Reading', color: 'var(--cat-amber)' },
  { id: 4, name: 'Learning', color: 'var(--cat-violet)' },
  { id: 5, name: 'Personal', color: 'var(--cat-orange)' },
  { id: 6, name: 'Health', color: 'var(--cat-rose)' },
];

export const CATEGORY_COLORS = [
  'var(--cat-blue)',
  'var(--cat-green)',
  'var(--cat-amber)',
  'var(--cat-rose)',
  'var(--cat-violet)',
  'var(--cat-teal)',
  'var(--cat-orange)',
  'var(--cat-slate)',
];

/* ------ Compact ↔ Expand ------ */

export function compactTask(task: Task): CompactTask {
  const ct: CompactTask = {
    i: task.id,
    t: task.title,
    c: task.categoryId,
    s: task.done ? 1 : 0,
    a: task.startDay,
    b: task.endDay,
  };
  if (task.notes) ct.n = task.notes;
  if (task.priority !== 1) ct.p = task.priority;
  if (task.subtasks.length > 0) {
    ct.k = task.subtasks.map(compactSubTask);
  }
  return ct;
}

function compactSubTask(st: SubTask): CompactSubTask {
  return [st.title, st.done ? 1 : 0, st.day];
}

function compactCategory(cat: Category): CompactCategory {
  return { i: cat.id, n: cat.name, c: cat.color };
}

export function expandTask(ct: CompactTask): Task {
  return {
    id: ct.i,
    title: ct.t,
    notes: ct.n ?? '',
    categoryId: ct.c,
    done: ct.s === 1,
    startDay: ct.a,
    endDay: ct.b,
    priority: (ct.p ?? 1) as Priority,
    subtasks: (ct.k ?? []).map(expandSubTask),
  };
}

function expandSubTask(cst: CompactSubTask): SubTask {
  return { title: cst[0], done: cst[1] === 1, day: cst[2] };
}

function expandCategory(cc: CompactCategory): Category {
  return { id: cc.i, name: cc.n, color: cc.c };
}

export function packData(data: AppData): CompactData {
  return {
    t: data.tasks.map(compactTask),
    c: data.categories.map(compactCategory),
  };
}

export function unpackData(cd: CompactData): AppData {
  return {
    tasks: cd.t.map(expandTask),
    categories: cd.c.map(expandCategory),
  };
}

/* ------ Serialize / Deserialize ------ */

export function serializeData(data: AppData): string {
  const compact = packData(data);
  const json = JSON.stringify(compact);
  return compressToUTF16(json);
}

export function deserializeData(compressed: string): AppData {
  const json = decompressFromUTF16(compressed);
  if (!json) throw new Error('Decompression returned null');
  const compact: CompactData = JSON.parse(json);
  return unpackData(compact);
}

/** Measure compressed vs uncompressed sizes. */
export function measureStorage(data: AppData): { compressed: number; uncompressed: number } {
  const compact = packData(data);
  const json = JSON.stringify(compact);
  const compressed = compressToUTF16(json);
  return {
    compressed: compressed.length * 2, // UTF-16 chars are 2 bytes
    uncompressed: new Blob([JSON.stringify(data)]).size,
  };
}

/* ------ LocalStorage operations ------ */

export function saveData(data: AppData): void {
  try {
    const compressed = serializeData(data);
    localStorage.setItem(KEY_DATA, compressed);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Storage is full. Please export your data and clear some tasks.');
    }
    throw err;
  }
}

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY_DATA);
    if (!raw) return null;
    return deserializeData(raw);
  } catch {
    // Backup corrupt data
    const raw = localStorage.getItem(KEY_DATA);
    if (raw) {
      try {
        localStorage.setItem(KEY_BACKUP, raw);
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}

export function saveMeta(meta: AppMeta): void {
  try {
    localStorage.setItem(KEY_META, JSON.stringify(meta));
  } catch {
    /* best-effort */
  }
}

export function loadMeta(): AppMeta | null {
  try {
    const raw = localStorage.getItem(KEY_META);
    if (!raw) return null;
    return JSON.parse(raw) as AppMeta;
  } catch {
    return null;
  }
}

export function clearAllData(): void {
  localStorage.removeItem(KEY_DATA);
  localStorage.removeItem(KEY_META);
  localStorage.removeItem(KEY_BACKUP);
}

/** Export full data as a JSON download. */
export function exportData(data: AppData, meta: AppMeta): void {
  const payload = JSON.stringify({ version: CURRENT_VERSION, meta, data }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plan-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import data from a JSON file. Returns the parsed data+meta or throws. */
export function parseImportFile(text: string): { data: AppData; meta: AppMeta } {
  const parsed = JSON.parse(text);
  if (!parsed.data || !parsed.meta) {
    throw new Error('Invalid backup file format.');
  }
  // Future: migrate(parsed.version, parsed.data) here
  return { data: parsed.data as AppData, meta: parsed.meta as AppMeta };
}

/** Schema migration placeholder. */
export function migrate(_fromVersion: number, _data: unknown): AppData {
  // Currently v1 — no migrations needed yet.
  // Future versions add cases here.
  return _data as AppData;
}

/** Generate a unique ID. */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
