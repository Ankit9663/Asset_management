/**
 * StatusBadge — colored badge for asset status or issue status.
 * Supports: Active, Under Maintenance, Retired, Open, In Progress, Completed
 */

const STATUS_MAP = {
  'Active':             'badge-active',
  'Under Maintenance':  'badge-under-maintenance',
  'Retired':            'badge-retired',
  'Open':               'badge-open',
  'In Progress':        'badge-in-progress',
  'Completed':          'badge-completed',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'badge-active';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status || 'Unknown'}
    </span>
  );
}
