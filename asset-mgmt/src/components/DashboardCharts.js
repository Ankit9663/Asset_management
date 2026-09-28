'use client';

/**
 * DashboardCharts Component Suite
 * Enterprise SVG visualizations for infrastructure asset portfolio analytics:
 * 1. Category Distribution Donut Chart
 * 2. Asset Condition Distribution Bars
 * 3. Issue Lifecycle Funnel
 * 4. Maintenance Spend by Asset Category
 * 5. Monthly Expenditure Trend
 */

export function CategoryDonutChart({ data = { Road: 0, Bridge: 0, Building: 0 } }) {
  const total = (data.Road || 0) + (data.Bridge || 0) + (data.Building || 0);
  if (total === 0) return null;

  const categories = [
    { label: 'Roads', count: data.Road || 0, color: '#3b82f6', icon: '🛣️' },
    { label: 'Bridges', count: data.Bridge || 0, color: '#0284c7', icon: '🌉' },
    { label: 'Buildings', count: data.Building || 0, color: '#f59e0b', icon: '🏛️' },
  ];

  // SVG Donut calculation
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          {categories.map((c) => {
            const percent = total > 0 ? (c.count / total) : 0;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += percent;

            return (
              <circle
                key={c.label}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={c.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'all 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Assets</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {categories.map((c) => {
          const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
          return (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, minWidth: '70px' }}>
                {c.icon} {c.label}:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.count}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConditionDistributionBar({ data = { Good: 0, Fair: 0, Poor: 0, Critical: 0 } }) {
  const total = (data.Good || 0) + (data.Fair || 0) + (data.Poor || 0) + (data.Critical || 0);
  if (total === 0) return null;

  const conditions = [
    { label: 'Good', count: data.Good || 0, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Fair', count: data.Fair || 0, color: '#d97706', bg: '#fef3c7' },
    { label: 'Poor', count: data.Poor || 0, color: '#ea580c', bg: '#ffedd5' },
    { label: 'Critical', count: data.Critical || 0, color: '#dc2626', bg: '#fee2e2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Stacked Progress Bar */}
      <div style={{ height: '14px', borderRadius: '9999px', display: 'flex', overflow: 'hidden', background: '#f1f5f9' }}>
        {conditions.map((c) => {
          const width = total > 0 ? (c.count / total) * 100 : 0;
          if (width === 0) return null;
          return (
            <div
              key={c.label}
              style={{
                width: `${width}%`,
                background: c.color,
                transition: 'width 0.4s ease'
              }}
              title={`${c.label}: ${c.count} (${Math.round(width)}%)`}
            />
          );
        })}
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {conditions.map((c) => {
          const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
          return (
            <div
              key={c.label}
              style={{
                background: c.bg,
                border: `1px solid ${c.color}33`,
                borderRadius: 'var(--radius)',
                padding: '8px 10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: c.color, textTransform: 'uppercase' }}>
                {c.label}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: c.color, marginTop: '2px' }}>
                {c.count}
              </div>
              <div style={{ fontSize: '10.5px', color: c.color, opacity: 0.85 }}>
                {pct}% of fleet
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpendByCategoryChart({ data = { Road: 0, Bridge: 0, Building: 0 } }) {
  const maxSpend = Math.max(Number(data.Road || 0), Number(data.Bridge || 0), Number(data.Building || 0), 1);

  const items = [
    { label: 'Roads', amount: Number(data.Road || 0), color: '#3b82f6', icon: '🛣️' },
    { label: 'Bridges', amount: Number(data.Bridge || 0), color: '#0284c7', icon: '🌉' },
    { label: 'Buildings', amount: Number(data.Building || 0), color: '#f59e0b', icon: '🏛️' },
  ];

  const formatShort = (val) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((it) => {
        const percent = Math.min((it.amount / maxSpend) * 100, 100);
        return (
          <div key={it.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{it.icon} {it.label}</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatShort(it.amount)}</span>
            </div>
            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                background: it.color,
                borderRadius: '9999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function IssueLifecycleFunnel({ data = {} }) {
  const stages = [
    { key: 'Open', label: 'Open', count: data['Open'] || 0, color: '#f59e0b' },
    { key: 'Pending Approval', label: 'Estimating', count: data['Pending Approval'] || 0, color: '#d97706' },
    { key: 'Approved', label: 'Sanctioned', count: data['Approved'] || 0, color: '#0284c7' },
    { key: 'In Progress', label: 'Executing', count: data['In Progress'] || 0, color: '#3b82f6' },
    { key: 'Awaiting Verification', label: 'Verifying', count: data['Awaiting Verification'] || 0, color: '#8b5cf6' },
    { key: 'Completed', label: 'Closed', count: data['Completed'] || 0, color: '#16a34a' },
  ];

  const maxVal = Math.max(...stages.map(s => s.count), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'end', height: '140px', paddingTop: '10px' }}>
      {stages.map((st) => {
        const heightPct = Math.max((st.count / maxVal) * 85, 12);
        return (
          <div key={st.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: st.color, marginBottom: '4px' }}>
              {st.count}
            </span>
            <div style={{
              width: '100%',
              maxWidth: '36px',
              height: `${heightPct}%`,
              background: st.color,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s ease'
            }} />
            <span style={{
              fontSize: '10.5px',
              color: 'var(--text-secondary)',
              marginTop: '6px',
              textAlign: 'center',
              lineHeight: 1.1,
              whiteSpace: 'nowrap'
            }}>
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
        No completed maintenance orders recorded in recent months.
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  const formatShort = (val) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', height: '150px', padding: '10px 0' }}>
      {data.map((item, idx) => {
        const heightPct = Math.max((item.amount / maxAmount) * 85, 10);
        return (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {formatShort(item.amount)}
            </span>
            <div style={{
              width: '100%',
              maxWidth: '44px',
              height: `${heightPct}%`,
              background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s ease'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'nowrap' }}>
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}
