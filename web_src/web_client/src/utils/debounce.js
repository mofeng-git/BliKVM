/**
 * Debouncing utilities for performance optimization
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Execute on the leading edge
 * @param {boolean} options.trailing - Execute on the trailing edge
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options;

  let timeoutId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let result;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any trailing edge timeout
    lastInvokeTime = time;
    // Start the timer for the trailing edge
    timeoutId = setTimeout(timerExpired, wait);
    // Invoke the function if leading edge is enabled
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the trailing
    // edge, the system time has gone backwards and we're treating it as the
    // trailing edge, or we've hit the `maxWait` limit.
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeoutId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== undefined;
  }

  let lastArgs;
  let lastThis;

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Execute on the leading edge
 * @param {boolean} options.trailing - Execute on the trailing edge
 * @returns {Function} The throttled function
 */
export function throttle(func, wait = 300, options = {}) {
  const { leading = true, trailing = true } = options;
  return debounce(func, wait, { leading, trailing, maxWait: wait });
}

/**
 * Utility for debouncing input validation
 * @param {Function} validationFn - The validation function
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced validation function
 */
export function debounceValidation(validationFn, delay = 300) {
  return debounce(validationFn, delay, { leading: false, trailing: true });
}

/**
 * Utility for debouncing search operations
 * @param {Function} searchFn - The search function
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {Function} Debounced search function
 */
export function debounceSearch(searchFn, delay = 500) {
  return debounce(searchFn, delay, { leading: false, trailing: true });
}

/**
 * Utility for debouncing API calls
 * @param {Function} apiFn - The API function
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {Function} Debounced API function
 */
export function debounceApiCall(apiFn, delay = 1000) {
  return debounce(apiFn, delay, { leading: false, trailing: true });
}

/**
 * Utility for throttling scroll events
 * @param {Function} scrollFn - The scroll handler function
 * @param {number} delay - Delay in milliseconds (default: 100)
 * @returns {Function} Throttled scroll function
 */
export function throttleScroll(scrollFn, delay = 100) {
  return throttle(scrollFn, delay, { leading: true, trailing: true });
}

/**
 * Utility for throttling resize events
 * @param {Function} resizeFn - The resize handler function
 * @param {number} delay - Delay in milliseconds (default: 250)
 * @returns {Function} Throttled resize function
 */
export function throttleResize(resizeFn, delay = 250) {
  return throttle(resizeFn, delay, { leading: true, trailing: true });
}
