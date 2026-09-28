'use client';

/**
 * EstimateHistoryViewer Component
 * Renders complete version history (V1, V2, etc.) for cost estimates,
 * including component line items, vendor details, and administrative remarks.
 */

import { useState } from 'react';

export default function EstimateHistoryViewer({
  estimates = [],
  isAdmin = false,
  onReviewClick,
}) {
  const [expandedEstimateId, setExpandedEstimateId] = useState(
    estimates.length > 0 ? estimates[0].id : null
  );

  if (!estimates || estimates.length === 0) {
    return (
      <div style={{
        background: '#f8fafc',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>📐</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          No Cost Estimates Submitted Yet
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Assigned maintenance officers prepare component-wise estimates for administrative sanction.
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', icon: '✅' };
      case 'Pending Review':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: '⏳' };
      case 'Revision Requested':
        return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', icon: '🔄' };
      case 'Rejected':
        return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: '❌' };
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', icon: 'ℹ️' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {estimates.map((est) => {
        const badge = getStatusBadge(est.status);
        const isExpanded = expandedEstimateId === est.id;
        const items = est.items || [];

        return (
          <div
            key={est.id}
            style={{
              border: `1px solid ${est.status === 'Approved' ? '#86efac' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              background: '#ffffff',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            {/* Header / Summary Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: est.status === 'Approved' ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedEstimateId(isExpanded ? null : est.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  v{est.version}
                </span>
                <span className="text-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {est.id}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{badge.icon}</span> {est.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹ {Number(est.approved_amount || est.total_estimated_cost).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {items.length} item{items.length === 1 ? '' : 's'} • {new Date(est.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                {/* Administrative Remarks Banner */}
                {est.review_remarks && (
                  <div style={{
                    marginBottom: '14px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius)',
                    background: est.status === 'Approved' ? '#f0fdf4' : est.status === 'Revision Requested' ? '#fffbeb' : '#fef2f2',
                    border: `1px solid ${est.status === 'Approved' ? '#bbf7d0' : est.status === 'Revision Requested' ? '#fde68a' : '#fecaca'}`,
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: est.status === 'Approved' ? '#166534' : est.status === 'Revision Requested' ? '#92400e' : '#991b1b',
                      marginBottom: '2px'
                    }}>
                      Official Administrator Review by {est.reviewed_by_name || 'Admin'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      "{est.review_remarks}"
                    </div>
                  </div>
                )}

                {/* Scope & Methodology Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Observed Problem
                    </div>
                    <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                      {est.observed_problem}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Repair Methodology
                    </div>
                    <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                      {est.repair_method}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Duration & Officer
                    </div>
                    <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                      {est.estimated_duration_days} days • {est.submitted_by_name}
                    </div>
                  </div>
                </div>

                {/* Component Items Table */}
                <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '14px' }}>
                  <table className="data-table" style={{ fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        <th>Component Description</th>
                        <th style={{ width: '90px' }}>Quantity</th>
                        <th style={{ width: '90px' }}>Unit</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>Total (₹)</th>
                        <th>Vendor / Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td style={{ fontWeight: 500 }}>
                            {it.item_name}
                            {it.description && (
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {it.description}
                              </div>
                            )}
                          </td>
                          <td>{Number(it.quantity).toLocaleString()}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{it.unit}</td>
                          <td style={{ textAlign: 'right' }}>{Number(it.unit_cost).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {Number(it.total_cost).toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {it.proposed_vendor || it.quotation_ref ? (
                              <span>{it.proposed_vendor} {it.quotation_ref ? `(${it.quotation_ref})` : ''}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Breakdown */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                    <span>Subtotal: <strong>₹ {Number(est.subtotal).toLocaleString('en-IN')}</strong></span>
                    <span>Contingencies ({est.contingency_percent}%): <strong>₹ {Math.round(est.subtotal * (est.contingency_percent / 100)).toLocaleString('en-IN')}</strong></span>
                    <span>GST ({est.tax_percent}%): <strong>₹ {Math.round((Number(est.subtotal) + (est.subtotal * (est.contingency_percent / 100))) * (est.tax_percent / 100)).toLocaleString('en-IN')}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Total: ₹ {Number(est.total_estimated_cost).toLocaleString('en-IN')}
                    </div>

                    {/* Admin Action: Review Button */}
                    {isAdmin && est.status === 'Pending Review' && onReviewClick && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ background: '#0284c7', borderColor: '#0284c7' }}
                        onClick={() => onReviewClick(est)}
                      >
                        ⚖️ Review & Decide
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
