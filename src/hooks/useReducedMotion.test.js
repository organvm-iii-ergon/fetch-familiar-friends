import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let mockMatchMedia;
  let mockMediaQueryList;
  let mockAddEventListener;
  let mockRemoveEventListener;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Setup mock matchMedia
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    mockMediaQueryList = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    };
    mockMatchMedia = vi.fn().mockReturnValue(mockMediaQueryList);
    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect system preference for reduced motion', () => {
    mockMediaQueryList.matches = true;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.isManualOverride).toBe(false);
  });

  it('should default to false when system prefers normal motion', () => {
    mockMediaQueryList.matches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(false);
  });

  it('should respect localStorage override over system preference', () => {
    localStorage.setItem('dogtale-reduced-motion', 'true');
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.isManualOverride).toBe(true);
  });

  it('should enable reduced motion and save to localStorage', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.isManualOverride).toBe(true);
    expect(localStorage.getItem('dogtale-reduced-motion')).toBe('true');
  });

  it('should disable reduced motion and save to localStorage', () => {
    localStorage.setItem('dogtale-reduced-motion', 'true');
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.disableReducedMotion();
    });

    expect(result.current.prefersReducedMotion).toBe(false);
    expect(localStorage.getItem('dogtale-reduced-motion')).toBe('false');
  });

  it('should toggle reduced motion preference', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(false);

    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.prefersReducedMotion).toBe(true);

    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.prefersReducedMotion).toBe(false);
  });

  it('should reset to system preference', () => {
    localStorage.setItem('dogtale-reduced-motion', 'true');
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(true);

    act(() => {
      result.current.resetToSystemPreference();
    });

    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.isManualOverride).toBe(false);
    expect(localStorage.getItem('dogtale-reduced-motion')).toBeNull();
  });

  it('should return animation multiplier of 0 when reduced motion is enabled', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    expect(result.current.getAnimationMultiplier()).toBe(0);
  });

  it('should return animation multiplier of 1 when reduced motion is disabled', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.getAnimationMultiplier()).toBe(1);
  });

  it('should return modified motion props when reduced motion is preferred', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    const normalProps = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.5 },
    };

    const modifiedProps = result.current.getMotionProps(normalProps);

    expect(modifiedProps.transition.duration).toBe(0);
  });

  it('should return original motion props when normal motion is preferred', () => {
    const { result } = renderHook(() => useReducedMotion());

    const normalProps = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 },
    };

    const modifiedProps = result.current.getMotionProps(normalProps);

    expect(modifiedProps).toEqual(normalProps);
  });

  it('should return instant transition when reduced motion is preferred', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    const transition = result.current.getTransition({ duration: 0.3, delay: 0.1 });

    expect(transition.duration).toBe(0);
    expect(transition.delay).toBe(0);
  });

  it('should set data attribute on document when reduced motion is enabled', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('should remove data attribute when reduced motion is disabled', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      result.current.enableReducedMotion();
    });

    act(() => {
      result.current.disableReducedMotion();
    });

    expect(document.documentElement.getAttribute('data-reduced-motion')).toBeNull();
  });
});
