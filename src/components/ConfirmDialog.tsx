/**
 * ConfirmDialog — a reusable centered confirmation dialog with backdrop.
 *
 * Features:
 *  - ARIA role="alertdialog" with aria-modal and aria-describedby
 *  - Focus trap: auto-focuses Cancel on mount, traps Tab between buttons
 *  - Esc key closes (calls onCancel)
 *  - Optional danger styling on the confirm button
 */

import React, { useEffect, useRef, useCallback } from 'react';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  /* Auto-focus cancel button on mount */
  useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  /* Trap focus between the two buttons and handle Esc */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean,
        ) as HTMLElement[];
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
    [onCancel],
  );

  /* Prevent backdrop click from propagating */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <div
      className="confirm-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLDivElement>}
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="confirm-dialog-message"
      >
        <h2 className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message" id="confirm-dialog-message">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button
            ref={cancelBtnRef}
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            className={`confirm-dialog__btn confirm-dialog__btn--confirm${
              danger ? ' confirm-dialog__btn--danger' : ''
            }`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
