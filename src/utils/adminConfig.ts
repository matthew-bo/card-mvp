import type { User } from 'firebase/auth';

// List of admin email addresses
const ADMIN_EMAILS = [
  'admin@example.com',
  // Add more admin emails as needed
];

/**
 * Check if a user is an admin based on their email
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}