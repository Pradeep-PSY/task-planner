/**
 * App Store — React context with useReducer.
 * Single source of truth for tasks, categories, meta and UI state.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type {
  AppData,
  AppMeta,
  CalendarView,
  Category,
  Priority,
  SubTask,
  Task,
} from './lib/types';
import {
  clearAllData,
  DEFAULT_CATEGORIES,
  generateId,
  loadData,
  loadMeta,
  saveData,
  saveMeta,
} from './lib/storage';
import { todayDayNum } from './lib/dates';

/* ------ State shape ------ */

export interface AppState {
  /** Has the store been initialised from localStorage? */
  loaded: boolean;
  /** User's name (empty string = not yet onboarded). */
  userName: string;
  weekStartMonday: boolean;
  tasks: Task[];
  categories: Category[];
  /** Current calendar view. */
  calendarView: CalendarView;
  /** The date currently being viewed (as a day number). */
  viewDate: number;
  /** Category filter — null = show all, otherwise set of category ids. */
  categoryFilter: Set<number> | null;
  /** Storage error message, if any. */
  storageError: string | null;
}

const initialState: AppState = {
  loaded: false,
  userName: '',
  weekStartMonday: true,
  tasks: [],
  categories: [...DEFAULT_CATEGORIES],
  calendarView: 'week',
  viewDate: todayDayNum(),
  categoryFilter: null,
  storageError: null,
};

/* ------ Actions ------ */

export type Action =
  | { type: 'INIT'; data: AppData | null; meta: AppMeta | null }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_WEEK_START'; monday: boolean }
  | { type: 'SET_CALENDAR_VIEW'; view: CalendarView }
  | { type: 'SET_VIEW_DATE'; day: number }
  | { type: 'SET_CATEGORY_FILTER'; filter: Set<number> | null }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'TOGGLE_TASK'; taskId: string }
  | { type: 'TOGGLE_SUBTASK'; taskId: string; subtaskIndex: number }
  | { type: 'ADD_CATEGORY'; category: Category }
  | { type: 'UPDATE_CATEGORY'; category: Category }
  | { type: 'DELETE_CATEGORY'; categoryId: number; reassignTo: number }
  | { type: 'IMPORT_DATA'; data: AppData; meta: AppMeta }
  | { type: 'CLEAR_ALL' }
  | { type: 'STORAGE_ERROR'; message: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT': {
      const data = action.data;
      const meta = action.meta;
      return {
        ...state,
        loaded: true,
        userName: meta?.userName ?? '',
        weekStartMonday: meta?.weekStartMonday ?? true,
        tasks: data?.tasks ?? [],
        categories: data?.categories?.length ? data.categories : [...DEFAULT_CATEGORIES],
      };
    }

    case 'SET_NAME':
      return { ...state, userName: action.name };

    case 'SET_WEEK_START':
      return { ...state, weekStartMonday: action.monday };

    case 'SET_CALENDAR_VIEW':
      return { ...state, calendarView: action.view };

    case 'SET_VIEW_DATE':
      return { ...state, viewDate: action.day };

    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.filter };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, done: !t.done } : t)),
      };

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          const subtasks = t.subtasks.map((st: SubTask, i: number) =>
            i === action.subtaskIndex ? { ...st, done: !st.done } : st
          );
          return { ...t, subtasks };
        }),
      };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.category] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.category.id ? action.category : c
        ),
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.categoryId),
        tasks: state.tasks.map((t) =>
          t.categoryId === action.categoryId ? { ...t, categoryId: action.reassignTo } : t
        ),
      };

    case 'IMPORT_DATA':
      return {
        ...state,
        userName: action.meta.userName,
        weekStartMonday: action.meta.weekStartMonday,
        tasks: action.data.tasks,
        categories: action.data.categories,
      };

    case 'CLEAR_ALL':
      clearAllData();
      return {
        ...initialState,
        loaded: true,
      };

    case 'STORAGE_ERROR':
      return { ...state, storageError: action.message };

    default:
      return state;
  }
}

/* ------ Context ------ */

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

/* ------ Provider ------ */

const DEBOUNCE_MS = 300;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadData();
    const meta = loadMeta();
    dispatch({ type: 'INIT', data, meta });
  }, []);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const s = stateRef.current;
      if (!s.loaded) return;
      try {
        saveData({ tasks: s.tasks, categories: s.categories });
        saveMeta({
          version: 1,
          userName: s.userName,
          weekStartMonday: s.weekStartMonday,
        });
      } catch (err: unknown) {
        dispatch({
          type: 'STORAGE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to save data.',
        });
      }
    }, DEBOUNCE_MS);
  }, []);

  // Persist on state changes (after initial load)
  const prevState = useRef(state);
  useEffect(() => {
    if (!state.loaded) return;
    const prev = prevState.current;
    if (
      prev.tasks !== state.tasks ||
      prev.categories !== state.categories ||
      prev.userName !== state.userName ||
      prev.weekStartMonday !== state.weekStartMonday
    ) {
      scheduleSave();
    }
    prevState.current = state;
  }, [state, scheduleSave]);

  // Flush on visibility change / beforeunload
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      const s = stateRef.current;
      if (!s.loaded) return;
      try {
        saveData({ tasks: s.tasks, categories: s.categories });
        saveMeta({
          version: 1,
          userName: s.userName,
          weekStartMonday: s.weekStartMonday,
        });
      } catch {
        /* best-effort */
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

/* ------ Selector helpers ------ */

export function getPendingCounts(tasks: Task[]): {
  totalTasks: number;
  pendingTasks: number;
  pendingSubtasks: number;
} {
  let pendingTasks = 0;
  let pendingSubtasks = 0;
  for (const t of tasks) {
    if (!t.done) pendingTasks++;
    for (const st of t.subtasks) {
      if (!st.done) pendingSubtasks++;
    }
  }
  return { totalTasks: tasks.length, pendingTasks, pendingSubtasks };
}
