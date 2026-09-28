'use client';

/**
 * MaintenanceHistoryTab Component
 * Comprehensive historical record of completed work orders for an asset,
 * displaying approved budgets, actual expenditure, variance, and verification credentials.
 */

export default function MaintenanceHistoryTab({
  completedIssues = [],
  onIssueClick,
}) {
  if (!completedIssues || completedIssues.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏁</div>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-primary)' }}>
          No Completed Maintenance Work Orders
        </h4>
        <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
          Work orders that undergo full execution, completion reporting, and administrative verification will appear here.
        </p>
      </div>
    );
  }

  const formatINR = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return `₹ ${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div>
      <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Order ID</th>
              <th style={{ width: '130px' }}>Category</th>
              <th>Work Summary</th>
              <th style={{ width: '130px' }}>Executing Officer</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Sanctioned (₹)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Actual Spent (₹)</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Cost Variance</th>
              <th style={{ width: '140px' }}>Verified By</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {completedIssues.map((issue) => {
              const sanctioned = Number(issue.approved_amount || 0);
              const actual = Number(issue.actual_cost || 0);
              const variance = Number(issue.cost_variance || (actual - sanctioned));
              const isOverrun = variance > 50;
              const isSavings = variance < -50;

              return (
                <tr key={issue.id}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {issue.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {issue.issue_category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {issue.description}
                    </div>
                    {issue.resolution_notes && (
                      <div style={{ fontSize: '11.5px', color: '#15803d' }}>
                        ✓ {issue.resolution_notes}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {issue.assigned_officer_name || 'Department Officer'}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px' }}>
                    {formatINR(sanctioned)}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>
                    {formatINR(actual)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isOverrun && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                        + {formatINR(variance)}
                      </span>
                    )}
                    {isSavings && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                        - {formatINR(Math.abs(variance))}
                      </span>
                    )}
                    {!isOverrun && !isSavings && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Exact</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>
                      ✓ {issue.verified_by || 'Admin Verified'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {issue.completed_date ? new Date(issue.completed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Closed'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11.5px', padding: '3px 8px' }}
                      onClick={() => onIssueClick(issue.id)}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
