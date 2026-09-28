'use client';

/**
 * AssetLifecycleTimeline Component
 * Unified chronological lifecycle timeline combining capital commissioning,
 * periodic field inspections, reported maintenance issues, and verified work order completions.
 */

export default function AssetLifecycleTimeline({
  asset,
  issues = [],
  inspections = [],
  activities = [],
  onIssueClick,
}) {
  if (!asset) return null;

  // Build unified events array
  const events = [];

  // 1. Commissioning Event
  if (asset.commissioning_date || asset.construction_date) {
    const commDate = asset.commissioning_date || asset.construction_date;
    events.push({
      date: new Date(commDate),
      type: 'COMMISSIONING',
      title: 'Infrastructure Commissioned & Dedicated to Public Service',
      actor: 'Gujarat R&B Department',
      description: `Initial construction capex: ₹ ${Number(asset.construction_cost || 0).toLocaleString('en-IN')}. Funding source: ${asset.funding_source || 'State Capital Budget'}.`,
      icon: '🏗️',
      color: '#0284c7',
      bg: '#e0f2fe',
    });
  }

  // 2. Periodic Inspections
  inspections.forEach((insp) => {
    events.push({
      date: new Date(insp.inspection_date),
      type: 'INSPECTION',
      title: `${insp.inspection_type} Periodic Inspection Conducted`,
      actor: insp.inspector_name,
      description: `Condition assessed as ${insp.condition_assessment}. ${insp.observations}${insp.defects_identified ? ` (Defects: ${insp.defects_identified})` : ''}`,
      icon: '📋',
      color: insp.condition_assessment === 'Critical' ? '#dc2626' : insp.condition_assessment === 'Poor' ? '#ea580c' : '#16a34a',
      bg: insp.condition_assessment === 'Critical' ? '#fef2f2' : insp.condition_assessment === 'Poor' ? '#fff7ed' : '#f0fdf4',
      badge: insp.condition_assessment,
    });
  });

  // 3. Issues & Work Orders
  issues.forEach((iss) => {
    // Reported
    if (iss.reported_date) {
      events.push({
        date: new Date(iss.reported_date),
        type: 'ISSUE_REPORTED',
        title: `Maintenance Order ${iss.id} Initiated: ${iss.issue_category}`,
        actor: iss.reported_by || 'Field Observer',
        description: iss.description,
        icon: '🚨',
        color: iss.priority === 'Critical' ? '#dc2626' : iss.priority === 'High' ? '#ea580c' : '#0284c7',
        bg: iss.priority === 'Critical' ? '#fef2f2' : '#f8fafc',
        issueId: iss.id,
        badge: iss.priority,
      });
    }

    // Completed & Verified
    if (iss.status === 'Completed' && iss.completed_date) {
      events.push({
        date: new Date(iss.completed_date),
        type: 'MAINTENANCE_COMPLETED',
        title: `Work Order ${iss.id} Completed & Officially Verified`,
        actor: iss.verified_by || 'Department Administrator',
        description: `Executed for ₹ ${Number(iss.actual_cost || 0).toLocaleString('en-IN')}${iss.resolution_notes ? ` — ${iss.resolution_notes}` : ''}`,
        icon: '✅',
        color: '#16a34a',
        bg: '#f0fdf4',
        issueId: iss.id,
        badge: 'Verified',
      });
    }
  });

  // 4. Renovation Event (if recorded)
  if (asset.last_renovation_date) {
    events.push({
      date: new Date(asset.last_renovation_date),
      type: 'RENOVATION',
      title: 'Major Structural Retrofitting / Renovation Completed',
      actor: 'Department Works',
      description: 'Comprehensive rehabilitation and structural upgrading.',
      icon: '🛠️',
      color: '#7c3aed',
      bg: '#f5f3ff',
    });
  }

  // Sort reverse chronological
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📜</div>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-primary)' }}>
          No Lifecycle Milestones Recorded
        </h4>
        <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
          Timeline events populate automatically as inspections and maintenance occur.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '28px', borderLeft: '2px solid #e2e8f0', marginLeft: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {events.map((ev, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            {/* Timeline Node Dot */}
            <div style={{
              position: 'absolute',
              left: '-41px',
              top: '2px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: ev.bg,
              border: `2px solid ${ev.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              {ev.icon}
            </div>

            {/* Event Content Box */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {ev.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ev.badge && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: ev.bg,
                      color: ev.color,
                      border: `1px solid ${ev.color}44`
                    }}>
                      {ev.badge}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    {ev.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                {ev.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                <span>Recorded by: <strong>{ev.actor}</strong></span>
                {ev.issueId && onIssueClick && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--color-primary)' }}
                    onClick={() => onIssueClick(ev.issueId)}
                  >
                    View Details →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
