/**
 * Error Handler Utilities
 * ResizeObserver errors aur other UI errors ko suppress karta hai
 */

/**
 * ResizeObserver error ko suppress karta hai
 * Yeh error harmless hai aur UI functionality ko affect nahi karta
 */
export const suppressResizeObserverError = () => {
  // ResizeObserver loop error ko catch karo
  const resizeObserverErrorHandler = (event) => {
    if (event.message && event.message.includes('ResizeObserver')) {
      // Prevent error from showing in console
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
    return false;
  };

  // Window error event listener
  window.addEventListener('error', (e) => {
    if (resizeObserverErrorHandler(e)) {
      console.debug('ResizeObserver error suppressed (harmless UI error)');
    }
  });

  // Unhandled rejection handler
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver')) {
      e.preventDefault();
      console.debug('ResizeObserver rejection suppressed');
    }
  });
};

/**
 * Animation cleanup utility
 * Framer Motion aur GSAP animations ko properly cleanup karta hai
 */
export const cleanupAnimations = () => {
  // Cancel all pending animation frames
  let id = window.requestAnimationFrame(() => {});
  while (id--) {
    window.cancelAnimationFrame(id);
  }
};

/**
 * Debounce function for resize events
 * Performance improve karta hai
 */
export const debounce = (func, wait = 100) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Safe setState wrapper
 * Component unmount hone ke baad setState prevent karta hai
 */
export const useSafeState = (initialState) => {
  const [state, setState] = React.useState(initialState);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = React.useCallback((value) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
};

export default {
  suppressResizeObserverError,
  cleanupAnimations,
  debounce
};
