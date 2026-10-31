/**
 * WeekView — seven-day columnar calendar with task bars and sub-task cards.
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store';
import type { Task, SubTask, Category } from '../../lib/types';
import {
  dayNumToDate,
  dateToDayNum,
  todayDayNum,
  getWeekStart,
  getWeekDays,
  getWeekdayNames,
  formatShortDate,
} from '../../lib/dates';
import './WeekView.css';

interface WeekViewProps {
  onAddTask: (dayNum: number) => void;
  onEditTask: (taskId: string) => void;
  onOpenDayView: (dayNum: number) => void;
}

/* ---- Helpers ---- */

/** Items that appear as horizontal bars in the tasks lane. */
interface BarItem {
  task: Task;
  /** Column indices within the week (0-6), clamped to visible range. */
  startCol: number;
  endCol: number;
  /** True when the real task extends before / after visible week. */
  continuesBefore: boolean;
  continuesAfter: boolean;
  /** Subtask progress. */
  doneCount: number;
  totalCount: number;
}

/** Items shown inside a single-day column. */
interface DayItem {
  type: 'task' | 'subtask';
  task: Task;
  subtaskIndex?: number;
  subtask?: SubTask;
  done: boolean;
  label: string;
  /** Parent task title for subtasks. */
  parentLabel?: string;
}

