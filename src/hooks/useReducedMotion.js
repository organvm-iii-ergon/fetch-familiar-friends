import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing reduced motion preferences
 * Respects system preferences and allows manual override
 * Important for WCAG accessibility compliance
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check localStorage for manual override first
    const savedPreference = localStorage.getItem('dogtale-reduced-motion');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }

    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    return false;
  });

  // Track whether the user has manually overridden the preference
  const [isManualOverride, setIsManualOverride] = useState(() => {
    return localStorage.getItem('dogtale-reduced-motion') !== null;
  });

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e) => {
      // Only update if user hasn't set a manual preference
      if (!isManualOverride) {
        setPrefersReducedMotion(e.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [isManualOverride]);

  // Update document attribute for CSS fallback
  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [prefersReducedMotion]);

  /**
   * Enable reduced motion (manual override)
   */
  const enableReducedMotion = useCallback(() => {
    setPrefersReducedMotion(true);
    setIsManualOverride(true);
    localStorage.setItem('dogtale-reduced-motion', 'true');
  }, []);

  /**
   * Disable reduced motion (manual override)
   */
  const disableReducedMotion = useCallback(() => {
    setPrefersReducedMotion(false);
    setIsManualOverride(true);
    localStorage.setItem('dogtale-reduced-motion', 'false');
  }, []);

  /**
   * Toggle reduced motion preference
   */
  const toggleReducedMotion = useCallback(() => {
    setPrefersReducedMotion(prev => {
      const newValue = !prev;
      setIsManualOverride(true);
      localStorage.setItem('dogtale-reduced-motion', newValue.toString());
      return newValue;
    });
  }, []);

  /**
   * Reset to system preference
   */
  const resetToSystemPreference = useCallback(() => {
    localStorage.removeItem('dogtale-reduced-motion');
    setIsManualOverride(false);

    if (typeof window !== 'undefined' && window.matchMedia) {
      setPrefersReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } else {
      setPrefersReducedMotion(false);
    }
  }, []);

  /**
   * Get animation duration multiplier
   * Returns 0 for reduced motion, 1 for normal
   */
  const getAnimationMultiplier = useCallback(() => {
    return prefersReducedMotion ? 0 : 1;
  }, [prefersReducedMotion]);

  /**
   * Get Framer Motion animation props
   * Returns reduced/disabled animations when reduced motion is preferred
   * @param {Object} normalProps - The normal animation props
   * @returns {Object} Animation props adjusted for motion preference
   */
  const getMotionProps = useCallback((normalProps = {}) => {
    if (!prefersReducedMotion) {
      return normalProps;
    }

    // Return static props when reduced motion is preferred
    return {
      initial: normalProps.animate || normalProps.initial || {},
      animate: normalProps.animate || normalProps.initial || {},
      exit: normalProps.animate || normalProps.initial || {},
      transition: { duration: 0 },
    };
  }, [prefersReducedMotion]);

  /**
   * Wrapper for transition configuration
   * Returns instant transitions when reduced motion is preferred
   * @param {Object} transition - Normal transition config
   * @returns {Object} Adjusted transition config
   */
  const getTransition = useCallback((transition = {}) => {
    if (!prefersReducedMotion) {
      return transition;
    }

    return {
      ...transition,
      duration: 0,
      delay: 0,
    };
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    isManualOverride,
    enableReducedMotion,
    disableReducedMotion,
    toggleReducedMotion,
    resetToSystemPreference,
    getAnimationMultiplier,
    getMotionProps,
    getTransition,
  };
};

export default useReducedMotion;
