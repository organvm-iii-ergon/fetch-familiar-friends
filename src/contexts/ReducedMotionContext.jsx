import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from '../hooks/useReducedMotion';

const ReducedMotionContext = createContext(null);

/**
 * Provider component for reduced motion accessibility preferences
 * Wraps the app to provide global access to motion preferences
 */
export function ReducedMotionProvider({ children }) {
  const reducedMotionState = useReducedMotion();

  return (
    <ReducedMotionContext.Provider value={reducedMotionState}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

ReducedMotionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access reduced motion context
 * Throws error if used outside of ReducedMotionProvider
 */
export function useReducedMotionContext() {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    throw new Error('useReducedMotionContext must be used within a ReducedMotionProvider');
  }
  return context;
}

/**
 * Safe hook that returns defaults if context is unavailable
 * Use this when the component might be rendered outside the provider
 */
export function useReducedMotionSafe() {
  const context = useContext(ReducedMotionContext);

  // Return defaults if not in provider
  if (!context) {
    return {
      prefersReducedMotion: false,
      isManualOverride: false,
      enableReducedMotion: () => {},
      disableReducedMotion: () => {},
      toggleReducedMotion: () => {},
      resetToSystemPreference: () => {},
      getAnimationMultiplier: () => 1,
      getMotionProps: (props) => props,
      getTransition: (transition) => transition,
    };
  }

  return context;
}

export default ReducedMotionContext;
