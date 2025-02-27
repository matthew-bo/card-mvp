'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

interface MetricData {
  responseTime: number[];
  errorRate: number;
  rateLimitBreaches: number;
  activeUsers: number;
  lastDayEvents: { name: string; value: number }[];
  eventTimeline: { timestamp: string; events: number }[];
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricData>({
    responseTime: [],
    errorRate: 0,
    rateLimitBreaches: 0,
    activeUsers: 0,
    lastDayEvents: [],
    eventTimeline: [],
    resourceUsage: {
      cpu: 0,
      memory: 0,
      storage: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch metrics data from the API
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Make API request to your monitoring service
      const response = await fetch(`/api/monitoring/metrics?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update metrics with real data
      setMetrics({
        responseTime: data.responseTime || [],
        errorRate: data.errorRate || 0,
        rateLimitBreaches: data.rateLimitBreaches || 0,
        activeUsers: data.activeUsers || 0,
        lastDayEvents: data.events || [],
        eventTimeline: data.timeline || [],
        resourceUsage: {
          cpu: data.resourceUsage?.cpu || 0,
          memory: data.resourceUsage?.memory || 0,
          storage: data.resourceUsage?.storage || 0
        }
      });
      
      // Log successful metrics fetch
      SimpleMonitor.logEvent(
        'monitoring_metrics_fetched',
        'Successfully fetched monitoring metrics',
        { timeRange }
      );
    } catch (error) {
      console.error('Error fetching metrics:', error);
      SimpleMonitor.trackError(error as Error);
      
      // If the API fails, show a notification or handle the error appropriately
      // You could implement a fallback mechanism here if needed
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
    // Update metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusColor = (value: number, thresholds: {warning: number, critical: number}) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-amber-500';
    return 'text-emerald-600';
  };

  const latestResponseTime = metrics.responseTime.length > 0 
    ? metrics.responseTime[metrics.responseTime.length - 1] 
    : 0;
  
  const responseTimeColor = getStatusColor(latestResponseTime, {warning: 150, critical: 200});
  const errorRateColor = getStatusColor(metrics.errorRate * 100, {warning: 1, critical: 5});

  return (
    <div className="space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Response Time Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${responseTimeColor === 'text-emerald-600' ? 'bg-emerald-100' : responseTimeColor === 'text-amber-500' ? 'bg-amber-100' : 'bg-red-100'}`}>
              <span className={responseTimeColor}>
                {responseTimeColor === 'text-emerald-600' ? 'Good' : responseTimeColor === 'text-amber-500' ? 'Warning' : 'Critical'}
              </span>
            </span>
          </div>
          <p className={`text-2xl font-bold ${responseTimeColor}`}>
            {latestResponseTime}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">Average API response time</p>
        </div>

        {/* Error Rate Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${errorRateColor === 'text-emerald-600' ? 'bg-emerald-100' : errorRateColor === 'text-amber-500' ? 'bg-amber-100' : 'bg-red-100'}`}>
              <span className={errorRateColor}>
                {errorRateColor === 'text-emerald-600' ? 'Good' : errorRateColor === 'text-amber-500' ? 'Warning' : 'Critical'}
              </span>
            </span>
          </div>
          <p className={`text-2xl font-bold ${errorRateColor}`}>{(metrics.errorRate * 100).toFixed(2)}%</p>
          <p className="text-xs text-gray-500 mt-1">Percentage of failed requests</p>
        </div>

        {/* Rate Limit Breaches */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Rate Limit Breaches</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.rateLimitBreaches}</p>
          <p className="text-xs text-gray-500 mt-1">Attempts blocked in last hour</p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Users currently online</p>
        </div>
      </div>

      {/* Time range selector and refresh button */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            30 Days
          </button>
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-1"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Loading state for charts */}
      {loading && metrics.eventTimeline.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      ) : (
        <>
          {/* Event Timeline */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h3>
            {metrics.eventTimeline.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.eventTimeline}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} events`, 'Count']} />
                    <Legend />
                    <Line type="monotone" dataKey="events" stroke="#3B82F6" activeDot={{ r: 8 }} name="Events" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center">
                <p className="text-gray-500">No timeline data available</p>
              </div>
            )}
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events By Type */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Events By Type</h3>
              {metrics.lastDayEvents.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.lastDayEvents}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3B82F6" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-gray-500">No event data available</p>
                </div>
              )}
            </div>

            {/* System Resource Usage */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Resource Usage</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">CPU Usage</span>
                    <span className="text-gray-900 font-medium">{metrics.resourceUsage.cpu}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        metrics.resourceUsage.cpu > 80 ? 'bg-red-500' : 
                        metrics.resourceUsage.cpu > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${metrics.resourceUsage.cpu}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Memory Usage</span>
                    <span className="text-gray-900 font-medium">{metrics.resourceUsage.memory}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        metrics.resourceUsage.memory > 80 ? 'bg-red-500' : 
                        metrics.resourceUsage.memory > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${metrics.resourceUsage.memory}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Storage Usage</span>
                    <span className="text-gray-900 font-medium">{metrics.resourceUsage.storage}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        metrics.resourceUsage.storage > 80 ? 'bg-red-500' : 
                        metrics.resourceUsage.storage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${metrics.resourceUsage.storage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}