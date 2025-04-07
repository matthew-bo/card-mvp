'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Type definitions
interface ChartDataItem {
  category: string;
  'Current Best Rate': number;
  'Recommended Best Rate': number;
}

interface RewardsChartProps {
  data: ChartDataItem[];
}

const RewardsChart: React.FC<RewardsChartProps> = ({ data }) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis label={{ value: 'Reward Rate (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Current Best Rate" fill="#4B5563" />
          <Bar dataKey="Recommended Best Rate" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RewardsChart;
