/**
 * ListView component — simple list view of tasks sorted by date.
 */

import React from 'react';
import type { Category, Task } from '../../lib/types';
import { dayNumToDate, formatShortDate } from '../../lib/dates';
import { PRIORITY_LABELS } from '../../lib/types';
import './ListView.css';

interface ListViewProps {
  tasks: Task[];
  categories: Category[];
  onEditTask: (taskId: string) => void;
  dispatch: React.Dispatch<any>;
}

export function ListView({ tasks, categories, onEditTask, dispatch }: ListViewProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Sort tasks by start day
  const sorted = [...tasks].sort((a, b) => a.startDay - b.startDay);

  if (sorted.length === 0) {
    return (
      <div className="list-empty">
        <h3 className="heading-serif">No tasks found</h3>
        <p>Get started by creating a new task.</p>
      </div>
    );
  }

  return (
    <div className="list-view" role="region" aria-label="Tasks list">
      <div className="list-header-row">
        <span>Status</span>
        <span>Task</span>
        <span>Category</span>
        <span>Dates</span>
        <span>Priority</span>
        <span>Sub-tasks</span>
      </div>
      <div className="list-items">
        {sorted.map((task) => {
          const cat = categoryMap.get(task.categoryId);
          const startDate = dayNumToDate(task.startDay);
          const endDate = dayNumToDate(task.endDay);
          const completedSub = task.subtasks.filter((st) => st.done).length;
          const totalSub = task.subtasks.length;

          return (
            <div
              key={task.id}
              className={`list-item ${task.done ? 'is-done' : ''}`}
              onClick={() => onEditTask(task.id)}
            >
              <div className="list-col-status" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => dispatch({ type: 'TOGGLE_TASK', taskId: task.id })}
                  aria-label={`Mark "${task.title}" complete`}
                />
              </div>
              <div className="list-col-title">
                <span className="list-task-title">{task.title}</span>
                {task.notes && <span className="list-task-notes">{task.notes}</span>}
              </div>
              <div className="list-col-cat">
                {cat && (
                  <span className="list-cat-badge" style={{ backgroundColor: cat.color }}>
                    {cat.name}
                  </span>
                )}
              </div>
              <div className="list-col-dates">
                {formatShortDate(startDate)} – {formatShortDate(endDate)}
              </div>
              <div className="list-col-priority">
                <span className={`priority-tag priority-${task.priority}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <div className="list-col-sub">
                {totalSub > 0 ? `${completedSub}/${totalSub}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
