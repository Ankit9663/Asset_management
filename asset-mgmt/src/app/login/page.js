'use client';

/**
 * Simulated Login Experience — Gujarat R&B Asset Management Portal
 * Displays 11 seeded demo accounts grouped by role and category.
 */

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { SEEDED_USERS } from '@/lib/constants';

const ROLE_GROUPS = [
  {
    title: 'Department Administrator',
    description: 'Full administrative authority across all assets, issues, inspections, estimates, and verifications.',
    roleKey: 'ADMIN',
    badgeClass: 'badge-priority-critical',
  },
  {
    title: 'Road Maintenance Officers',
    description: 'Division-specific road engineers responsible for road inspections, estimates, and execution.',
    roleKey: 'ROAD_OFFICER',
    badgeClass: 'badge-road',
  },
  {
    title: 'Bridge Maintenance Officers',
    description: 'Division-specific bridge engineers responsible for bridge safety inspections, estimates, and execution.',
    roleKey: 'BRIDGE_OFFICER',
    badgeClass: 'badge-bridge',
  },
  {
    title: 'Building Maintenance Officers',
    description: 'Division-specific civil engineers responsible for government building maintenance and repairs.',
    roleKey: 'BUILDING_OFFICER',
    badgeClass: 'badge-building',
  },
  {
    title: 'Department Viewer',
    description: 'Read-only access to department-wide infrastructure dashboards, history, and financial metrics.',
    roleKey: 'VIEWER',
    badgeClass: 'badge-retired',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, login } = useUser();

  const handleSelectUser = (user) => {
    login(user);
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-root)',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '680px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          background: '#ffffff',
          padding: '8px 18px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
            color: '#ffffff',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}>
            G
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Roads & Buildings Department • Government of Gujarat
          </span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Asset Management Portal — Sign In
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Select a demonstration profile below to experience the system through specific operational roles and division authorities. No password required.
        </p>
      </div>

      {/* Role Groups */}
      <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {ROLE_GROUPS.map((group) => {
          const groupUsers = SEEDED_USERS.filter(u => u.role === group.roleKey);
          return (
            <div key={group.roleKey} style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {group.title}
                  </h2>
                  <span className={`badge ${group.badgeClass}`} style={{ fontSize: '11px' }}>
                    {groupUsers.length} Account{groupUsers.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {group.description}
                </p>
              </div>

              {/* User Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}>
                {groupUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-lg)',
                        border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        background: isCurrent ? 'var(--color-primary-light)' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
                      }}
                      id={`login-card-${user.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: isCurrent ? 'var(--color-primary)' : '#e2e8f0',
                          color: isCurrent ? '#ffffff' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0,
                        }}>
                          {user.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                            {user.designation}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: 'var(--text-secondary)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid #cbd5e1',
                            }}>
                              📍 {user.divisionName}
                            </span>
                            {user.category !== 'ALL' && (
                              <span className={`badge badge-${user.category.toLowerCase()}`} style={{ fontSize: '10px' }}>
                                {user.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        className={`btn ${isCurrent ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => handleSelectUser(user)}
                        style={{ width: '100%', marginTop: '4px' }}
                        id={`select-user-${user.id}`}
                      >
                        {isCurrent ? '✓ Active Session (Continue)' : `Continue as ${user.name.split(' ')[0]}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
