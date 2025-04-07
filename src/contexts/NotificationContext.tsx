'use client';

import React, { createContext, useContext } from 'react';

// Very simple context with minimal functionality
const NotificationContext = createContext<{
  showNotification: (message: string) => void;
}>({
  showNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const showNotification = (message: string) => {
    console.log('Notification:', message);
    // Simple implementation that just logs to console
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
} 