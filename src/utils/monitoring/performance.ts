import { Monitor } from './monitor';

export class PerformanceMonitor {
    static trackLoadTime(componentName: string, duration: number) {
      const metric = {
        name: 'load_time',
        duration,
        component: componentName,
        timestamp: new Date()
      };
      
      Monitor.logEvent('performance', `Component ${componentName} loaded in ${duration}ms`, 'info', metric);
    }
  
    static trackApiCall(endpoint: string, duration: number) {
      const metric = {
        name: 'api_latency',
        duration,
        endpoint,
        timestamp: new Date()
      };
      
      Monitor.logEvent('performance', `API ${endpoint} took ${duration}ms`, 'info', metric);
    }
  
    static trackOperation(operation: string, startTime: number) {
      const duration = performance.now() - startTime;
      const metric = {
        name: 'operation_duration',
        duration,
        operation,
        timestamp: new Date()
      };
      
      Monitor.logEvent('performance', `Operation ${operation} took ${duration}ms`, 'info', metric);
    }
}