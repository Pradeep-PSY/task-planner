/**
 * Main App component — orchestrates views and state.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useStore, getPendingCounts } from './store';
import { getGreeting, getHelperText } from './lib/greeting';
import { todayDayNum, dayNumToDate } from './lib/dates';
import WelcomeScreen from './features/onboarding/WelcomeScreen';
import { CalendarHeader } from './features/calendar/CalendarHeader';
import { CategoryFilter } from './features/calendar/CategoryFilter';
import { WeekView } from './features/calendar/WeekView';
import { MonthView } from './features/calendar/MonthView';
import { ListView } from './features/calendar/ListView';
import { DayViewModal } from './features/calendar/DayViewModal';
import { TaskFormModal } from './features/tasks/TaskFormModal';
import CategoryManager from './features/categories/CategoryManager';
import SettingsModal from './components/SettingsModal';
import type { Task } from './lib/types';
import './App.css';

export default function App() {
  const { state, dispatch } = useStore();
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [addingForDate, setAddingForDate] = useState<number | undefined>(undefined);
  const [viewingDayNum, setViewingDayNum] = useState<number | undefined>(undefined);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Greeting
  const greeting = state.userName ? getGreeting(state.userName) : '';
  const { totalTasks, pendingTasks, pendingSubtasks } = useMemo(
    () => getPendingCounts(state.tasks),
    [state.tasks],
  );
  const helperText = getHelperText(totalTasks, pendingTasks, pendingSubtasks);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!state.categoryFilter || state.categoryFilter.size === 0) return state.tasks;
    return state.tasks.filter(t => state.categoryFilter!.has(t.categoryId));
  }, [state.tasks, state.categoryFilter]);

  // Handlers
  const handleViewDay = useCallback((dayNum: number) => {
    setViewingDayNum(dayNum);
  }, []);

  const handleAddTask = useCallback((dayNum?: number) => {
    setEditingTask(undefined);
    setAddingForDate(dayNum);
    setViewingDayNum(undefined);
    setShowTaskForm(true);
  }, []);

  const handleEditTask = useCallback((taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setAddingForDate(undefined);
      setViewingDayNum(undefined);
      setShowTaskForm(true);
    }
  }, [state.tasks]);

  const handleCloseTaskForm = useCallback(() => {
    setShowTaskForm(false);
    setEditingTask(undefined);
    setAddingForDate(undefined);
  }, []);

  const handleGoToday = useCallback(() => {
    dispatch({ type: 'SET_VIEW_DATE', day: todayDayNum() });
  }, [dispatch]);

  // Not loaded yet
  if (!state.loaded) {
    return (
      <div className="app-loading" aria-label="Loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  // Onboarding
  if (!state.userName) {
    return <WelcomeScreen />;
  }

  // On mobile, if view is week, default to month
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const activeView = isMobile && state.calendarView === 'week' ? 'month' : state.calendarView;

  // Calendar view component
  const viewProps = {
    tasks: filteredTasks,
    categories: state.categories,
    viewDate: state.viewDate,
    weekStartMonday: state.weekStartMonday,
    onAddTask: handleAddTask,
    onEditTask: handleEditTask,
    onOpenDayView: handleViewDay,
    dispatch,
  };

  let calendarContent: React.ReactNode;
  switch (activeView) {
    case 'week':
      calendarContent = <WeekView {...viewProps} />;
      break;
    case 'month':
      calendarContent = <MonthView {...viewProps} />;
      break;
    case 'list':
      calendarContent = <ListView {...viewProps} />;
      break;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-greeting heading-serif">{greeting}</h1>
          <p className="app-helper-text">{helperText}</p>
        </div>
        <div className="app-header-right">
          <button
            className="app-add-btn"
            onClick={() => handleAddTask()}
            aria-label="Add new task"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New task</span>
          </button>
          <button
            className="app-settings-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.2 12.2a1.3 1.3 0 00.26 1.43l.05.05a1.58 1.58 0 11-2.23 2.23l-.05-.05a1.3 1.3 0 00-1.43-.26 1.3 1.3 0 00-.79 1.19v.14a1.58 1.58 0 01-3.16 0v-.07a1.3 1.3 0 00-.85-1.19 1.3 1.3 0 00-1.43.26l-.05.05a1.58 1.58 0 11-2.23-2.23l.05-.05a1.3 1.3 0 00.26-1.43 1.3 1.3 0 00-1.19-.79h-.14a1.58 1.58 0 010-3.16h.07a1.3 1.3 0 001.19-.85 1.3 1.3 0 00-.26-1.43l-.05-.05A1.58 1.58 0 116.45 3.7l.05.05a1.3 1.3 0 001.43.26h.06a1.3 1.3 0 00.79-1.19v-.14a1.58 1.58 0 013.16 0v.07a1.3 1.3 0 00.79 1.19 1.3 1.3 0 001.43-.26l.05-.05a1.58 1.58 0 112.23 2.23l-.05.05a1.3 1.3 0 00-.26 1.43v.06a1.3 1.3 0 001.19.79h.14a1.58 1.58 0 010 3.16h-.07a1.3 1.3 0 00-1.19.79z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Calendar controls */}
      <CalendarHeader />

      {/* Category filter */}
      <CategoryFilter onManageCategories={() => setShowCategoryManager(true)} />

      {/* Calendar view */}
      <main className="app-main">
        {calendarContent}
      </main>

      {/* Storage error toast */}
      {state.storageError && (
        <div className="app-toast app-toast-error" role="alert">
          <p>{state.storageError}</p>
          <button onClick={() => dispatch({ type: 'STORAGE_ERROR', message: '' })}>
            Dismiss
          </button>
        </div>
      )}

      {/* Modals */}
      {viewingDayNum !== undefined && (
        <DayViewModal
          dayNum={viewingDayNum}
          tasks={filteredTasks}
          categories={state.categories}
          onClose={() => setViewingDayNum(undefined)}
          onEditTask={handleEditTask}
          onAddTaskForDate={handleAddTask}
          dispatch={dispatch}
        />
      )}
      {showTaskForm && (
        <TaskFormModal
          editTask={editingTask}
          defaultDate={addingForDate}
          onClose={handleCloseTaskForm}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}
    </div>
  );
}
