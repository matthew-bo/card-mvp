type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

interface MonitoringEvent {
  type: string;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export class Monitor {
  private static async persistLog(event: MonitoringEvent) {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${event.level}] ${event.type}: ${event.message}`, event.data);
      return;
    }

    // Production logging
    try {
      await fetch('/api/logging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Logging failed:', error);
    }
  }

  static async logEvent(type: string, message: string, level: AlertLevel = 'info', data?: Record<string, unknown>) {
    await this.persistLog({
      type,
      level,
      message,
      timestamp: new Date(),
      data
    });
  }

  static async trackError(error: Error, context?: any) {
    await this.logEvent(
      'error',
      error.message,
      'error',
      {
        stack: error.stack,
        context
      }
    );
  }

  static async trackPerformance(operation: string, durationMs: number) {
    const level = durationMs > 1000 ? 'warning' : 'info';
    await this.logEvent(
      'performance',
      `Operation ${operation} took ${durationMs}ms`,
      level,
      { durationMs }
    );
  }

  static async trackSecurity(message: string, data?: Record<string, unknown>) {
    await this.logEvent('security', message, 'warning', data);
  }
}