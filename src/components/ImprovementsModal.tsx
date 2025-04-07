'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImprovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoClick?: () => void;
}

const ImprovementsModal: React.FC<ImprovementsModalProps> = ({ isOpen, onClose, onDemoClick }) => {
  if (!isOpen) return null;

  const handleDemoClick = () => {
    if (onDemoClick) {
      onDemoClick();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl z-10 relative mx-auto overflow-hidden"
            >
              {/* Header */}
              <div className="bg-blue-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Recent Improvements</h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-blue-700 transition-colors"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2 flex items-center justify-center">1</span>
                      Improved Card Loading Speed
                    </h3>
                    <ul className="ml-10 list-disc space-y-2 text-gray-600">
                      <li>Added immediate UI feedback with placeholder cards</li>
                      <li>Optimized data storage strategies for faster loading</li>
                      <li>Simplified loading flow to avoid unnecessary re-renders</li>
                      <li>Added skeleton UI for better loading experience</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2 flex items-center justify-center">2</span>
                      Enhanced Not Interested Popup
                    </h3>
                    <ul className="ml-10 list-disc space-y-2 text-gray-600">
                      <li>Improved the not interested card list modal</li>
                      <li>Better data fetching to display complete card details</li>
                      <li>Added proper error handling for card data</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2 flex items-center justify-center">3</span>
                      Added Skeleton UI
                    </h3>
                    <ul className="ml-10 list-disc space-y-2 text-gray-600">
                      <li>Added animated loading states for cards, expenses, and recommendations</li>
                      <li>Implemented smooth transitions between loading and loaded states</li>
                      <li>Created reusable skeleton components for consistent loading UI</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2 flex items-center justify-center">4</span>
                      Fixed LocalStorage Quota Issues
                    </h3>
                    <ul className="ml-10 list-disc space-y-2 text-gray-600">
                      <li>Optimized storage by reducing chunk size of cached data</li>
                      <li>Trimmed unnecessary data before caching to save space</li>
                      <li>Added better error handling for storage operations</li>
                    </ul>
                  </section>
                </div>

                {/* Demo Button */}
                {onDemoClick && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={handleDemoClick}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Demo Skeleton UI Loading
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImprovementsModal; 