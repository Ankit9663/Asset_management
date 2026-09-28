/**
 * StatCard — Enterprise Light Theme Metric Card.
 * 
 * Props:
 *   icon     — emoji or icon symbol
 *   label    — card title
 *   value    — large metric count/value
 *   subtext  — secondary context metric below numbers
 *   footer   — alternative footer text
 *   accent   — CSS color for icon pill
 *   accentBg — CSS background color for icon pill
 *   onClick  — optional click handler
 */

export default function StatCard({ icon, label, value, subtext, footer, accent, accentBg, onClick }) {
  const style = {};
  if (accent) style['--stat-accent'] = accent;
  if (accentBg) style['--stat-accent-bg'] = accentBg;

  return (
    <div
      className={`stat-card${onClick ? ' clickable-row' : ''}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      id={`stat-${label?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {icon && <div className="stat-card-icon-pill">{icon}</div>}
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {(subtext || footer) && (
        <div className="stat-card-footer">
          {subtext || footer}
        </div>
      )}
    </div>
  );
}
