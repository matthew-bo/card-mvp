'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useAuthGuard } from '@/utils/auth/useAuthGuard';
import { 
  updateUserProfile, 
  updateUserEmail, 
  updateUserPassword, 
} from '@/utils/auth/authService';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';

export default function ProfilePage() {
  // Use the auth guard to check authentication
  const authGuard = useAuthGuard({
    requireAuth: true,
    redirectTo: '/auth/login'
  });
  
  // Use the regular auth hook for user data
  const { user } = useAuth();
  const router = useRouter();
  // Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Email Form States
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Use the auth guard to check authentication
useAuthGuard({
    requireAuth: true,
    redirectTo: '/auth/login'
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    } else {
      // Redirect to login if not authenticated
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      await updateUserProfile(displayName);
      setProfileSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      const error = err as Error;
      setProfileError(error.message);
    } finally {
      setProfileUpdating(false);
    }
  };

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailUpdating(true);
    setEmailSuccess(false);
    setEmailError('');

    try {
      await updateUserEmail(currentPasswordForEmail, newEmail);
      setEmailSuccess(true);
      setNewEmail('');
      setCurrentPasswordForEmail('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating email:', err);
      const error = err as Error;
      setEmailError(error.message);
    } finally {
      setEmailUpdating(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setPasswordUpdating(true);
    setPasswordSuccess(false);
    setPasswordError('');

    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      const error = err as Error;
      setPasswordError(error.message);
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h1>
          
          {/* Email verification banner */}
          {user.emailVerified === false && (
            <EmailVerificationBanner email={user.email || ''} />
          )}
          
          {/* Profile Information Form */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              {profileError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {profileError}
                </div>
              )}
              
              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  Profile updated successfully!
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {user.email}
                    </span>
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {user.emailVerified ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600">Not Verified</span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={profileUpdating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {profileUpdating ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Update Email Form */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Update Email</h2>
            <form onSubmit={handleEmailUpdate}>
              {emailError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {emailError}
                </div>
              )}
              
              {emailSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  Email update initiated! Please check your new email address for verification.
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                    New Email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="currentPasswordForEmail" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPasswordForEmail"
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={emailUpdating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {emailUpdating ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Update Password Form */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Update Password</h2>
            <form onSubmit={handlePasswordUpdate}>
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  Password updated successfully!
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number and special character
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {passwordUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}