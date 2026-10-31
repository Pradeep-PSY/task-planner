/**
 * MonthView — standard 6x7 month grid with date numbers and task indicators.
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store';
import type { Task, Category } from '../../lib/types';
import {
  dayNumToDate,
  dateToDayNum,
  todayDayNum,
  getMonthStart,
  getDaysInMonth,
  getWeekdayNames,
} from '../../lib/dates';
import './MonthView.css';

interface MonthViewProps {
  onAddTask: (dayNum: number) => void;
  onEditTask: (taskId: string) => void;
}

interface DayCell {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  tasks: Task[];
}

function categoryById(categories: Category[], id: number): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function MonthView({ onAddTask, onEditTask }: MonthViewProps) {
  const { state } = useStore();
  const { tasks, categories, viewDate, weekStartMonday, categoryFilter } = state;

  const today = todayDayNum();
  const viewDateObj = dayNumToDate(viewDate);
  const monthStart = getMonthStart(viewDateObj);
  const weekdayNames = getWeekdayNames(weekStartMonday);

  /* ---- Filter tasks ---- */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilter !== null && !categoryFilter.has(t.categoryId)) return false;
      return true;
    });
  }, [tasks, categoryFilter]);

  /* ---- Build 6x7 grid cells ---- */
  const cells = useMemo(() => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDayOfWeek = monthStart.getDay(); // 0 = Sun

    // Calculate offset based on weekStartMonday
    let offset = weekStartMonday
      ? (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)
      : firstDayOfWeek;

    const daysInMonth = getDaysInMonth(monthStart);
    const result: DayCell[] = [];

    // Previous month padding days
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthEnd - i);
      const dayNum = dateToDayNum(date);
      result.push({
        date,
        dayNum,
        isCurrentMonth: false,
        tasks: filteredTasks.filter((t) => t.startDay <= dayNum && t.endDay >= dayNum),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayNum = dateToDayNum(date);
      result.push({
        date,
        dayNum,
        isCurrentMonth: true,
        tasks: filteredTasks.filter((t) => t.startDay <= dayNum && t.endDay >= dayNum),
      });
    }

    // Next month padding days to fill 42 cells (6 rows × 7 cols)
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const dayNum = dateToDayNum(date);
      result.push({
        date,
        dayNum,
        isCurrentMonth: false,
        tasks: filteredTasks.filter((t) => t.startDay <= dayNum && t.endDay >= dayNum),
      });
    }

    return result;
  }, [monthStart, weekStartMonday, filteredTasks]);

  return (
    <div className="month-view">
      {/* --- Weekday header --- */}
      <div className="month-view__header">
        {weekdayNames.map((name, i) => (
          <div key={i} className="month-view__weekday">
            {name}
          </div>
        ))}
      </div>

      {/* --- Grid cells --- */}
      <div className="month-view__grid">
        {cells.map((cell, idx) => {
          const isToday = cell.dayNum === today;
          const maxVisible = 3;
          const visibleTasks = cell.tasks.slice(0, maxVisible);
          const overflowCount = cell.tasks.length - maxVisible;

          return (
            <div
              key={idx}
              className={`month-view__cell ${!cell.isCurrentMonth ? 'month-view__cell--outside' : ''} ${
                isToday ? 'month-view__cell--today' : ''
              }`}
              onClick={() => onAddTask(cell.dayNum)}
              title="Click to view day"
            >
              <div className="month-view__cell-header">
                <span className={`month-view__date-num ${isToday ? 'month-view__date-num--today' : ''}`}>
                  {cell.date.getDate()}
                </span>
                {cell.tasks.length > 0 && (
                  <span className="month-view__count-badge">{cell.tasks.length}</span>
                )}
              </div>

              <div className="month-view__tasks">
                {visibleTasks.map((t) => {
                  const cat = categoryById(categories, t.categoryId);
                  const color = cat?.color ?? 'var(--color-text-tertiary)';
                  const isMulti = t.startDay !== t.endDay;

                  return (
                    <button
                      key={t.id}
                      className={`month-view__task-bar ${t.done ? 'month-view__task-bar--done' : ''} ${
                        isMulti ? 'month-view__task-bar--multi' : ''
                      }`}
                      style={{ backgroundColor: color + '22', borderLeftColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(t.id);
                      }}
                      title={t.title}
                    >
                      <span
                        className="month-view__task-dot"
                        style={{ backgroundColor: color }}
                      />
                      <span className="month-view__task-title">{t.title}</span>
                    </button>
                  );
                })}
                {overflowCount > 0 && (
                  <span
                    className="month-view__overflow"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTask(cell.dayNum);
                    }}
                  >
                    +{overflowCount} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
