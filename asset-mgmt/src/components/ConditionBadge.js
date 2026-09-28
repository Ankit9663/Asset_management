/**
 * ConditionBadge — colored badge for asset condition.
 * Supports: Good, Fair, Poor, Critical
 */

const CONDITION_MAP = {
  'Good':     'badge-good',
  'Fair':     'badge-fair',
  'Poor':     'badge-poor',
  'Critical': 'badge-critical',
};

export default function ConditionBadge({ condition }) {
  const cls = CONDITION_MAP[condition] || 'badge-good';
  return (
    <span className={`badge ${cls}`} id={`condition-badge-${condition?.toLowerCase()}`}>
      <span className="badge-dot" />
      {condition || 'Unknown'}
    </span>
  );
}
