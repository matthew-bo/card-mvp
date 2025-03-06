'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string | React.ReactNode;
  content: React.ReactNode;
}

interface TabsTransitionProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

const TabsTransition: React.FC<TabsTransitionProps> = ({
  tabs,
  defaultTabId,
  className = '',
  tabsClassName = '',
  contentClassName = ''
}) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  return (
    <div className={`w-full ${className}`}>
      {/* Tabs Selector */}
      <div className={`flex border-b border-gray-200 ${tabsClassName}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium relative ${
              activeTabId === tab.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
            {activeTabId === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                layoutId="tab-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`pt-4 ${contentClassName}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabsTransition;