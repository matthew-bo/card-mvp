import { Monitor } from './monitor';
import * as Sentry from "@sentry/nextjs";

interface PerformanceMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class PerformanceMonitor {
    static trackLoadTime(componentName: string, duration: number) {
      const metric = {
        name: 'load_time',
        duration,
        component: componentName,
        timestamp: new Date()
      };
      
      // Log to Sentry
      Sentry.captureMessage('Performance Metric', {
        level: 'info',
        extra: metric
      });
    }
  
    static trackApiCall(endpoint: string, duration: number) {
      const metric = {
        name: 'api_latency',
        duration,
        endpoint,
        timestamp: new Date()
      };
      
      Sentry.captureMessage('API Performance', {
        level: 'info',
        extra: metric
      });
    }
  
    static trackOperation(operation: string, startTime: number) {
      const duration = performance.now() - startTime;
      const metric = {
        name: 'operation_duration',
        duration,
        operation,
        timestamp: new Date()
      };
      
      Sentry.captureMessage('Operation Performance', {
        level: 'info',
        extra: metric
      });
    }
  }

export function trackPerformance() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const duration = performance.now() - start;
        await Monitor.trackPerformance(propertyKey, duration);
      }
    };

    return descriptor;
  };
}