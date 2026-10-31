/**
 * DayViewModal — popup/drawer showing tasks and subtasks for a specific day.
 */

import React, { useEffect } from 'react';
import type { Task, Category, SubTask } from '../../lib/types';
import { dayNumToDate } from '../../lib/dates';
import { PRIORITY_LABELS } from '../../lib/types';
import './DayViewModal.css';

interface DayViewModalProps {
  dayNum: number;
  tasks: Task[];
  categories: Category[];
  onClose: () => void;
  onEditTask: (taskId: string) => void;
  onAddTaskForDate: (dayNum: number) => void;
  dispatch: React.Dispatch<any>;
}

export function DayViewModal({
  dayNum,
  tasks,
  categories,
  onClose,
  onEditTask,
  onAddTaskForDate,
  dispatch,
}: DayViewModalProps) {
  const dateObj = dayNumToDate(dayNum);
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Tasks overlapping this day
  const dayTasks = tasks.filter((t) => t.startDay <= dayNum && t.endDay >= dayNum);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="task-modal day-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <div>
            <span className="day-modal-subtitle">Day View</span>
            <h2>{dateLabel}</h2>
          </div>
          <button className="task-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="day-modal-body">
          <div className="day-modal-actions-top">
            <button className="day-modal-add-btn" onClick={() => onAddTaskForDate(dayNum)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>Add task for this day</span>
            </button>
          </div>

          {dayTasks.length === 0 ? (
            <div className="day-modal-empty">
              <p>No tasks scheduled for this day.</p>
            </div>
          ) : (
            <div className="day-modal-task-list">
              {dayTasks.map((task) => {
                const cat = categoryMap.get(task.categoryId);
                const completedSub = task.subtasks.filter((st: SubTask) => st.done).length;
                const totalSub = task.subtasks.length;

                return (
                  <div
                    key={task.id}
                    className={`day-modal-task-card ${task.done ? 'is-done' : ''}`}
                    onClick={() => {
                      onClose();
                      onEditTask(task.id);
                    }}
                  >
                    <div className="day-modal-task-main">
                      <label className="day-modal-check-wrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => dispatch({ type: 'TOGGLE_TASK', taskId: task.id })}
                          aria-label={`Mark "${task.title}" complete`}
                        />
                      </label>
                      <div className="day-modal-task-info">
                        <span className="day-modal-task-title">{task.title}</span>
                        {task.notes && <span className="day-modal-task-notes">{task.notes}</span>}
                        <div className="day-modal-task-meta">
                          {cat && (
                            <span
                              className="day-modal-cat-badge"
                              style={{
                                backgroundColor: cat.color + '22',
                                color: cat.color,
                                borderColor: cat.color + '44',
                              }}
                            >
                              {cat.name}
                            </span>
                          )}
                          <span className={`priority-tag priority-${task.priority}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                          {totalSub > 0 && (
                            <span className="day-modal-sub-progress">
                              Subtasks: {completedSub}/{totalSub}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {totalSub > 0 && (
                      <div className="day-modal-subtasks" onClick={(e) => e.stopPropagation()}>
                        {task.subtasks.map((st: SubTask, idx: number) => (
                          <label key={idx} className="day-modal-subtask-item">
                            <input
                              type="checkbox"
                              checked={st.done}
                              onChange={() =>
                                dispatch({
                                  type: 'TOGGLE_SUBTASK',
                                  taskId: task.id,
                                  subtaskIndex: idx,
                                })
                              }
                            />
                            <span className={st.done ? 'is-done' : ''}>{st.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