function categoryById(categories: Category[], id: number): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function WeekView({ onAddTask, onEditTask, onOpenDayView }: WeekViewProps) {
  const { state, dispatch } = useStore();
  const { tasks, categories, viewDate, weekStartMonday, categoryFilter } = state;

  const today = todayDayNum();
  const viewDateObj = dayNumToDate(viewDate);
  const weekStart = getWeekStart(viewDateObj, weekStartMonday);
  const weekDays = getWeekDays(weekStart);
  const dayNums = weekDays.map(dateToDayNum);
  const weekdayNames = getWeekdayNames(weekStartMonday);

  const firstDay = dayNums[0];
  const lastDay = dayNums[6];

  /* ---- Filter tasks ---- */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilter !== null && !categoryFilter.has(t.categoryId)) return false;
      // Task overlaps with week range
      return t.startDay <= lastDay && t.endDay >= firstDay;
    });
  }, [tasks, categoryFilter, firstDay, lastDay]);

  /* ---- Build bars (multi-day tasks) ---- */
  const bars: BarItem[] = useMemo(() => {
    return filteredTasks
      .filter((t) => t.endDay > t.startDay) // multi-day
      .map((t) => {
        const clampedStart = Math.max(t.startDay, firstDay);
        const clampedEnd = Math.min(t.endDay, lastDay);
        const doneCount = t.subtasks.filter((st: SubTask) => st.done).length;
        return {
          task: t,
          startCol: clampedStart - firstDay,
          endCol: clampedEnd - firstDay,
          continuesBefore: t.startDay < firstDay,
          continuesAfter: t.endDay > lastDay,
          doneCount,
          totalCount: t.subtasks.length,
        };
      })
      .sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);
  }, [filteredTasks, firstDay, lastDay]);

  /* ---- Build per-day items ---- */
  const dayItems: DayItem[][] = useMemo(() => {
    return dayNums.map((dayNum) => {
      const items: DayItem[] = [];

      for (const task of filteredTasks) {
        // Single-day tasks
        if (task.startDay === task.endDay && task.startDay === dayNum) {
          items.push({
            type: 'task',
            task,
            done: task.done,
            label: task.title,
          });
        }

        // Sub-tasks scheduled on this day
        task.subtasks.forEach((st: SubTask, idx: number) => {
          if (st.day === dayNum) {
            items.push({
              type: 'subtask',
              task,
              subtaskIndex: idx,
              subtask: st,
              done: st.done,
              label: st.title,
              parentLabel: task.title,
            });
          }
        });
      }

      return items;
    });
  }, [filteredTasks, dayNums]);

  const isEmpty = filteredTasks.length === 0 && bars.length === 0;

  /* ---- Render ---- */
  if (isEmpty) {
    return (
      <div className="week-empty">
        <h3 className="week-empty__title heading-serif">No tasks this week</h3>
        <p className="week-empty__text">
          Plan your week by adding tasks. Click a day or use the button below to get started.
        </p>
        <button
          className="week-empty__btn"
          onClick={() => onAddTask(today >= firstDay && today <= lastDay ? today : firstDay)}
        >
          Add a task
        </button>
      </div>
    );
  }

  return (
    <div className="week-view">
      {/* --- Header row --- */}
      <div className="week-view__header">
        <div className="week-view__gutter" />
        {weekDays.map((date, i) => {
          const isToday = dayNums[i] === today;
          const dayNum = dayNums[i];
          return (
            <div
              key={i}
              className={`week-view__day-header ${isToday ? 'week-view__day-header--today' : ''}`}
              onClick={() => onOpenDayView(dayNum)}
              style={{ cursor: 'pointer' }}
              title="Click to view day"
            >
              <span className="week-view__weekday">{weekdayNames[i]}</span>
              <span className={`week-view__date-num ${isToday ? 'week-view__date-num--today' : ''}`}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* --- Tasks lane (multi-day bars) --- */}
      {bars.length > 0 && (
        <div className="week-view__lane">
          <div className="week-view__gutter week-view__gutter--label">Tasks</div>
          <div className="week-view__lane-grid">
            {bars.map((bar) => {
              const cat = categoryById(categories, bar.task.categoryId);
              const color = cat?.color ?? 'var(--color-text-tertiary)';
              const span = bar.endCol - bar.startCol + 1;
              const isOverdue = !bar.task.done && bar.task.endDay < today;
              const progress = bar.totalCount > 0
                ? `${bar.doneCount}/${bar.totalCount}`
                : undefined;

              return (
                <button
                  key={bar.task.id}
                  className={`week-view__bar ${bar.task.done ? 'week-view__bar--done' : ''}`}
                  style={{
                    gridColumn: `${bar.startCol + 1} / span ${span}`,
                    backgroundColor: color + '22',
                    borderLeftColor: bar.continuesBefore ? 'transparent' : color,
                    borderRightColor: bar.continuesAfter ? 'transparent' : 'transparent',
                    '--bar-color': color,
                  } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(bar.task.id);
                  }}
                  title={bar.task.title}
                >
                  {bar.continuesBefore && <span className="week-view__cont" aria-label="continues from previous week">&laquo;</span>}
                  <span className="week-view__bar-title">{bar.task.title}</span>
                  {progress && <span className="week-view__bar-progress">{progress}</span>}
                  {isOverdue && <span className="week-view__overdue-badge">overdue</span>}
                  {bar.continuesAfter && <span className="week-view__cont" aria-label="continues next week">&raquo;</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Day columns --- */}
      <div className="week-view__columns">
        <div className="week-view__gutter" />
        {dayNums.map((dayNum, colIdx) => {
          const isToday = dayNum === today;
          const items = dayItems[colIdx];
          return (
            <div
              key={colIdx}
              className={`week-view__col ${isToday ? 'week-view__col--today' : ''}`}
              onClick={() => onOpenDayView(dayNum)}
              title="Click to view day"
            >
              <div className="week-view__col-items">
                {items.map((item, itemIdx) => {
                  const cat = categoryById(categories, item.task.categoryId);
                  const color = cat?.color ?? 'var(--color-text-tertiary)';
                  const isOverdue = !item.done && item.task.endDay < today;

                  return (
                    <div
                      key={itemIdx}
                      className={`week-card ${item.done ? 'week-card--done' : ''} ${
                        item.type === 'subtask' ? 'week-card--subtask' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(item.task.id);
                      }}
                    >
                      <div className="week-card__top" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => {
                            if (item.type === 'subtask' && item.subtaskIndex !== undefined) {
                              dispatch({
                                type: 'TOGGLE_SUBTASK',
                                taskId: item.task.id,
                                subtaskIndex: item.subtaskIndex,
                              });
                            } else {
                              dispatch({ type: 'TOGGLE_TASK', taskId: item.task.id });
                            }
                          }}
                          aria-label={`Toggle "${item.label}"`}
                        />
                      </div>
                      <div className="week-card__content">
                        {item.parentLabel && (
                          <span className="week-card__parent">{item.parentLabel}</span>
                        )}
                        <span className="week-card__title">{item.label}</span>
                        <div className="week-card__footer">
                          <span
                            className="week-card__dot"
                            style={{ backgroundColor: color }}
                            title={cat?.name}
                          />
                          {isOverdue && <span className="week-card__overdue">overdue</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
