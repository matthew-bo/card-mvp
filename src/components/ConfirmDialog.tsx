'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(isOpen);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
  
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Handle clicking outside the dialog
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent scrolling when dialog is open
  useEffect(() => {
    // Only modify body style when the open state changes
    if (prevOpenRef.current !== isOpen) {
      if (isOpen) {
        // Save the current overflow style
        const originalStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        // Return cleanup function
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }
    
    // Update ref for next render
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle confirm with animation
  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
    }, 200);
  };

  if (!isOpen) return null;

  // Rest of your component code...
  // ...
};

export default ConfirmDialog;