/**
 * TaskFormModal component — create/edit tasks and subtasks with date range & subtask auto-distribution.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import type { Priority, SubTask, Task } from '../../lib/types';
import {
  dateToDayNum,
  dayNumToDate,
  todayDayNum,
  toInputDateStr,
  parseInputDateStr,
  clampDayNum,
  distributeAcrossRange,
} from '../../lib/dates';
import { generateId } from '../../lib/storage';
import './TaskFormModal.css';

interface TaskFormModalProps {
  editTask?: Task;
  defaultDate?: number;
  onClose: () => void;
}

export function TaskFormModal({ editTask, defaultDate, onClose }: TaskFormModalProps) {
  const { state, dispatch } = useStore();
  const categories = state.categories;

  const initialStart = editTask
    ? dayNumToDate(editTask.startDay)
    : defaultDate
      ? dayNumToDate(defaultDate)
      : new Date();

  const initialEnd = editTask ? dayNumToDate(editTask.endDay) : initialStart;

  const [title, setTitle] = useState(editTask?.title ?? '');
  const [notes, setNotes] = useState(editTask?.notes ?? '');
  const [categoryId, setCategoryId] = useState(editTask?.categoryId ?? categories[0]?.id ?? 1);
  const [priority, setPriority] = useState<Priority>(editTask?.priority ?? 1);
  const [startDateStr, setStartDateStr] = useState(toInputDateStr(initialStart));
  const [endDateStr, setEndDateStr] = useState(toInputDateStr(initialEnd));
  const [subtasks, setSubtasks] = useState<
    Array<{ title: string; done: boolean; dateStr: string }>
  >(
    editTask
      ? editTask.subtasks.map((st) => ({
          title: st.title,
          done: st.done,
          dateStr: toInputDateStr(dayNumToDate(st.day)),
        }))
      : []
  );

  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl+Enter to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: '', done: false, dateStr: startDateStr }]);
  };

  const handleUpdateSubtask = (index: number, field: string, value: any) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const handleDeleteSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleMoveSubtask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subtasks.length) return;
    const updated = [...subtasks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSubtasks(updated);
  };

  const handleDistribute = () => {
    if (subtasks.length === 0) return;
    const startDay = dateToDayNum(parseInputDateStr(startDateStr));
    const endDay = dateToDayNum(parseInputDateStr(endDateStr));
    const days = distributeAcrossRange(startDay, endDay, subtasks.length);
    const updated = subtasks.map((st, i) => ({
      ...st,
      dateStr: toInputDateStr(dayNumToDate(days[i])),
    }));
    setSubtasks(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    const startDay = dateToDayNum(parseInputDateStr(startDateStr));
    const endDay = dateToDayNum(parseInputDateStr(endDateStr));

    if (endDay < startDay) {
      setError('End date cannot be before start date.');
      return;
    }

    const parsedSubtasks: SubTask[] = subtasks
      .filter((st) => st.title.trim() !== '')
      .map((st) => {
        const subDay = dateToDayNum(parseInputDateStr(st.dateStr));
        const clampedDay = clampDayNum(subDay, startDay, endDay);
        return {
          title: st.title.trim(),
          done: st.done,
          day: clampedDay,
        };
      });

    const taskData: Task = {
      id: editTask ? editTask.id : generateId(),
      title: title.trim(),
      notes: notes.trim(),
      categoryId,
      done: editTask ? editTask.done : false,
      startDay,
      endDay,
      priority,
      subtasks: parsedSubtasks,
    };

    if (editTask) {
      dispatch({ type: 'UPDATE_TASK', task: taskData });
    } else {
      dispatch({ type: 'ADD_TASK', task: taskData });
    }
    onClose();
  };

  const handleDeleteTask = () => {
    if (editTask) {
      dispatch({ type: 'DELETE_TASK', taskId: editTask.id });
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="task-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={editTask ? 'Edit task' : 'New task'}
      >
        <div className="task-modal-header">
          <h2 className="heading-serif">{editTask ? 'Edit Task' : 'New Task'}</h2>
          <button className="task-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-modal-form">
          {error && <div className="task-form-error">{error}</div>}

          <div className="task-form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Launch website redesign"
              autoFocus
              required
            />
          </div>

          <div className="task-form-row">
            <div className="task-form-group">
              <label htmlFor="task-cat">Category</label>
              <select
                id="task-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="task-form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) as Priority)}
              >
                <option value={0}>Low</option>
                <option value={1}>Normal</option>
                <option value={2}>High</option>
              </select>
            </div>
          </div>

          <div className="task-form-row">
            <div className="task-form-group">
              <label htmlFor="task-start">Start Date</label>
              <input
                id="task-start"
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
              />
            </div>
            <div className="task-form-group">
              <label htmlFor="task-end">End Date</label>
              <input
                id="task-end"
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
              />
            </div>
          </div>

          <div className="task-form-group">
            <label htmlFor="task-notes">Notes (optional)</label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, links or context..."
              rows={2}
            />
          </div>

          {/* Subtasks Section */}
          <div className="subtasks-section">
            <div className="subtasks-header">
              <label>Sub-tasks ({subtasks.length})</label>
              {subtasks.length > 1 && (
                <button
                  type="button"
                  className="subtasks-distribute-btn"
                  onClick={handleDistribute}
                >
                  Plan across range
                </button>
              )}
            </div>

            <div className="subtasks-list">
              {subtasks.map((st, idx) => (
                <div key={idx} className="subtask-row">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={(e) => handleUpdateSubtask(idx, 'done', e.target.checked)}
                    aria-label={`Mark subtask "${st.title || 'untitled'}" done`}
                  />
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => handleUpdateSubtask(idx, 'title', e.target.value)}
                    placeholder={`Sub-task ${idx + 1}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <input
                    type="date"
                    value={st.dateStr}
                    min={startDateStr}
                    max={endDateStr}
                    onChange={(e) => handleUpdateSubtask(idx, 'dateStr', e.target.value)}
                    aria-label="Subtask date"
                  />
                  <div className="subtask-actions">
                    <button
                      type="button"
                      onClick={() => handleMoveSubtask(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSubtask(idx, 'down')}
                      disabled={idx === subtasks.length - 1}
                      title="Move down"
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      className="subtask-del"
                      onClick={() => handleDeleteSubtask(idx)}
                      title="Delete subtask"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="subtasks-add-btn" onClick={handleAddSubtask}>
              + Add sub-task
            </button>
          </div>

          <div className="task-modal-actions">
            {editTask && (
              <button
                type="button"
                className="task-btn-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
            )}
            <div className="task-modal-actions-right">
              <button type="button" className="task-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="task-btn-save">
                {editTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete task?</h3>
              <p>This will permanently remove "{editTask?.title}" and its sub-tasks.</p>
              <div className="confirm-buttons">
                <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn-danger-solid" onClick={handleDeleteTask}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
