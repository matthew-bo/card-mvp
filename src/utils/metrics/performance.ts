import { MetricsCollector } from './collector';

export class PerformanceMetrics {
  static async recordResponseTime(route: string, duration: number) {
    await MetricsCollector.recordMetric({
      name: 'response_time',
      value: duration,
      timestamp: new Date(),
      metadata: { route }
    });
  }

  static async recordApiLatency(endpoint: string, duration: number) {
    await MetricsCollector.recordMetric({
      name: 'api_latency',
      value: duration,
      timestamp: new Date(),
      metadata: { endpoint }
    });
  }
}