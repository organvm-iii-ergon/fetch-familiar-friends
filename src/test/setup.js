import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: (key) => {
    return localStorageMock[key] || null;
  },
  setItem: (key, value) => {
    localStorageMock[key] = value.toString();
  },
  removeItem: (key) => {
    delete localStorageMock[key];
  },
  clear: () => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key];
      }
    });
  }
};

global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Framer Motion props that should be filtered out before passing to DOM elements
const motionProps = [
  'initial',
  'animate',
  'exit',
  'variants',
  'transition',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragPropagation',
  'dragTransition',
  'onDragStart',
  'onDrag',
  'onDragEnd',
  'onAnimationStart',
  'onAnimationComplete',
  'onLayoutAnimationStart',
  'onLayoutAnimationComplete',
  'onViewportEnter',
  'onViewportLeave',
  'viewport',
  'transformTemplate',
  'custom',
  'inherit',
  'style',
];

/**
 * Filter out framer-motion specific props before passing to DOM elements
 */
const filterMotionProps = (props) => {
  const filtered = {};
  for (const key in props) {
    if (!motionProps.includes(key)) {
      filtered[key] = props[key];
    }
  }
  return filtered;
};

/**
 * Create a mock motion component that filters motion props
 */
const createMotionComponent = (tag) => {
  const MotionComponent = React.forwardRef((props, ref) => {
    const filteredProps = filterMotionProps(props);
    return React.createElement(tag, { ...filteredProps, ref }, props.children);
  });
  MotionComponent.displayName = `motion.${tag}`;
  return MotionComponent;
};

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');

  // Create mock motion components for common HTML elements
  const motion = new Proxy({}, {
    get: (_, tag) => createMotionComponent(tag),
  });

  return {
    ...actual,
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useInView: () => [null, true],
    useMotionValue: (initial) => ({
      get: () => initial,
      set: vi.fn(),
      onChange: vi.fn(),
    }),
    useSpring: (initial) => ({
      get: () => initial,
      set: vi.fn(),
    }),
    useTransform: (value, inputRange, outputRange) => ({
      get: () => outputRange?.[0] ?? 0,
      set: vi.fn(),
    }),
    useReducedMotion: () => false,
    LayoutGroup: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});
