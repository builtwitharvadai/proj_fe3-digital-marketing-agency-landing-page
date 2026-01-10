/**
 * Utility Functions Module
 * Provides DOM manipulation, event handling, validation, and accessibility utilities
 * @module utils
 */

/**
 * DOM Query Utilities
 */

/**
 * Safely query a single element with error handling
 * @param {string} selector - CSS selector
 * @param {Element|Document} context - Context to query within
 * @returns {Element|null} Found element or null
 */
export function querySelector(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * Safely query multiple elements with error handling
 * @param {string} selector - CSS selector
 * @param {Element|Document} context - Context to query within
 * @returns {Element[]} Array of found elements
 */
export function querySelectorAll(selector, context = document) {
  try {
    return Array.from(context.querySelectorAll(selector));
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * Find closest ancestor matching selector
 * @param {Element} element - Starting element
 * @param {string} selector - CSS selector
 * @returns {Element|null} Closest matching ancestor or null
 */
export function closest(element, selector) {
  if (!element || !(element instanceof Element)) {
    return null;
  }
  
  try {
    return element.closest(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * Event Handling Utilities
 */

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout = null;
  
  return function debounced(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle = false;
  let lastResult;
  
  return function throttled(...args) {
    const context = this;
    
    if (!inThrottle) {
      lastResult = func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Add event listener with automatic cleanup
 * @param {Element|Window|Document} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object|boolean} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function addEventListenerWithCleanup(element, event, handler, options = false) {
  if (!element || typeof handler !== 'function') {
    console.error('Invalid element or handler for event listener');
    return () => {};
  }
  
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Smooth Scrolling Utilities
 */

/**
 * Calculate smooth scroll position with easing
 * @param {number} start - Start position
 * @param {number} end - End position
 * @param {number} progress - Progress (0-1)
 * @returns {number} Calculated position
 */
export function easeInOutCubic(start, end, progress) {
  const distance = end - start;
  const easedProgress = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  
  return start + distance * easedProgress;
}

/**
 * Smooth scroll to element or position
 * @param {Element|number} target - Target element or Y position
 * @param {Object} options - Scroll options
 * @param {number} options.duration - Animation duration in ms
 * @param {number} options.offset - Offset from target
 * @param {Function} options.callback - Completion callback
 * @returns {void}
 */
export function smoothScrollTo(target, options = {}) {
  const {
    duration = 800,
    offset = 0,
    callback = null
  } = options;
  
  const startPosition = window.pageYOffset;
  const targetPosition = typeof target === 'number'
    ? target
    : target.getBoundingClientRect().top + startPosition;
  
  const distance = targetPosition - startPosition - offset;
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
    }
    
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const position = easeInOutCubic(startPosition, startPosition + distance, progress);
    window.scrollTo(0, position);
    
    if (progress < 1) {
      requestAnimationFrame(animation);
    } else if (typeof callback === 'function') {
      callback();
    }
  }
  
  requestAnimationFrame(animation);
}

/**
 * Get scroll offset for fixed header
 * @returns {number} Offset in pixels
 */
export function getScrollOffset() {
  const header = querySelector('.site-header');
  return header ? header.offsetHeight : 0;
}

/**
 * Form Validation Utilities
 */

/**
 * Validation rules
 */
const validationRules = {
  required: (value) => value.trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^[\d\s\-+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
  minLength: (value, min) => value.trim().length >= min,
  maxLength: (value, max) => value.trim().length <= max
};

/**
 * Validation error messages
 */
const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`
};

/**
 * Validate form field
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - Form field
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
 */
export function validateField(field, rules = {}) {
  const value = field.value;
  const errors = [];
  
  // Required validation
  if (rules.required && !validationRules.required(value)) {
    errors.push(validationMessages.required);
  }
  
  // Skip other validations if field is empty and not required
  if (!rules.required && value.trim().length === 0) {
    return { valid: true, errors: [] };
  }
  
  // Email validation
  if (rules.email && !validationRules.email(value)) {
    errors.push(validationMessages.email);
  }
  
  // Phone validation
  if (rules.phone && !validationRules.phone(value)) {
    errors.push(validationMessages.phone);
  }
  
  // Min length validation
  if (rules.minLength && !validationRules.minLength(value, rules.minLength)) {
    errors.push(validationMessages.minLength(rules.minLength));
  }
  
  // Max length validation
  if (rules.maxLength && !validationRules.maxLength(value, rules.maxLength)) {
    errors.push(validationMessages.maxLength(rules.maxLength));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field
 * @param {string} message - Error message
 * @returns {void}
 */
export function showFieldError(field, message) {
  if (!field) return;
  
  const errorId = field.getAttribute('aria-describedby');
  const errorElement = errorId ? document.getElementById(errorId) : null;
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('error');
}

/**
 * Clear field error
 * @param {HTMLElement} field - Form field
 * @returns {void}
 */
export function clearFieldError(field) {
  if (!field) return;
  
  const errorId = field.getAttribute('aria-describedby');
  const errorElement = errorId ? document.getElementById(errorId) : null;
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  field.setAttribute('aria-invalid', 'false');
  field.classList.remove('error');
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Accessibility Utilities
 */

/**
 * Trap focus within element
 * @param {Element} element - Container element
 * @returns {Function} Cleanup function
 */
export function trapFocus(element) {
  if (!element) return () => {};
  
  const focusableElements = querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    element
  );
  
  if (focusableElements.length === 0) return () => {};
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  function handleKeyDown(event) {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 * @returns {void}
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Set ARIA expanded state
 * @param {Element} trigger - Trigger element
 * @param {boolean} expanded - Expanded state
 * @returns {void}
 */
export function setAriaExpanded(trigger, expanded) {
  if (!trigger) return;
  trigger.setAttribute('aria-expanded', String(expanded));
}

/**
 * General Utilities
 */

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Threshold percentage (0-1)
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element, threshold = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
  
  if (threshold === 0) {
    return vertInView && horInView;
  }
  
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return (visibleArea / totalArea) >= threshold;
}

/**
 * Get element offset from document top
 * @param {Element} element - Target element
 * @returns {Object} Offset coordinates
 */
export function getElementOffset(element) {
  if (!element) {
    return { top: 0, left: 0 };
  }
  
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft
  };
}

/**
 * Check if feature is enabled
 * @returns {boolean} True if interactive features enabled
 */
export function isInteractiveFeaturesEnabled() {
  const body = document.body;
  return body.getAttribute('data-interactive') !== 'false';
}

/**
 * Create element with attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|Element|Element[]} children - Child content
 * @returns {Element} Created element
 */
export function createElement(tag, attributes = {}, children = null) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (children) {
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (child instanceof Element) {
          element.appendChild(child);
        }
      });
    } else if (children instanceof Element) {
      element.appendChild(children);
    }
  }
  
  return element;
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Promise that resolves after delay
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get CSS custom property value
 * @param {string} property - CSS property name
 * @param {Element} element - Element to get property from
 * @returns {string} Property value
 */
export function getCSSVariable(property, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(property).trim();
}

/**
 * Set CSS custom property value
 * @param {string} property - CSS property name
 * @param {string} value - Property value
 * @param {Element} element - Element to set property on
 * @returns {void}
 */
export function setCSSVariable(property, value, element = document.documentElement) {
  element.style.setProperty(property, value);
}