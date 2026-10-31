import { describe, it, expect } from 'vitest';
import { serializeData, deserializeData, measureStorage } from '../storage';
import type { AppData, Task, Category } from '../types';

describe('Storage compression round trip', () => {
  it('should round-trip simple data correctly', () => {
    const data: AppData = {
      categories: [
        { id: 1, name: 'Work', color: 'var(--cat-blue)' },
      ],
      tasks: [
        {
          id: '123',
          title: 'Test task 🚀',
          notes: 'Some notes with unicode: üñîçødê',
          categoryId: 1,
          done: false,
          startDay: 20000,
          endDay: 20005,
          priority: 2,
          subtasks: [
            { title: 'Sub 1', done: true, day: 20000 },
          ],
        },
      ],
    };

    const compressed = serializeData(data);
    const restored = deserializeData(compressed);

    expect(restored).toEqual(data);
  });

  it('should handle 1,000+ tasks efficiently', () => {
    const categories: Category[] = [
      { id: 1, name: 'Work', color: 'var(--cat-blue)' },
    ];
    const tasks: Task[] = [];
    for (let i = 0; i < 1200; i++) {
      tasks.push({
        id: `task-${i}`,
        title: `Task number ${i} with unicode 🌟 测试`,
        notes: `Notes for task ${i}`,
        categoryId: 1,
        done: i % 2 === 0,
        startDay: 20000 + (i % 30),
        endDay: 20000 + (i % 30) + 2,
        priority: (i % 3) as any,
        subtasks: [
          { title: `Subtask A for ${i}`, done: false, day: 20000 },
          { title: `Subtask B for ${i}`, done: true, day: 20001 },
        ],
      });
    }

    const data: AppData = { categories, tasks };
    const compressed = serializeData(data);
    const { compressed: compBytes, uncompressed: uncompBytes } = measureStorage(data);

    expect(compBytes).toBeLessThan(uncompBytes);

    const restored = deserializeData(compressed);
    expect(restored.tasks.length).toBe(1200);
    expect(restored.tasks[500].title).toBe('Task number 500 with unicode 🌟 测试');
  });
});
