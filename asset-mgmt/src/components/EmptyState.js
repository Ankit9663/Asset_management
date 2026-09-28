/**
 * EmptyState — friendly placeholder when no data is available.
 * 
 * Props:
 *   icon         — emoji or icon character
 *   title        — heading text
 *   description  — subtitle text
 *   action       — optional React node (e.g., a button)
 */

export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="empty-state" id="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title || 'Nothing here yet'}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
