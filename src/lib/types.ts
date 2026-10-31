/**
 * Types — shared application types used throughout the app.
 */

/** Priority levels: 0 = low, 1 = normal, 2 = high */
export type Priority = 0 | 1 | 2;
export const PRIORITY_LABELS: Record<Priority, string> = { 0: 'Low', 1: 'Normal', 2: 'High' };

/** A sub-task in the full in-memory form. */
export interface SubTask {
  title: string;
  done: boolean;
  /** Day number (days since epoch). Must be within parent's range. */
  day: number;
}

/** A task in the full in-memory form. */
export interface Task {
  id: string;
  title: string;
  notes: string;
  /** Category id (number). */
  categoryId: number;
  /** false = todo, true = done */
  done: boolean;
  /** Start day number. */
  startDay: number;
  /** End day number (inclusive). */
  endDay: number;
  priority: Priority;
  subtasks: SubTask[];
}

/** A category. */
export interface Category {
  id: number;
  name: string;
  color: string;
}

/** The full app state persisted (in-memory expanded form). */
export interface AppData {
  tasks: Task[];
  categories: Category[];
}

/** Meta stored uncompressed. */
export interface AppMeta {
  version: number;
  userName: string;
  weekStartMonday: boolean;
}

/* ------ Compact (storage) formats ------ */

/** Compact sub-task: [title, done(0|1), dayNum] */
export type CompactSubTask = [string, 0 | 1, number];

/** Compact task object with short keys. */
export interface CompactTask {
  i: string; // id
  t: string; // title
  n?: string; // notes (omitted if empty)
  c: number; // category index
  s: 0 | 1; // status: 0 = todo, 1 = done
  a: number; // start day
  b: number; // end day
  p?: 0 | 1 | 2; // priority (omitted if 1/normal)
  k?: CompactSubTask[]; // sub-tasks (omitted if empty)
}

/** Compact category. */
export interface CompactCategory {
  i: number;
  n: string;
  c: string;
}

/** The shape stored under the compressed key. */
export interface CompactData {
  t: CompactTask[];
  c: CompactCategory[];
}

/* ------ View types ------ */

export type CalendarView = 'week' | 'month' | 'list';
