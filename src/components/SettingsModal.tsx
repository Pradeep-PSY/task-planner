/**
 * SettingsModal — preferences, storage info, import/export, and data reset.
 *
 * Accessible dialog with backdrop, Esc-to-close, and basic focus trapping.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useStore } from '../store';
import { exportData, parseImportFile, measureStorage } from '../lib/storage';
import type { AppData, AppMeta } from '../lib/types';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { state, dispatch } = useStore();

  /* --- Local field state --- */
  const [nameInput, setNameInput] = useState(state.userName);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  /* --- Storage measurement --- */
  const [storageInfo, setStorageInfo] = useState<{
    compressed: number;
    uncompressed: number;
  } | null>(null);

  useEffect(() => {
    try {
      const info = measureStorage({
        tasks: state.tasks,
        categories: state.categories,
      });
      setStorageInfo(info);
    } catch {
      setStorageInfo(null);
    }
  }, [state.tasks, state.categories]);

  /* --- Refs --- */
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* --- Focus management --- */

  // Remember and restore focus when the modal mounts / unmounts.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the panel so Esc works immediately.
    panelRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  /* --- Focus trap --- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  /* --- Handlers --- */

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== state.userName) {
      dispatch({ type: 'SET_NAME', name: trimmed });
    }
  };

  const handleWeekStartToggle = () => {
    dispatch({ type: 'SET_WEEK_START', monday: !state.weekStartMonday });
  };

  const handleExport = () => {
    const appData: AppData = {
      tasks: state.tasks,
      categories: state.categories,
    };
    const meta: AppMeta = {
      version: 1,
      userName: state.userName,
      weekStartMonday: state.weekStartMonday,
    };
    exportData(appData, meta);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const { data, meta } = parseImportFile(text);
        dispatch({ type: 'IMPORT_DATA', data, meta });
        setNameInput(meta.userName);
        setImportError(null);
      } catch (err: unknown) {
        setImportError(
          err instanceof Error ? err.message : 'Failed to import file.',
        );
      }
    };
    reader.onerror = () => {
      setImportError('Could not read file.');
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected.
    e.target.value = '';
  };

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
    setConfirmingClear(false);
    onClose();
  };

  /* --- Helpers --- */

  const formatKB = (bytes: number): string => {
    return (bytes / 1024).toFixed(1);
  };

  /* --- Backdrop click = close --- */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /* --- Render --- */

  return (
    <div
      className="settings-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="settings-panel"
        ref={panelRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            className="settings-close"
            type="button"
            onClick={onClose}
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        {/* Name */}
        <div className="settings-section">
          <label className="settings-label" htmlFor="settings-name">
            Name
          </label>
          <input
            id="settings-name"
            className="settings-input"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Your name"
            maxLength={60}
            autoComplete="given-name"
          />
        </div>

        {/* Week start */}
        <div className="settings-section">
          <label className="settings-label">Week starts on</label>
          <div className="settings-toggle-row">
            <div className="settings-toggle-text">
              {state.weekStartMonday ? 'Monday' : 'Sunday'}
              <small>
                {state.weekStartMonday
                  ? 'ISO standard (Mon–Sun)'
                  : 'US standard (Sun–Sat)'}
              </small>
            </div>
            <label className="settings-toggle" aria-label="Toggle week start day">
              <input
                type="checkbox"
                checked={state.weekStartMonday}
                onChange={handleWeekStartToggle}
              />
              <span className="settings-toggle__track" />
            </label>
          </div>
        </div>

        {/* Storage */}
        <div className="settings-section">
          <label className="settings-label">Storage</label>
          {storageInfo ? (
            <div className="settings-storage">
              <div className="settings-storage-item">
                <span className="value">{formatKB(storageInfo.compressed)} KB</span>
                <span className="label">Compressed</span>
              </div>
              <div className="settings-storage-item">
                <span className="value">{formatKB(storageInfo.uncompressed)} KB</span>
                <span className="label">Uncompressed</span>
              </div>
            </div>
          ) : (
            <div className="settings-storage">
              <div className="settings-storage-item">
                <span className="value">--</span>
                <span className="label">Unable to measure</span>
              </div>
            </div>
          )}
        </div>

        {/* Import / Export */}
        <div className="settings-section">
          <label className="settings-label">Data</label>
          <div className="settings-actions">
            <button
              className="settings-btn settings-btn--default"
              type="button"
              onClick={handleExport}
            >
              Export JSON
            </button>
            <button
              className="settings-btn settings-btn--default"
              type="button"
              onClick={handleImportClick}
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              className="settings-file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          {importError && (
            <div className="settings-error" role="alert">
              {importError}
            </div>
          )}
        </div>

        {/* Clear all */}
        <div className="settings-section">
          <label className="settings-label">Danger zone</label>
          {!confirmingClear ? (
            <div className="settings-actions">
              <button
                className="settings-btn settings-btn--danger"
                type="button"
                onClick={() => setConfirmingClear(true)}
              >
                Clear all data
              </button>
            </div>
          ) : (
            <div className="settings-confirm" role="alert">
              <span className="settings-confirm__text">
                This will permanently delete all tasks and settings.
              </span>
              <div className="settings-confirm__actions">
                <button
                  className="settings-confirm__yes"
                  type="button"
                  onClick={handleClearAll}
                >
                  Yes, clear everything
                </button>
                <button
                  className="settings-confirm__no"
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
