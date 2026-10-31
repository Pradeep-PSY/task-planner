/**
 * WelcomeScreen — onboarding view shown when the user has not yet set a name.
 *
 * Centered full-screen layout with a serif headline, a single text input
 * for the user's name, and a "Continue" button.  Fades in on mount.
 */

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { useStore } from '../../store';
import './WelcomeScreen.css';

export default function WelcomeScreen() {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-focus the input on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = name.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    dispatch({ type: 'SET_NAME', name: trimmed });
  };

  return (
    <main className="welcome">
      <div className="welcome__card">
        <h1 className="welcome__headline">
          Welcome.
          <br />
          What should we call&nbsp;you?
        </h1>

        <form className="welcome__form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="welcome__input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            aria-label="Your name"
            maxLength={60}
          />

          <button
            className="welcome__button"
            type="submit"
            disabled={!trimmed}
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
