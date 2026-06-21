import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

const TestComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-status">{isDark ? 'dark' : 'light'}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('provides default light theme if no localStorage value', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme and updates localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const button = screen.getByText('Toggle Theme');
    
    // Toggle to dark
    await userEvent.click(button);
    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(localStorage.getItem('ecoloop-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Toggle back to light
    await userEvent.click(button);
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(localStorage.getItem('ecoloop-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initializes with dark theme if stored in localStorage', () => {
    localStorage.setItem('ecoloop-theme', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
