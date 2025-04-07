// Re-export AuthContext
export * from './AuthContext';

// Try to export NotificationContext, but handle errors
try {
  // Using require instead of import for conditional loading
  const notificationModule = require('./NotificationContext');
  if (notificationModule) {
    module.exports = {
      ...module.exports,
      ...notificationModule
    };
  }
} catch (error) {
  console.warn('Could not load NotificationContext:', error);
} 