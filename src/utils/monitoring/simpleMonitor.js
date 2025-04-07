/**
 * A simple monitoring utility for tracking events and errors
 */
export class SimpleMonitor {
  /**
   * Log an event with a message and optional data
   * @param {string} eventName - The name of the event
   * @param {string} message - A descriptive message
   * @param {Object} [data] - Optional data to log with the event
   */
  static logEvent(eventName, message, data) {
    console.log(`[Event] ${eventName}: ${message}`, data || '');
    
    // In a real app, you might send this to a monitoring service
    // For now, we'll just log to console
  }
  
  /**
   * Track an error that occurred in the application
   * @param {Error} error - The error object
   * @param {Object} [context] - Optional context about where the error occurred
   */
  static trackError(error, context) {
    console.error(`[Error] ${error.message}`, {
      stack: error.stack,
      ...context
    });
    
    // In a real app, you might send this to an error tracking service
    // For now, we'll just log to console
  }
  
  /**
   * Start timing an operation for performance monitoring
   * @param {string} operationName - The name of the operation to time
   * @returns {Function} A function to call when the operation is complete
   */
  static startTimer(operationName) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Timer] ${operationName}: ${duration.toFixed(2)}ms`);
    };
  }
} 