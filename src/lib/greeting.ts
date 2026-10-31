/**
 * Greeting helper — returns the greeting string based on the current hour.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(hour?: number): TimeOfDay {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function getGreeting(name: string, hour?: number): string {
  const tod = getTimeOfDay(hour);
  const labels: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Hello',
  };
  return `${labels[tod]}, ${name}`;
}

/**
 * Build the helper text under the greeting.
 * Returns a string like "You have 4 pending tasks" or "You're all caught up."
 */
export function getHelperText(
  totalTasks: number,
  pendingTasks: number,
  pendingSubtasks: number
): string {
  if (totalTasks === 0) {
    return 'Plan your first task.';
  }
  if (pendingTasks === 0 && pendingSubtasks === 0) {
    return "You're all caught up.";
  }

  const parts: string[] = [];

  if (pendingTasks > 0) {
    parts.push(`You have ${pendingTasks} pending ${pendingTasks === 1 ? 'task' : 'tasks'}`);
  }

  if (pendingSubtasks > 0) {
    const sub = `${pendingSubtasks} ${pendingSubtasks === 1 ? 'sub-task' : 'sub-tasks'} pending across your main tasks`;
    if (parts.length > 0) {
      parts.push(sub);
    } else {
      parts.push(`You have ${sub}`);
    }
  }

  return parts.join(' and ') + '.';
}
