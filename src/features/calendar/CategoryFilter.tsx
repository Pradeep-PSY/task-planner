/**
 * CategoryFilter — horizontal row of category chips for filtering.
 */

import React from 'react';
import { useStore } from '../../store';
import './CategoryFilter.css';

interface CategoryFilterProps {
  onManageCategories?: () => void;
}

export function CategoryFilter({ onManageCategories }: CategoryFilterProps) {
  const { state, dispatch } = useStore();
  const { categories, categoryFilter } = state;

  const allSelected = categoryFilter === null;

  function handleAllClick() {
    dispatch({ type: 'SET_CATEGORY_FILTER', filter: null });
  }

  function handleCategoryClick(id: number) {
    if (categoryFilter === null) {
      // Switch from "all" to just this one
      dispatch({ type: 'SET_CATEGORY_FILTER', filter: new Set([id]) });
    } else if (categoryFilter.has(id)) {
      // Deselect this one
      const next = new Set(categoryFilter);
      next.delete(id);
      // If none left, go back to all
      dispatch({ type: 'SET_CATEGORY_FILTER', filter: next.size === 0 ? null : next });
    } else {
      const next = new Set(categoryFilter);
      next.add(id);
      // If all are selected, go back to null (= all)
      if (next.size === categories.length) {
        dispatch({ type: 'SET_CATEGORY_FILTER', filter: null });
      } else {
        dispatch({ type: 'SET_CATEGORY_FILTER', filter: next });
      }
    }
  }

  return (
    <div className="cat-filter-container">
      <div className="cat-filter" role="group" aria-label="Filter by category">
        <button
          className={`cat-filter__chip ${allSelected ? 'cat-filter__chip--active' : ''}`}
          onClick={handleAllClick}
          aria-pressed={allSelected}
        >
          <span className="cat-filter__dot cat-filter__dot--all" />
          All
        </button>

        {categories.map((cat) => {
          const isSelected = categoryFilter === null || categoryFilter.has(cat.id);
          return (
            <button
              key={cat.id}
              className={`cat-filter__chip ${isSelected ? 'cat-filter__chip--active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
              aria-pressed={isSelected}
            >
              <span className="cat-filter__dot" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </button>
          );
        })}
      </div>
      {onManageCategories && (
        <button className="cat-manage-btn" onClick={onManageCategories}>
          Manage categories
        </button>
      )}
    </div>
  );
}
