export class SimpleMonitor {
    static logEvent(type: string, message: string, data?: Record<string, unknown>) {
      if (process.env.NODE_ENV === 'production') {
        // In production, we can add proper logging service later
        console.log({
          type,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      }
    }
  
    static trackError(error: Error) {
      if (process.env.NODE_ENV === 'production') {
        console.error({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    }
  
    static trackPerformance(operation: string, durationMs: number) {
      if (process.env.NODE_ENV === 'production') {
        console.log({
          operation,
          durationMs,
          timestamp: new Date().toISOString()
        });
      }
    }
  }