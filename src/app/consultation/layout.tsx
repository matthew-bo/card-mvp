'use client';

import React from 'react';
import Script from 'next/script';

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Load Calendly JavaScript */}
      <Script 
        src="https://assets.calendly.com/assets/external/widget.js" 
        strategy="lazyOnload"
      />
      
      {children}
    </>
  );
}