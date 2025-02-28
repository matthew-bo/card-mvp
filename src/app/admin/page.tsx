'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { collection, getDocs, } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/utils/adminConfig';
import ApiUsageStats from '@/components/ApiUsageStats';
import AdminCardManager from '@/components/AdminCardManager';


interface UserPreference {
  id: string;
  userId: string;
  optimizationPreference: "points" | "creditScore" | "cashback" | "perks";
  creditScore: "poor" | "fair" | "good" | "excellent";
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalExpenses: number;
  totalCards: number;
  totalSpent: number;
  averageExpense: number;
}

// Analytics Component
const AnalyticsDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpenses() {
      const expensesSnap = await getDocs(collection(db, 'expenses'));
      const expenseData = expensesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expenseData);
      setLoading(false);
    }

    loadExpenses();
  }, []);

  const getCategoryData = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total
    }));
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getCategoryData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const usersSnap = await getDocs(collection(db, 'user_preferences'));
      const userData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserPreference[];
      setUsers(userData);
      setLoading(false);
    }

    loadUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Optimization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Score
                </th>
              </tr>
              <div className="mb-8">
                <ApiUsageStats />
              </div>
              <div className="mb-8">
                <AdminCardManager />
              </div>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.updatedAt.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.optimizationPreference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.creditScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main AdminDashboard Component
export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [cacheTimestamp, setCacheTimestamp] = useState<Date | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalExpenses: 0,
    totalCards: 0,
    totalSpent: 0,
    averageExpense: 0
  });

  const [loading, setLoading] = useState(true);
  
  // Add the fetchCacheInfo function here
  const fetchCacheInfo = async () => {
    try {
      const response = await fetch('/api/cards/cache-info');
      if (response.ok) {
        const data = await response.json();
        setCacheTimestamp(data.timestamp ? new Date(data.timestamp) : null);
      }
    } catch (error) {
      console.error('Error fetching cache info:', error);
    }
  };
  
  const handleRefreshCardData = async () => {
    try {
      const response = await fetch('/api/cards/refresh', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Card database refreshed successfully! ${data.cardCount} cards loaded.`);
        // Update the cache timestamp
        fetchCacheInfo();
      } else {
        alert('Failed to refresh card database. Please try again.');
      }
    } catch (error) {
      console.error('Error refreshing card database:', error);
      alert('Failed to refresh card database. Please try again.');
    }
  };

  useEffect(() => {
    // If not logged in or not admin, redirect to home
    if (!user) {
      router.push('/');
      return;
    }

    if (!isAdmin(user.email)) {
      console.log('Not an admin:', user.email);
      router.push('/');
      return;
    }
    
    // Call fetchCacheInfo
    fetchCacheInfo();
  }, [user, router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'user_preferences'));
        const expensesSnap = await getDocs(collection(db, 'expenses'));
        const cardsSnap = await getDocs(collection(db, 'user_cards'));

        const expenses = expensesSnap.docs.map(doc => doc.data());
        const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        setStats({
          totalUsers: usersSnap.size,
          totalExpenses: expensesSnap.size,
          totalCards: cardsSnap.size,
          totalSpent,
          averageExpense: totalSpent / expensesSnap.size || 0
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <AdminLayout>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {loading ? '...' : stats.totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Spent</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {loading ? '...' : `$${stats.totalSpent.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900">Avg. Expense</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {loading ? '...' : `$${stats.averageExpense.toFixed(2)}`}
            </p>
          </div>
        </div>
        
        {/* Database Management Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Database Management</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Refresh the credit card database from the API</p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {cacheTimestamp ? cacheTimestamp.toLocaleString() : 'Never'}
              </p>
            </div>
            <button 
              onClick={handleRefreshCardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Card Database
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <AnalyticsDashboard />
        </div>

        {/* User Management Section */}
        <div className="mb-8">
          <UserManagement />
        </div>
      </main>
    </AdminLayout>
  );
}