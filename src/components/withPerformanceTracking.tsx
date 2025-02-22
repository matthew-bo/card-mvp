import { useEffect } from 'react';
import { PerformanceMonitor } from '@/utils/monitoring/performance';

export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function WithPerformanceTracking(props: P) {
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const duration = performance.now() - startTime;
        PerformanceMonitor.trackLoadTime(componentName, duration);
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
}