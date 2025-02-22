import { SimpleMonitor } from './simpleMonitor';

interface MonitoringEvent {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export class MonitoringService {
  static async logEvent(event: MonitoringEvent) {
    SimpleMonitor.logEvent(event.type, event.message, event.metadata);
  }

  static async trackError(error: Error) {
    SimpleMonitor.trackError(error);
  }

  static async trackPerformance(operation: string, durationMs: number) {
    SimpleMonitor.trackPerformance(operation, durationMs);
  }
}