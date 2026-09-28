'use client';

/**
 * Sidebar — navigation panel with brand, links, and user info.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/assets', label: 'Asset Inventory', icon: '🏗️' },
      { href: '/assets/new', label: 'Add Asset', icon: '➕' },
      { href: '/issues', label: 'Maintenance Issues', icon: '🔧' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useUser();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="sidebar" id="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">G</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Gujarat R&B</span>
            <span className="sidebar-brand-sub">Asset Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
                  id={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                  onClick={() => {
                    const sidebar = document.querySelector('.sidebar');
                    sidebar?.classList.remove('open');
                  }}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer">
          <Link href="/login" style={{ textDecoration: 'none' }} title="Click to switch profile">
            <div className="sidebar-user" style={{ cursor: 'pointer' }}>
              <div className="sidebar-user-avatar">
                {currentUser?.avatar || 'VT'}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser?.name || 'Vikram Trivedi'}</span>
                <span className="sidebar-user-role">
                  {currentUser?.category !== 'ALL' ? `${currentUser?.category} • ` : ''}
                  {currentUser?.divisionName || 'Dept-wide'}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </aside>
      <div
        className="sidebar-backdrop"
        id="sidebar-backdrop"
        onClick={() => {
          const sidebar = document.querySelector('.sidebar');
          sidebar?.classList.remove('open');
        }}
      />
    </>
  );
}
