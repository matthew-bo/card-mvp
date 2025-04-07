/**
 * A simple monitoring utility for tracking events and errors
 */
export class SimpleMonitor {
  /**
   * Log an event with a message and optional data
   */
  static logEvent(eventName: string, message: string, data?: Record<string, any>): void {
    console.log(`[Event] ${eventName}: ${message}`, data || '');
    
    // In a real app, you might send this to a monitoring service
    // For now, we'll just log to console
  }
  
  /**
   * Track an error that occurred in the application
   */
  static trackError(error: Error, context?: Record<string, any>): void {
    console.error(`[Error] ${error.message}`, {
      stack: error.stack,
      ...context
    });
    
    // In a real app, you might send this to an error tracking service
    // For now, we'll just log to console
  }
  
  /**
   * Start timing an operation for performance monitoring
   */
  static startTimer(operationName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Timer] ${operationName}: ${duration.toFixed(2)}ms`);
    };
  }
}