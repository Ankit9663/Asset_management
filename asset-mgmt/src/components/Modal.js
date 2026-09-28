'use client';

/**
 * Modal — reusable overlay modal with header, body, and footer.
 * 
 * Props:
 *   isOpen    — boolean to show/hide
 *   onClose   — close handler
 *   title     — modal title
 *   children  — modal body content
 *   footer    — optional footer content (buttons)
 *   size      — 'sm' | 'md' | 'lg' (default 'md')
 */

import { useEffect, useCallback } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: '400px',
    md: '520px',
    lg: '680px',
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose?.();
    }} id="modal-overlay">
      <div className="modal" style={{ maxWidth: maxWidthMap[size] }} role="dialog" aria-modal="true" id="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal" id="modal-close-btn">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
