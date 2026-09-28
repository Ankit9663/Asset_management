'use client';

/**
 * Toast notification system using React Context.
 * 
 * Usage:
 *   import { useToast } from '@/components/Toast';
 *   const toast = useToast();
 *   toast.success('Asset created successfully!');
 *   toast.error('Failed to save.', 'Check your connection.');
 *   toast.warning('Warning text');
 *   toast.info('Info text');
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message, exiting: false }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const toast = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message, 6000),
    warning: (title, message) => addToast('warning', title, message, 5000),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" id="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
            id={`toast-${t.id}`}
          >
            <span className="toast-icon">{ICONS[t.type]}</span>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
