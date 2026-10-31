/**
 * CategoryManager — modal for managing task categories.
 *
 * Features:
 *  - List of all categories with name, colour swatch (8 muted colours from CATEGORY_COLORS)
 *  - Edit name inline with blur/Enter to save
 *  - Colour picker: 8 muted circles
 *  - Add new category button
 *  - Delete category: if category has tasks, shows a dropdown to reassign tasks before deletion
 *  - Prevent duplicate names (case-insensitive)
 *  - ARIA role="dialog", aria-modal, Esc to close
 */

import React, { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { useStore } from '../../store';
import { CATEGORY_COLORS } from '../../lib/storage';
import type { Category } from '../../lib/types';
import ConfirmDialog from '../../components/ConfirmDialog';
import './CategoryManager.css';

export interface CategoryManagerProps {
  onClose: () => void;
}

export default function CategoryManager({ onClose }: CategoryManagerProps) {
  const { state, dispatch } = useStore();
  const { categories, tasks } = state;

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* Delete & Reassign state */
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<number>(() => {
    // Default to first other category if available
    const other = categories.find((c) => c.id !== categoryToDelete?.id);
    return other ? other.id : 1;
  });

  const inputRef = useRef<HTMLInputElement>(null);

  /* Esc to close */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (categoryToDelete) {
          setCategoryToDelete(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, categoryToDelete]);

  /* Handle backdrop click */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /* Add category */
  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    // Check duplicate case-insensitive
    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setErrorMsg('A category with this name already exists.');
      return;
    }

    setErrorMsg(null);
    const maxId = categories.reduce((m, c) => Math.max(m, c.id), 0);
    const newCategory: Category = {
      id: maxId + 1,
      name: trimmed,
      color: newCategoryColor,
    };

    dispatch({ type: 'ADD_CATEGORY', category: newCategory });
    setNewCategoryName('');
    // Pick next colour in rotation
    const nextColorIndex = (categories.length + 1) % CATEGORY_COLORS.length;
    setNewCategoryColor(CATEGORY_COLORS[nextColorIndex]);
  };

  /* Start inline editing */
  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setErrorMsg(null);
  };

  /* Save inline edit */
  const handleSaveEdit = (cat: Category) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    // Check duplicate (excluding self)
    const exists = categories.some(
      (c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMsg('A category with this name already exists.');
      return;
    }

    setErrorMsg(null);
    dispatch({
      type: 'UPDATE_CATEGORY',
      category: { ...cat, name: trimmed },
    });
    setEditingId(null);
  };

  /* Change category colour */
  const handleColorChange = (cat: Category, color: string) => {
    dispatch({
      type: 'UPDATE_CATEGORY',
      category: { ...cat, color },
    });
  };

  /* Initiate delete */
  const handleRequestDelete = (cat: Category) => {
    // Cannot delete if it's the last category
    if (categories.length <= 1) {
      setErrorMsg('You must have at least one category.');
      return;
    }
    setErrorMsg(null);
    setCategoryToDelete(cat);
    // Set default reassign target to first available other category
    const other = categories.find((c) => c.id !== cat.id);
    if (other) setReassignTargetId(other.id);
  };

  /* Confirm delete with reassign */
  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    dispatch({
      type: 'DELETE_CATEGORY',
      categoryId: categoryToDelete.id,
      reassignTo: reassignTargetId,
    });
    setCategoryToDelete(null);
  };

  /* Count tasks in category */
  const getTaskCount = (catId: number) => {
    return tasks.filter((t) => t.categoryId === catId).length;
  };

  return (
    <div className="cat-backdrop" onClick={handleBackdropClick}>
      <div className="cat-modal" role="dialog" aria-modal="true" aria-label="Manage Categories">
        <div className="cat-modal__header">
          <h2 className="cat-modal__title">Manage Categories</h2>
          <button
            className="cat-modal__close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div className="cat-modal__error" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Category list */}
        <div className="cat-list">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;
            const taskCount = getTaskCount(cat.id);

            return (
              <div key={cat.id} className="cat-item">
                {/* Colour swatch / picker */}
                <div className="cat-item__swatch-picker">
                  <span
                    className="cat-item__current-swatch"
                    style={{ background: cat.color }}
                    title="Current colour"
                  />
                  <div className="cat-item__color-dropdown" role="group" aria-label="Select colour">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`cat-item__color-dot${
                          cat.color === color ? ' cat-item__color-dot--active' : ''
                        }`}
                        style={{ background: color }}
                        onClick={() => handleColorChange(cat, color)}
                        aria-label={`Set colour ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Name / Inline editor */}
                <div className="cat-item__content">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      className="cat-item__input"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveEdit(cat)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(cat);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      maxLength={40}
                    />
                  ) : (
                    <button
                      type="button"
                      className="cat-item__name-btn"
                      onClick={() => handleStartEdit(cat)}
                      title="Click to rename"
                    >
                      {cat.name}
                    </button>
                  )}
                  <span className="cat-item__count">
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="cat-item__delete-btn"
                  onClick={() => handleRequestDelete(cat)}
                  disabled={categories.length <= 1}
                  title={
                    categories.length <= 1 ? 'Cannot delete the only category' : 'Delete category'
                  }
                  aria-label={`Delete category ${cat.name}`}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>

        {/* Add new category form */}
        <form className="cat-add-form" onSubmit={handleAddCategory}>
          <div className="cat-add-form__row">
            <input
              className="cat-add-form__input"
              type="text"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              maxLength={40}
              aria-label="New category name"
            />
            <button
              className="cat-add-form__submit"
              type="submit"
              disabled={!newCategoryName.trim()}
            >
              Add Category
            </button>
          </div>

          {/* Colour picker for new category */}
          <div className="cat-add-form__colors" role="group" aria-label="Colour for new category">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`cat-item__color-dot${
                  newCategoryColor === color ? ' cat-item__color-dot--active' : ''
                }`}
                style={{ background: color }}
                onClick={() => setNewCategoryColor(color)}
                aria-label={`Select colour ${color}`}
              />
            ))}
          </div>
        </form>

        {/* Delete & Reassign confirmation dialog */}
        {categoryToDelete && (
          <ConfirmDialog
            title={`Delete "${categoryToDelete.name}"?`}
            message={
              getTaskCount(categoryToDelete.id) > 0
                ? `This category has ${getTaskCount(
                    categoryToDelete.id
                  )} task(s). Please choose where to reassign them before deletion:`
                : `Are you sure you want to delete this category?`
            }
            confirmLabel="Delete Category"
            danger
            onCancel={() => setCategoryToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}
