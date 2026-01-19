import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const matchMediaMock = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

// Mock child components that might cause issues or are not relevant for this test
vi.mock('./components/calendar/CalendarCard', () => ({
  default: () => <div data-testid="calendar-card">CalendarCard</div>,
}));
vi.mock('./components/calendar/MonthCalendar', () => ({
  default: () => <div data-testid="month-calendar">MonthCalendar</div>,
}));
vi.mock('./components/VisualLanding', () => ({
  default: () => <div data-testid="visual-landing">VisualLanding</div>,
}));

describe('App Component - Reduced Motion', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();

    // Default matchMedia mock (no reduced motion preference)
    matchMediaMock.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('should enable animations by default when prefers-reduced-motion is false', () => {
    matchMediaMock.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // We can't easily check the internal state of App directly without rendering and interacting.
    // However, App saves settings to localStorage on mount/update.
    // We can check what was saved to localStorage.

    render(<App />);

    // Check if localStorage was set with animationsEnabled: true
    // App saves to localStorage in useEffect on mount or when settings change
    // We expect the default state to be saved if nothing was in localStorage

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dogtale-settings',
        expect.stringContaining('"animationsEnabled":true')
    );
  });

  it('should disable animations by default when prefers-reduced-motion is true', () => {
    matchMediaMock.mockImplementation(query => {
      return {
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    render(<App />);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dogtale-settings',
        expect.stringContaining('"animationsEnabled":false')
    );
  });

  it('should respect saved settings over OS preference', () => {
    // User prefers reduced motion at OS level
    matchMediaMock.mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    // But user has explicitly enabled animations in app settings
    localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'dogtale-settings') {
            return JSON.stringify({ animationsEnabled: true });
        }
        return null;
    });

    render(<App />);

    // Since useEffect loads settings and overwrites state, we need to wait for that?
    // Actually the initial state will be false (due to matchMedia), then useEffect runs and sets it to true (from localStorage).
    // Then useEffect for saving settings runs again with true.

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dogtale-settings',
        expect.stringContaining('"animationsEnabled":true')
    );
  });
});
