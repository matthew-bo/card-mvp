'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * @typedef {Object} ApiUsage
 * @property {string} id
 * @property {string} endpoint
 * @property {number} count
 * @property {Object} timestamp
 * @property {number} timestamp.seconds
 * @property {number} timestamp.nanoseconds
 */

/**
 * @typedef {Object} ApiStats
 * @property {number} totalCalls
 * @property {number} averageCallsPerDay
 * @property {Array<{endpoint: string, count: number}>} endpointStats
 */

export const ApiUsageStats = () => {
  const [apiUsage, setApiUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApiUsage() {
      const usageSnap = await getDocs(collection(db, 'apiUsage'));
      const usageData = usageSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApiUsage(usageData);
      setLoading(false);
    }

    loadApiUsage();
  }, []);

  const getStats = () => {
    const totalCalls = apiUsage.reduce((sum, usage) => sum + usage.count, 0);
    const endpointStats = apiUsage.reduce((acc, usage) => {
      acc[usage.endpoint] = (acc[usage.endpoint] || 0) + usage.count;
      return acc;
    }, {});

    const averageCallsPerDay = totalCalls / 30; // Assuming 30 days

    return {
      totalCalls,
      averageCallsPerDay,
      endpointStats: Object.entries(endpointStats).map(([endpoint, count]) => ({
        endpoint,
        count
      }))
    };
  };

  if (loading) return <div>Loading API usage stats...</div>;

  const stats = getStats();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Total API Calls</h4>
          <p className="text-2xl font-bold text-blue-900">{stats.totalCalls}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Average Calls/Day</h4>
          <p className="text-2xl font-bold text-green-900">{Math.round(stats.averageCallsPerDay)}</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.endpointStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 