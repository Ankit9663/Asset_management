/**
 * ActivityTimeline — Refined Enterprise Vertical Timeline.
 * 
 * Props:
 *   activities — array of activity log entries
 *   loading    — show loading state
 */

import EmptyState from './EmptyState';

const ACTION_ICONS = {
  'ASSET_REGISTERED':     '🛣️',
  'ASSET_EDITED':         '✏️',
  'CONDITION_UPDATED':    '🔄',
  'ASSET_RETIRED':        '🚫',
  'ISSUE_REPORTED':       '🚨',
  'ISSUE_ASSIGNED':       '👤',
  'ISSUE_STATUS_UPDATED': '📋',
  'ISSUE_COMPLETED':      '✅',
  'ISSUE_REOPENED':       '🔓',
};

const ACTION_COLORS = {
  'ASSET_REGISTERED':     '#2563eb',
  'ASSET_EDITED':         '#475569',
  'CONDITION_UPDATED':    '#d97706',
  'ASSET_RETIRED':        '#64748b',
  'ISSUE_REPORTED':       '#dc2626',
  'ISSUE_ASSIGNED':       '#2563eb',
  'ISSUE_STATUS_UPDATED': '#b45309',
  'ISSUE_COMPLETED':      '#059669',
  'ISSUE_REOPENED':       '#d97706',
};

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivityTimeline({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No activity yet"
        description="Activity will appear here as actions are performed on assets and issues."
      />
    );
  }

  return (
    <div className="timeline" id="activity-timeline">
      {activities.map((entry) => (
        <div key={entry.id} className="timeline-item" id={`activity-${entry.id}`}>
          <div
            className="timeline-node"
            style={{
              borderColor: ACTION_COLORS[entry.action] || '#94a3b8',
            }}
          />
          <div className="timeline-content">
            <div className="timeline-summary">
              <span style={{ marginRight: '6px' }}>{ACTION_ICONS[entry.action] || '📌'}</span>
              {entry.summary}
            </div>
            <div className="timeline-meta">
              <span>{formatTimestamp(entry.timestamp)}</span>
              <span>•</span>
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{entry.actor}</span>
              {entry.asset_name && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{entry.asset_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
