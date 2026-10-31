import { describe, it, expect } from 'vitest';
import { getGreeting, getHelperText, getTimeOfDay } from '../greeting';

describe('Greeting and helper logic', () => {
  it('should return correct time of day and greeting', () => {
    expect(getTimeOfDay(8)).toBe('morning');
    expect(getTimeOfDay(14)).toBe('afternoon');
    expect(getTimeOfDay(19)).toBe('evening');
    expect(getTimeOfDay(23)).toBe('night');

    expect(getGreeting('Alice', 9)).toBe('Good morning, Alice');
    expect(getGreeting('Bob', 15)).toBe('Good afternoon, Bob');
  });

  it('should return correct helper text', () => {
    expect(getHelperText(0, 0, 0)).toBe('Plan your first task.');
    expect(getHelperText(5, 0, 0)).toBe("You're all caught up.");
    expect(getHelperText(5, 3, 0)).toBe('You have 3 pending tasks.');
    expect(getHelperText(5, 0, 2)).toBe('You have 2 sub-tasks pending across your main tasks.');
    expect(getHelperText(5, 3, 2)).toBe(
      'You have 3 pending tasks and 2 sub-tasks pending across your main tasks.'
    );
  });
});
