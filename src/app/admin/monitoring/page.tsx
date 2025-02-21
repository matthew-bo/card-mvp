import MonitoringDashboard from '@/components/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">System Monitoring</h1>
      <MonitoringDashboard />
    </div>
  );
}