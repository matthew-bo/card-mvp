/**
 * List of admin email addresses
 */
const ADMIN_EMAILS = [
  'admin@example.com',
  // Add more admin emails as needed
];

/**
 * Check if a user is an admin based on their email
 * @param {Object|null} user - The user object
 * @returns {boolean} True if the user is an admin
 */
export function isAdmin(user) {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
} 