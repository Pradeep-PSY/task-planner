/**
 * CalendarHeader — view toggle, navigation, and date label.
 */

import React from 'react';
import { useStore } from '../../store';
import type { CalendarView } from '../../lib/types';
import {
  dayNumToDate,
  dateToDayNum,
  todayDayNum,
  getWeekStart,
  getWeekDays,
  formatDateRange,
  formatMonthYear,
  addDays,
} from '../../lib/dates';
import './CalendarHeader.css';

const VIEW_TABS: { key: CalendarView; label: string; desktopOnly?: boolean }[] = [
  { key: 'week', label: 'Week', desktopOnly: true },
  { key: 'month', label: 'Month' },
  { key: 'list', label: 'List' },
];

export function CalendarHeader() {
  const { state, dispatch } = useStore();
  const { calendarView, viewDate, weekStartMonday } = state;

  const viewDateObj = dayNumToDate(viewDate);

  /* ---- Label ---- */
  let dateLabel: string;
  if (calendarView === 'month') {
    dateLabel = formatMonthYear(viewDateObj);
  } else if (calendarView === 'week') {
    const weekStart = getWeekStart(viewDateObj, weekStartMonday);
    const weekDays = getWeekDays(weekStart);
    dateLabel = formatDateRange(weekDays[0], weekDays[6]);
  } else {
    dateLabel = formatMonthYear(viewDateObj);
  }

  /* ---- Navigation ---- */
  function navigate(direction: -1 | 1) {
    if (calendarView === 'week') {
      const next = addDays(viewDateObj, direction * 7);
      dispatch({ type: 'SET_VIEW_DATE', day: dateToDayNum(next) });
    } else if (calendarView === 'month') {
      const year = viewDateObj.getFullYear();
      const month = viewDateObj.getMonth();
      const d = new Date(year, month + direction, 1);
      dispatch({ type: 'SET_VIEW_DATE', day: dateToDayNum(d) });
    } else {
      // list view: navigate by week
      const next = addDays(viewDateObj, direction * 7);
      dispatch({ type: 'SET_VIEW_DATE', day: dateToDayNum(next) });
    }
  }

  function goToToday() {
    dispatch({ type: 'SET_VIEW_DATE', day: todayDayNum() });
  }

  function switchView(view: CalendarView) {
    dispatch({ type: 'SET_CALENDAR_VIEW', view });
  }

  return (
    <header className="cal-header">
      <div className="cal-header__top">
        <h2 className="cal-header__label heading-serif">{dateLabel}</h2>

        <div className="cal-header__tabs" role="tablist" aria-label="Calendar view">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={calendarView === tab.key}
              className={`cal-header__tab ${calendarView === tab.key ? 'cal-header__tab--active' : ''} ${
                tab.desktopOnly ? 'cal-header__tab--desktop-only' : ''
              }`}
              onClick={() => switchView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cal-header__nav">
        <button
          className="cal-header__nav-btn"
          onClick={() => navigate(-1)}
          aria-label={`Previous ${calendarView}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button className="cal-header__today-btn" onClick={goToToday}>
          Today
        </button>

        <button
          className="cal-header__nav-btn"
          onClick={() => navigate(1)}
          aria-label={`Next ${calendarView}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
