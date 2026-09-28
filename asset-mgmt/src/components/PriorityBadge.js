/**
 * PriorityBadge — colored badge for issue priority.
 * Supports: Low, Medium, High, Critical
 */

const PRIORITY_MAP = {
  'Low':      'badge-priority-low',
  'Medium':   'badge-priority-medium',
  'High':     'badge-priority-high',
  'Critical': 'badge-priority-critical',
};

const PRIORITY_ICONS = {
  'Low':      '↓',
  'Medium':   '→',
  'High':     '↑',
  'Critical': '⚠',
};

export default function PriorityBadge({ priority }) {
  const cls = PRIORITY_MAP[priority] || 'badge-priority-medium';
  const icon = PRIORITY_ICONS[priority] || '→';
  return (
    <span className={`badge ${cls}`}>
      {icon} {priority || 'Medium'}
    </span>
  );
}
