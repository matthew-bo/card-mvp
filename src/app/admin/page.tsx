'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// UserManagement Component
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const usersSnap = await getDocs(collection(db, 'user_preferences'));
      const userData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
    }

    loadUsers();
  }, []);

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
                  Preferences
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.updatedAt?.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.optimizationPreference}
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalCards: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Get Users
        const usersSnap = await getDocs(collection(db, 'user_preferences'));
        const uniqueUsers = new Set(usersSnap.docs.map(doc => doc.data().userId));

        // Get Expenses
        const expensesSnap = await getDocs(collection(db, 'expenses'));
        
        // Get Cards
        const cardsSnap = await getDocs(collection(db, 'user_cards'));

        setStats({
          totalUsers: uniqueUsers.size,
          totalExpenses: expensesSnap.size,
          totalCards: cardsSnap.size
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
            <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {loading ? '...' : stats.totalExpenses}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Cards</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {loading ? '...' : stats.totalCards}
            </p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="mt-8">
          <UserManagement />
        </div>
      </main>
    </AdminLayout>
  );
}