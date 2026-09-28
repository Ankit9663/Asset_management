'use client';

/**
 * App Header — top bar with department status, reset demo data, notification drawer, and mobile menu toggle.
 */

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function Header() {
  const toast = useToast();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/seed?reset=true', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      toast.success('Database Reset', `${data.assets} assets and ${data.issues} issues restored to demo state.`);
      setShowResetModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      toast.error('Reset Error', err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <header className="header" id="app-header">
        <div className="header-left">
          {/* Mobile menu toggle */}
          <button
            className="header-icon-btn sidebar-toggle"
            onClick={() => {
              const sidebar = document.querySelector('.sidebar');
              sidebar?.classList.toggle('open');
            }}
            aria-label="Toggle sidebar"
            id="sidebar-toggle"
          >
            ☰
          </button>

          <div className="header-brand-badge">
            <span className="dept-pill">
              <span className="dept-dot" />
              Gujarat R&B Dept • Gandhinagar
            </span>
          </div>

          {/* Quick Search */}
          <div className="header-search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search assets (e.g. NH-48)..."
              style={{
                padding: '6px 12px 6px 30px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                fontSize: '13px',
                color: 'var(--text-primary)',
                width: '240px',
                outline: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.location.href = `/assets?search=${encodeURIComponent(e.target.value.trim())}`;
                }
              }}
              id="header-global-search"
            />
          </div>
        </div>

        <div className="header-right">
          {/* One-click Reset Demo Data action */}
          <button
            className="btn btn-ghost btn-sm reset-demo-btn"
            onClick={() => setShowResetModal(true)}
            title="Reset database to initial demo state (18 assets, 14 issues)"
            id="header-reset-demo"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', border: '1px solid var(--border)' }}
          >
            <span>🔄</span>
            <span className="reset-btn-label">Reset Demo</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="header-icon-btn"
              aria-label="Notifications"
              id="header-notifications"
              onClick={() => setShowNotifications(prev => !prev)}
            >
              🔔
              <span className="notification-dot" />
            </button>

            {showNotifications && (
              <div className="notif-popover" id="notifications-popover">
                <div className="notif-header">
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>System Notifications</span>
                  <span className="badge badge-critical" style={{ fontSize: '10px' }}>2 Critical</span>
                </div>
                <div className="notif-list">
                  <div className="notif-item">
                    <span className="notif-icon">🚨</span>
                    <div className="notif-body">
                      <div className="notif-text">Critical pothole cluster on Bhavnagar City Road</div>
                      <div className="notif-time">Requires immediate inspection</div>
                    </div>
                  </div>
                  <div className="notif-item">
                    <span className="notif-icon">⚠️</span>
                    <div className="notif-body">
                      <div className="notif-text">Banas Bridge bearing displacement reported</div>
                      <div className="notif-time">Under Maintenance</div>
                    </div>
                  </div>
                  <div className="notif-item">
                    <span className="notif-icon">✅</span>
                    <div className="notif-body">
                      <div className="notif-text">Sabarmati River Bridge expansion joints completed</div>
                      <div className="notif-time">Resolved by R. K. Patel</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-full)',
            background: '#f8fafc',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              DO
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Demo Officer
            </span>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => !resetting && setShowResetModal(false)}
        title="Reset Demo Data"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowResetModal(false)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleResetData}
              disabled={resetting}
              id="confirm-reset-btn"
            >
              {resetting ? (
                <>
                  <span className="loading-spinner loading-spinner-sm" />
                  <span>Resetting...</span>
                </>
              ) : (
                '🔄 Reset Database'
              )}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
          This will wipe any temporary records and restore the database to its pristine demo state:
        </p>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>18 Assets</strong> (6 Roads, 5 Bridges, 7 Buildings)</li>
          <li><strong>14 Issues</strong> across Open, In Progress, and Completed states</li>
          <li>Full audit log history and sequential ID counters</li>
        </ul>
        <p style={{ color: 'var(--color-fair)', fontSize: '12px', marginTop: '12px' }}>
          ⚠️ Any newly added assets or modified issues will be restored to original seed values.
        </p>
      </Modal>
    </>
  );
}
