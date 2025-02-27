'use client';

import { useEffect, useState } from 'react';
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

const DEMO_DATA = {
  responseTime: [125, 150, 132, 148, 160, 175, 140],
  errorRate: 0.01,
  rateLimitBreaches: 2,
  activeUsers: 10,
  lastDayEvents: [
    { name: 'API Calls', value: 850 },
    { name: 'Card Recommendations', value: 320 },
    { name: 'User Logins', value: 75 },
    { name: 'New Signups', value: 12 },
    { name: 'Expenses Added', value: 230 }
  ],
  eventTimeline: [
    { timestamp: '00:00', events: 12 },
    { timestamp: '02:00', events: 8 },
    { timestamp: '04:00', events: 5 },
    { timestamp: '06:00', events: 10 },
    { timestamp: '08:00', events: 25 },
    { timestamp: '10:00', events: 45 },
    { timestamp: '12:00', events: 50 },
    { timestamp: '14:00', events: 60 },
    { timestamp: '16:00', events: 48 },
    { timestamp: '18:00', events: 35 },
    { timestamp: '20:00', events: 30 },
    { timestamp: '22:00', events: 18 }
  ],
  resourceUsage: {
    cpu: 35,
    memory: 48,
    storage: 22
  }
};

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricData>(DEMO_DATA);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchMetrics();
    // Update metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange, refreshKey]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from your monitoring service
      // For now, we'll use our demo data with minor variations
      setTimeout(() => {
        const variationFactor = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
        
        const newMetrics = {
          ...DEMO_DATA,
          responseTime: DEMO_DATA.responseTime.map(val => Math.round(val * variationFactor)),
          errorRate: DEMO_DATA.errorRate * variationFactor,
          activeUsers: Math.round(DEMO_DATA.activeUsers * variationFactor),
          rateLimitBreaches: Math.round(DEMO_DATA.rateLimitBreaches * variationFactor),
          lastDayEvents: DEMO_DATA.lastDayEvents.map(item => ({
            ...item,
            value: Math.round(item.value * variationFactor)
          })),
          eventTimeline: DEMO_DATA.eventTimeline.map(item => ({
            ...item,
            events: Math.round(item.events * variationFactor)
          })),
          resourceUsage: {
            cpu: Math.round(DEMO_DATA.resourceUsage.cpu * variationFactor),
            memory: Math.round(DEMO_DATA.resourceUsage.memory * variationFactor),
            storage: Math.round(DEMO_DATA.resourceUsage.storage * variationFactor)
          }
        };
        
        setMetrics(newMetrics);
        setLoading(false);
        
        // Log this monitoring refresh
        SimpleMonitor.logEvent(
          'monitoring_refresh',
          'Admin dashboard metrics refreshed',
          { timeRange }
        );
      }, 500); // Simulate network delay
    } catch (error) {
      console.error('Error fetching metrics:', error);
      SimpleMonitor.trackError(error as Error);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusColor = (value: number, thresholds: {warning: number, critical: number}) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-amber-500';
    return 'text-emerald-600';
  };

  const responseTimeColor = getStatusColor(metrics.responseTime[metrics.responseTime.length - 1], {warning: 150, critical: 200});
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
            {metrics.responseTime[metrics.responseTime.length - 1]}ms
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

      {/* Event Timeline */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h3>
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
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events By Type */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Events By Type</h3>
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
    </div>
  );
}