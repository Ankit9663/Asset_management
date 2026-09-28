/**
 * StatCard — glassmorphism dashboard summary card.
 * 
 * Props:
 *   icon     — emoji or icon
 *   label    — card title
 *   value    — large number
 *   footer   — optional small footer text
 *   accent   — CSS color for the top accent bar
 *   accentBg — CSS color for the icon background
 *   onClick  — optional click handler
 */

export default function StatCard({ icon, label, value, footer, accent, accentBg, onClick }) {
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
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {footer && <div className="stat-card-footer">{footer}</div>}
    </div>
  );
}
