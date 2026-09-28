/**
 * ActivityTimeline — chronological activity log display.
 * 
 * Props:
 *   activities — array of activity log entries
 *   loading    — show loading state
 */

import EmptyState from './EmptyState';

const ACTION_ICONS = {
  'ASSET_REGISTERED':     '📝',
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
  'ASSET_REGISTERED':     'var(--color-good)',
  'ASSET_EDITED':         'var(--color-primary)',
  'CONDITION_UPDATED':    'var(--color-fair)',
  'ASSET_RETIRED':        'var(--color-retired)',
  'ISSUE_REPORTED':       'var(--color-open)',
  'ISSUE_ASSIGNED':       'var(--color-primary)',
  'ISSUE_STATUS_UPDATED': 'var(--color-in-progress)',
  'ISSUE_COMPLETED':      'var(--color-completed)',
  'ISSUE_REOPENED':       'var(--color-fair)',
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
      <div className="loading-page">
        <div className="loading-spinner" />
        <span>Loading activity...</span>
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
            className="timeline-icon"
            style={{ borderColor: ACTION_COLORS[entry.action] || 'var(--border)' }}
          >
            {ACTION_ICONS[entry.action] || '📌'}
          </div>
          <div className="timeline-content">
            <div className="timeline-summary">{entry.summary}</div>
            <div className="timeline-meta">
              <span>{formatTimestamp(entry.timestamp)}</span>
              <span>•</span>
              <span>{entry.actor}</span>
              {entry.asset_name && (
                <>
                  <span>•</span>
                  <span className="text-secondary">{entry.asset_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
