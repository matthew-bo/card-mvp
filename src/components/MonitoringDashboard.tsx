'use client';

import { useEffect, useState } from 'react';

interface MetricData {
  responseTime: number[];
  errorRate: number;
  rateLimitBreaches: number;
  activeUsers: number;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricData>({
    responseTime: [],
    errorRate: 0,
    rateLimitBreaches: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    // In production, this would fetch from your monitoring service
    // For now, we'll use mock data
    setMetrics({
      responseTime: [/* response times */],
      errorRate: 0.01,
      rateLimitBreaches: 2,
      activeUsers: 10
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Response Time Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Response Time</h3>
        <p className="text-2xl">{metrics.responseTime[0]}ms</p>
      </div>

      {/* Error Rate Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Error Rate</h3>
        <p className="text-2xl">{(metrics.errorRate * 100).toFixed(2)}%</p>
      </div>

      {/* Rate Limit Breaches */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Rate Limit Breaches</h3>
        <p className="text-2xl">{metrics.rateLimitBreaches}</p>
      </div>

      {/* Active Users */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Active Users</h3>
        <p className="text-2xl">{metrics.activeUsers}</p>
      </div>
    </div>
  );
}