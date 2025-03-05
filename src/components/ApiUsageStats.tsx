'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define types for API responses
interface ApiStatusCode {
  statusCode: number;
  apiCalls: number;
  apiCallsLimit: number;
  apiCallsRemaining: number;
  lastUpdated: string;
}

interface ApiUsageMonth {
  yearMonth: string;
  statusCode: ApiStatusCode[];
}

interface ProcessedUsageData {
  month: string;
  success: number;
  error: number;
  limit: number;
  remaining: number;
}

export function ApiUsageStats() {
  const [usageData, setUsageData] = useState<ApiUsageMonth[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApiUsage() {
      try {
        setLoading(true);
        const response = await fetch('/api/cards/usage');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch API usage: ${response.status}`);
        }
        
        const data = await response.json();
        setUsageData(data.data);
      } catch (err) {
        console.error('Error fetching API usage:', err);
        setError('Failed to load API usage data');
      } finally {
        setLoading(false);
      }
    }

    fetchApiUsage();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading API usage data...</p>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-red-500">{error || 'Failed to load data'}</p>
      </div>
    );
  }

  // Process the data for the chart
  const chartData: ProcessedUsageData[] = usageData.map((monthData: ApiUsageMonth) => {
    const successCalls = monthData.statusCode.find((sc: ApiStatusCode) => sc.statusCode === 200)?.apiCalls || 0;
    const errorCalls = monthData.statusCode
      .filter((sc: ApiStatusCode) => sc.statusCode !== 200)
      .reduce((sum: number, sc: ApiStatusCode) => sum + sc.apiCalls, 0);
    
    return {
      month: monthData.yearMonth,
      success: successCalls,
      error: errorCalls,
      limit: monthData.statusCode.find((sc: ApiStatusCode) => sc.statusCode === 200)?.apiCallsLimit || 0,
      remaining: monthData.statusCode.find((sc: ApiStatusCode) => sc.statusCode === 200)?.apiCallsRemaining || 0
    };
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">API Usage Statistics</h3>
      
      {/* Usage summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {chartData.length > 0 && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Current Month Usage</p>
              <p className="text-2xl font-bold">{chartData[0].success} / {chartData[0].limit}</p>
              <p className="text-sm text-gray-500">Calls remaining: {chartData[0].remaining}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Success Rate</p>
              <p className="text-2xl font-bold">
                {chartData[0].success > 0 ? 
                  `${((chartData[0].success / (chartData[0].success + chartData[0].error)) * 100).toFixed(1)}%` :
                  'N/A'}
              </p>
              <p className="text-sm text-gray-500">Successful API calls</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-600">Usage Trend</p>
              <p className="text-2xl font-bold">
                {chartData.length > 1 && chartData[1].success > 0 ? 
                  `${((chartData[0].success / chartData[1].success) * 100 - 100).toFixed(1)}%` :
                  'N/A'}
              </p>
              <p className="text-sm text-gray-500">Month-over-month change</p>
            </div>
          </>
        )}
      </div>
      
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="success" fill="#3B82F6" name="Successful Calls" />
            <Bar dataKey="error" fill="#EF4444" name="Error Calls" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Status code breakdown */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Status Code Breakdown (Current Month)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usageData[0]?.statusCode.map((sc: ApiStatusCode) => (
                <tr key={sc.statusCode}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sc.statusCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.apiCalls}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sc.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Add a default export as well to support both import styles
export default ApiUsageStats;