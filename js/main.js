/**
 * Main JavaScript Entry Point
 * Initializes all interactive features and coordinates module lifecycle
 * @module main
 */

import { isInteractiveFeaturesEnabled } from './utils.js';

/**
 * Application state
 */
const appState = {
  initialized: false,
  modules: new Map(),
  cleanupFunctions: []
};

/**
 * Initialize application
 * @returns {Promise<void>}
 */
async function initializeApp() {
  // Check if interactive features are enabled
  if (!isInteractiveFeaturesEnabled()) {
    console.info('Interactive features disabled via data-interactive attribute');
    return;
  }

  // Prevent double initialization
  if (appState.initialized) {
    console.warn('Application already initialized');
    return;
  }

  try {
    console.info('Initializing application...');

    // Mark as initialized early to prevent race conditions
    appState.initialized = true;

    // Initialize modules would go here when they are created
    // Example pattern for future module initialization:
    // const navigation = await import('./navigation.js');
    // appState.modules.set('navigation', navigation);
    // const cleanup = await navigation.init();
    // if (cleanup) appState.cleanupFunctions.push(cleanup);

    console.info('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    appState.initialized = false;
    
    // Attempt graceful degradation
    handleInitializationError(error);
  }
}

/**
 * Handle initialization errors with graceful degradation
 * @param {Error} error - Initialization error
 * @returns {void}
 */
function handleInitializationError(error) {
  // Log error details for debugging
  console.error('Initialization error details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Ensure basic functionality works without JavaScript enhancements
  // Forms will still submit, links will still work, etc.
  document.body.classList.add('js-error');
  
  // Optionally notify user of degraded experience
  const errorNotification = document.createElement('div');
  errorNotification.className = 'js-error-notification sr-only';
  errorNotification.setAttribute('role', 'alert');
  errorNotification.textContent = 'Some interactive features may not be available. Basic functionality is still working.';
  document.body.appendChild(errorNotification);
}

/**
 * Cleanup application resources
 * @returns {void}
 */
function cleanup() {
  console.info('Cleaning up application resources...');

  // Execute all cleanup functions
  appState.cleanupFunctions.forEach(cleanupFn => {
    try {
      cleanupFn();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  // Clear state
  appState.cleanupFunctions = [];
  appState.modules.clear();
  appState.initialized = false;

  console.info('Application cleanup complete');
}

/**
 * Handle DOM ready state
 * @returns {void}
 */
function handleDOMReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM already loaded
    initializeApp();
  }
}

/**
 * Handle page visibility changes
 * @returns {void}
 */
function handleVisibilityChange() {
  if (document.hidden) {
    console.info('Page hidden - pausing non-critical operations');
    // Future: pause animations, stop polling, etc.
  } else {
    console.info('Page visible - resuming operations');
    // Future: resume animations, restart polling, etc.
  }
}

/**
 * Handle page unload
 * @returns {void}
 */
function handleUnload() {
  cleanup();
}

/**
 * Setup global error boundary
 * @returns {void}
 */
function setupErrorBoundary() {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Prevent default browser error handling for better UX
    event.preventDefault();
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Prevent default browser error handling
    event.preventDefault();
  });
}

/**
 * Setup lifecycle event handlers
 * @returns {void}
 */
function setupLifecycleHandlers() {
  // Handle visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Handle page unload
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
}

/**
 * Bootstrap application
 * @returns {void}
 */
function bootstrap() {
  // Setup error boundary first
  setupErrorBoundary();

  // Setup lifecycle handlers
  setupLifecycleHandlers();

  // Initialize when DOM is ready
  handleDOMReady();
}

// Start application
bootstrap();

// Export for testing and external access
export { initializeApp, cleanup, appState };