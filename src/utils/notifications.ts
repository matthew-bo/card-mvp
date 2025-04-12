export const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-100 text-green-800' :
    type === 'error' ? 'bg-red-100 text-red-800' :
    'bg-blue-100 text-blue-800'
  }`;
  notification.textContent = message;

  // Add to document
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}; 