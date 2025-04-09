'use client';

import React, { useState } from 'react';
import ImprovementsModal from './ImprovementsModal';

declare global {
  interface Window {
    testSkeletonUI: () => void;
  }
}

const ImprovementsButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleDemoClick = () => {
    setShowModal(false);
    // Call the global function exposed by layout.tsx
    if (typeof window !== 'undefined' && typeof window.testSkeletonUI === 'function') {
      window.testSkeletonUI();
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-24 right-4 z-10 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md hover:bg-blue-200 transition-colors"
        aria-label="View recent improvements"
      >
        Recent Updates
      </button>
      
      <ImprovementsModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onDemoClick={handleDemoClick}
      />
    </>
  );
};

export default ImprovementsButton; 