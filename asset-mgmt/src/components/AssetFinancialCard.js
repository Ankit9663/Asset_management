'use client';

/**
 * AssetFinancialCard
 * Displays complete financial and lifecycle metrics for an infrastructure asset:
 * - Original Construction Cost
 * - Cumulative Completed Maintenance Cost & Ratio
 * - Commissioning Date & Age
 * - Funding Source
 * - Warranty & Last Renovation
 * - Most Recent Completed Maintenance Job & Cost
 */

export function formatINR(val, compact = false) {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const num = Number(val);
  if (compact) {
    if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹ ${num.toLocaleString('en-IN')}`;
}

export default function AssetFinancialCard({ asset }) {
  if (!asset) return null;

  const constructionCost = Number(asset.construction_cost || 0);
  const maintenanceCost = Number(asset.cumulative_maintenance_cost || 0);
  const maintenanceRatio = constructionCost > 0
    ? ((maintenanceCost / constructionCost) * 100).toFixed(1)
    : '0.0';

  // Calculate age if commissioning_date or construction_date exists
  let assetAge = null;
  const startDate = asset.commissioning_date || asset.construction_date;
  if (startDate) {
    const startYear = new Date(startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(startYear)) {
      const diff = currentYear - startYear;
      assetAge = diff <= 0 ? 'Less than 1 yr' : `${diff} yr${diff > 1 ? 's' : ''}`;
    }
  }

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💰</span> Financial & Lifecycle Overview
          </h2>
          <p className="text-secondary" style={{ fontSize: '13px', margin: '2px 0 0' }}>
            Audited capital investment, completed maintenance outlays, and asset lifecycle milestones.
          </p>
        </div>
        {asset.funding_source && (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid #bae6fd'
          }}>
            Funding: {asset.funding_source}
          </span>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Construction Cost */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Initial Construction Cost
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {constructionCost > 0 ? formatINR(constructionCost, true) : 'Not Recorded'}
          </div>
          {constructionCost > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {formatINR(constructionCost)}
            </div>
          )}
        </div>

        {/* Cumulative Maintenance Outlay */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius)',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cumulative Maintenance Spend
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#14532d', marginTop: '4px' }}>
            {formatINR(maintenanceCost, true)}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
            Across {asset.completed_issues || 0} completed work order{asset.completed_issues === 1 ? '' : 's'}
          </div>
        </div>

        {/* Maintenance Ratio */}
        <div style={{
          background: Number(maintenanceRatio) > 25 ? '#fffbeb' : '#f8fafc',
          border: `1px solid ${Number(maintenanceRatio) > 25 ? '#fde68a' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: Number(maintenanceRatio) > 25 ? '#92400e' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Maintenance-to-Capex Ratio
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: Number(maintenanceRatio) > 25 ? '#b45309' : 'var(--text-primary)', marginTop: '4px' }}>
            {maintenanceRatio}%
          </div>
          <div style={{ fontSize: '11px', color: Number(maintenanceRatio) > 25 ? '#92400e' : 'var(--text-tertiary)', marginTop: '2px' }}>
            {Number(maintenanceRatio) > 25 ? 'High maintenance intensity' : 'Within normal operational limits'}
          </div>
        </div>

        {/* Most Recent Job */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Latest Maintenance Job
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {asset.most_recent_maintenance_cost ? formatINR(asset.most_recent_maintenance_cost, true) : 'None'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {asset.most_recent_maintenance_date ? new Date(asset.most_recent_maintenance_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No completed jobs'}
          </div>
        </div>
      </div>

      {/* Secondary Lifecycle Dates & Source Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        background: '#fcfcfd',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Commissioning Date
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {asset.commissioning_date ? new Date(asset.commissioning_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (asset.construction_date || '—')}
          </div>
          {assetAge && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Age: {assetAge}</div>}
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Warranty Status
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {asset.warranty_expiry_date ? (
              new Date(asset.warranty_expiry_date) < new Date() ? (
                <span style={{ color: '#ef4444' }}>Expired ({asset.warranty_expiry_date})</span>
              ) : (
                <span style={{ color: '#10b981' }}>Active until {asset.warranty_expiry_date}</span>
              )
            ) : 'Standard DLP Ended'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Last Major Renovation
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {asset.last_renovation_date || 'No major retrofitting'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Book Value (Depreciated)
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {asset.book_value ? formatINR(asset.book_value, true) : 'Calculated at Year-End'}
          </div>
        </div>
      </div>
    </div>
  );
}
