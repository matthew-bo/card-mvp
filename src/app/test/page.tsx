'use client';

import React, { useState, useEffect } from 'react';

export default function TestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <div className="p-8">Test Page Works</div>;
}