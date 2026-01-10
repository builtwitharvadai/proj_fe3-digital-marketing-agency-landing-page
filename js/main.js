/**
 * Main JavaScript Module
 * 
 * Production-grade initialization and core functionality for Digital Marketing Agency Landing Page.
 * Implements progressive enhancement, accessibility features, and performance optimization.
 * 
 * @module main
 * @version 1.0.0
 * @generated-from task-id:TASK-001 sprint:foundation
 * @modifies index.html:v1.0.0
 */

(function() {
  'use strict';

  // ============================================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================================

  const CONFIG = Object.freeze({
    DEBUG: false,
    SCROLL_OFFSET: 80,
    DEBOUNCE_DELAY: 150,
    ANIMATION_DURATION: 300,
    MOBILE_BREAKPOINT: 768,
    FORM_SUBMIT_TIMEOUT: 10000,
  });

  const SELECTORS = Object.freeze({
    NAV_TOGGLE: '.nav-toggle',
    NAV_MENU: '#nav-menu',
    SKIP_LINK: '.skip-link',
    CONTACT_FORM: '#contact-form',
    FORM_STATUS: '#form-status',
    NAV_LINKS: '.nav-menu a[href^="#"]',
    HEADER: '.site-header',
  });

  const ARIA_STATES = Object.freeze({
    EXPANDED: 'aria-expanded',
    HIDDEN: 'aria-hidden',
    BUSY: 'aria-busy',
    INVALID: 'aria-invalid',
  });

  const LOG_LEVELS = Object.freeze({
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Structured logging with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  function log(level, message, context = {}) {
    if (!CONFIG.DEBUG && level === LOG_LEVELS.DEBUG) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    const logMethod = level === LOG_LEVELS.ERROR ? 'error' : 
                     level === LOG_LEVELS.WARN ? 'warn' : 'log';
    
    console[logMethod](`[${timestamp}] ${level}: ${message}`, context);
  }

  /**
   * Debounce function to limit execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Safe DOM query selector with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Found element or null
   */
  function safeQuerySelector(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'Query selector failed', { selector, error: error.message });
      return null;
    }
  }

  /**
   * Safe DOM query selector all with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {NodeList|Array} Found elements or empty array
   */
  function safeQuerySelectorAll(selector, context = document) {
    try {
      return context.querySelectorAll(selector);
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'Query selector all failed', { selector, error: error.message });
      return [];
    }
  }

  // ============================================================================
  // NAVIGATION FUNCTIONALITY
  // ============================================================================

  /**
   * Initialize mobile navigation toggle
   */
  function initMobileNavigation() {
    const navToggle = safeQuerySelector(SELECTORS.NAV_TOGGLE);
    const navMenu = safeQuerySelector(SELECTORS.NAV_MENU);

    if (!navToggle || !navMenu) {
      log(LOG_LEVELS.WARN, 'Navigation elements not found', { 
        hasToggle: !!navToggle, 
        hasMenu: !!navMenu 
      });
      return;
    }

    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute(ARIA_STATES.EXPANDED) === 'true';
      const newState = !isExpanded;

      navToggle.setAttribute(ARIA_STATES.EXPANDED, String(newState));
      navMenu.setAttribute(ARIA_STATES.HIDDEN, String(!newState));

      log(LOG_LEVELS.DEBUG, 'Navigation toggled', { expanded: newState });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInside = navToggle.contains(event.target) || navMenu.contains(event.target);
      const isExpanded = navToggle.getAttribute(ARIA_STATES.EXPANDED) === 'true';

      if (!isClickInside && isExpanded) {
        navToggle.setAttribute(ARIA_STATES.EXPANDED, 'false');
        navMenu.setAttribute(ARIA_STATES.HIDDEN, 'true');
        log(LOG_LEVELS.DEBUG, 'Navigation closed (outside click)');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        const isExpanded = navToggle.getAttribute(ARIA_STATES.EXPANDED) === 'true';
        if (isExpanded) {
          navToggle.setAttribute(ARIA_STATES.EXPANDED, 'false');
          navMenu.setAttribute(ARIA_STATES.HIDDEN, 'true');
          navToggle.focus();
          log(LOG_LEVELS.DEBUG, 'Navigation closed (escape key)');
        }
      }
    });

    log(LOG_LEVELS.INFO, 'Mobile navigation initialized');
  }

  /**
   * Initialize smooth scrolling for anchor links
   */
  function initSmoothScrolling() {
    const navLinks = safeQuerySelectorAll(SELECTORS.NAV_LINKS);

    navLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        event.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = safeQuerySelector(targetId);

        if (!targetElement) {
          log(LOG_LEVELS.WARN, 'Scroll target not found', { targetId });
          return;
        }

        const headerHeight = safeQuerySelector(SELECTORS.HEADER)?.offsetHeight || 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - headerHeight - CONFIG.SCROLL_OFFSET;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu after navigation
        const navToggle = safeQuerySelector(SELECTORS.NAV_TOGGLE);
        const navMenu = safeQuerySelector(SELECTORS.NAV_MENU);
        if (navToggle && navMenu) {
          navToggle.setAttribute(ARIA_STATES.EXPANDED, 'false');
          navMenu.setAttribute(ARIA_STATES.HIDDEN, 'true');
        }

        // Update focus for accessibility
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();

        log(LOG_LEVELS.DEBUG, 'Smooth scroll executed', { targetId });
      });
    });

    log(LOG_LEVELS.INFO, 'Smooth scrolling initialized', { linkCount: navLinks.length });
  }

  // ============================================================================
  // FORM HANDLING
  // ============================================================================

  /**
   * Initialize contact form validation and submission
   */
  function initContactForm() {
    const form = safeQuerySelector(SELECTORS.CONTACT_FORM);
    const formStatus = safeQuerySelector(SELECTORS.FORM_STATUS);

    if (!form) {
      log(LOG_LEVELS.WARN, 'Contact form not found');
      return;
    }

    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      if (!submitButton) {
        log(LOG_LEVELS.ERROR, 'Submit button not found');
        return;
      }

      // Set loading state
      submitButton.setAttribute(ARIA_STATES.BUSY, 'true');
      submitButton.disabled = true;

      try {
        // Validate form
        const isValid = validateForm(form);
        if (!isValid) {
          throw new Error('Form validation failed');
        }

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        log(LOG_LEVELS.INFO, 'Form submission started', { 
          fields: Object.keys(data) 
        });

        // Simulate form submission (replace with actual API call)
        await simulateFormSubmission(data);

        // Show success message
        showFormStatus('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
        form.reset();

        log(LOG_LEVELS.INFO, 'Form submitted successfully');

      } catch (error) {
        log(LOG_LEVELS.ERROR, 'Form submission failed', { 
          error: error.message 
        });
        showFormStatus('error', 'Sorry, there was an error sending your message. Please try again later.');
      } finally {
        // Reset loading state
        submitButton.setAttribute(ARIA_STATES.BUSY, 'false');
        submitButton.disabled = false;
      }
    });

    log(LOG_LEVELS.INFO, 'Contact form initialized');
  }

  /**
   * Validate form fields
   * @param {HTMLFormElement} form - Form element
   * @returns {boolean} Validation result
   */
  function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(function(field) {
      const errorElement = safeQuerySelector(`#${field.id}-error`);
      
      if (!field.value.trim()) {
        isValid = false;
        field.setAttribute(ARIA_STATES.INVALID, 'true');
        if (errorElement) {
          errorElement.textContent = 'This field is required';
        }
      } else {
        field.setAttribute(ARIA_STATES.INVALID, 'false');
        if (errorElement) {
          errorElement.textContent = '';
        }
      }
    });

    // Email validation
    const emailField = form.querySelector('#email');
    if (emailField && emailField.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        isValid = false;
        emailField.setAttribute(ARIA_STATES.INVALID, 'true');
        const errorElement = safeQuerySelector('#email-error');
        if (errorElement) {
          errorElement.textContent = 'Please enter a valid email address';
        }
      }
    }

    return isValid;
  }

  /**
   * Simulate form submission (replace with actual API call)
   * @param {Object} data - Form data
   * @returns {Promise<void>}
   */
  function simulateFormSubmission(data) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        // Simulate success (90% success rate for demo)
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Simulated network error'));
        }
      }, 1500);
    });
  }

  /**
   * Show form status message
   * @param {string} type - Status type ('success' or 'error')
   * @param {string} message - Status message
   */
  function showFormStatus(type, message) {
    const formStatus = safeQuerySelector(SELECTORS.FORM_STATUS);
    if (!formStatus) {
      return;
    }

    formStatus.className = `form-status form-status--${type}`;
    formStatus.textContent = message;
    formStatus.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(function() {
      formStatus.style.display = 'none';
    }, 5000);
  }

  // ============================================================================
  // ACCESSIBILITY ENHANCEMENTS
  // ============================================================================

  /**
   * Initialize skip link functionality
   */
  function initSkipLink() {
    const skipLink = safeQuerySelector(SELECTORS.SKIP_LINK);
    if (!skipLink) {
      return;
    }

    skipLink.addEventListener('click', function(event) {
      event.preventDefault();
      const target = safeQuerySelector(this.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        log(LOG_LEVELS.DEBUG, 'Skip link activated');
      }
    });

    log(LOG_LEVELS.INFO, 'Skip link initialized');
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  /**
   * Log performance metrics
   */
  function logPerformanceMetrics() {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    window.addEventListener('load', function() {
      setTimeout(function() {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        log(LOG_LEVELS.INFO, 'Performance metrics', {
          loadTime: `${loadTime}ms`,
          domReady: `${domReady}ms`,
          timestamp: new Date().toISOString()
        });
      }, 0);
    });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize all functionality when DOM is ready
   */
  function init() {
    try {
      log(LOG_LEVELS.INFO, 'Initializing application', {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      });

      // Initialize core features
      initMobileNavigation();
      initSmoothScrolling();
      initContactForm();
      initSkipLink();
      logPerformanceMetrics();

      log(LOG_LEVELS.INFO, 'Application initialized successfully');

    } catch (error) {
      log(LOG_LEVELS.ERROR, 'Initialization failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  // ============================================================================
  // DOM READY
  // ============================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Log script loaded
  log(LOG_LEVELS.INFO, 'Main script loaded', {
    timestamp: new Date().toISOString()
  });

})();