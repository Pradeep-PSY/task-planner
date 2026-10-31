# Plan — Task Planner & To-Do Web App

**Plan** is a calm, warm, editorial, and trustworthy task planner web application built with React, TypeScript, and Vite. Designed with an aesthetic inspired by clean typography and warm neutral tones, it helps you plan your days, weeks, and months effortlessly without any backend complexity—everything is stored securely right in your browser.

---

## Features

- **Warm Editorial Visual Design**: Clean typography pairing *Newsreader* (serif headings) with *Inter* (sans-serif UI), warm off-white background (`#FAF9F5`), terracotta accents (`#C96442`), subtle shadows, and automatic dark mode support.
- **First-Time Experience & Time-Based Greeting**:
  - Welcomes first-time visitors with a clean prompt to save their name locally.
  - Dynamically greets you based on the local time of day (*Good morning / afternoon / evening / night, {name}*).
  - Live pending tasks and sub-tasks summary counter.
- **Tasks & Sub-tasks**:
  - Full CRUD for tasks with titles, notes, categories, start/end date ranges, and priority levels (Low, Normal, High).
  - Unlimited sub-tasks with completion checklists, date bounds, reordering, and auto-distribution across date ranges.
  - Progress tracking (`3/6` counts and thin progress bars).
- **Categories & Filtering**:
  - Default categories: *Work*, *Editing*, *Reading*, *Learning*, *Personal*, *Health*.
  - Category manager to add, rename, recolor (from an 8-color muted palette), and delete categories with task reassignment.
  - Interactive category filter chips.
- **Multiple Calendar Views**:
  - **Week View**: Gantt-style multi-day horizontal task bars on top and single-day cards/subtasks in daily columns.
  - **Month View**: 6×7 calendar grid with task indicator dots and day counters.
  - **Day View Modal**: Popup showing all tasks and subtasks scheduled for any clicked day.
  - **List View**: Clean tabular list of all tasks.
  - **Mobile Optimized**: Week view is hidden on mobile screens, defaulting cleanly to Month and List views.
- **Storage & Compression**:
  - Uses `lz-string` (`compressToUTF16`) to compress compact task data before saving to `localStorage`.
  - Settings modal showing storage statistics (compressed vs. uncompressed size in KB), JSON backup Export & Import, and data reset.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher recommended)
- npm or yarn

### Installation & Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/task-planner.git
   cd task-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## How to Use

1. **Onboarding**: Enter your name on your first visit to personalize your planner.
2. **Adding Tasks**: Click the **"+ New task"** button in the header or click any day in the calendar to open the task form. Set a title, category, priority, and date range. Add sub-tasks and use **"Plan across range"** to auto-distribute them.
3. **Viewing & Editing**:
   - Switch between **Week**, **Month**, and **List** views using the top calendar tabs.
   - Click any day in the calendar to open its **Day View** modal and see all tasks scheduled for that day.
   - Click any task to edit its details.
4. **Settings & Backup**: Click the settings gear icon in the top right to check your storage usage, export a JSON backup, import data, or switch preferences.
