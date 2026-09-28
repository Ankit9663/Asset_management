'use client';

/**
 * AdminEstimateReviewModal Component
 * Interactive modal for Department Administrator to officially review,
 * approve, request revision, or reject maintenance estimates.
 */

import { useState } from 'react';
import Modal from './Modal';

export default function AdminEstimateReviewModal({
  isOpen,
  onClose,
  issue,
  estimate,
  onReviewSubmit,
}) {
  const [decision, setDecision] = useState('Approve');
  const [approvedAmount, setApprovedAmount] = useState(
    estimate?.total_estimated_cost ? Number(estimate.total_estimated_cost) : 0
  );
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!estimate || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if ((decision === 'Request Revision' || decision === 'Reject') && !remarks.trim()) {
      setError(`Official remarks are required when choosing "${decision}".`);
      return;
    }

    if (decision === 'Approve' && (!approvedAmount || Number(approvedAmount) <= 0)) {
      setError('Approved financial amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/estimates/${estimate.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          remarks: remarks.trim() || 'Approved as submitted.',
          approvedAmount: decision === 'Approve' ? Number(approvedAmount) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit review.');
      }

      onReviewSubmit(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Administrative Review — Estimate ${estimate.id} (v${estimate.version})`}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${decision === 'Approve' ? 'btn-primary' : decision === 'Request Revision' ? 'btn-secondary' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={submitting}
            style={decision === 'Request Revision' ? { background: '#f59e0b', color: '#ffffff', borderColor: '#d97706' } : {}}
          >
            {submitting ? (
              <>
                <span className="loading-spinner loading-spinner-sm" style={{ marginRight: '6px' }} />
                Submitting Decision...
              </>
            ) : (
              `Confirm: ${decision}`
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Estimate Details Overview */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div>
              <span className="text-tertiary">Issue ID:</span>{' '}
              <strong className="text-primary">{issue.id}</strong>
            </div>
            <div>
              <span className="text-tertiary">Submitted By:</span>{' '}
              <strong className="text-primary">{estimate.submitted_by_name}</strong>
            </div>
            <div>
              <span className="text-tertiary">Components:</span>{' '}
              <strong className="text-primary">{estimate.items?.length || 0} line items</strong>
            </div>
            <div>
              <span className="text-tertiary">Proposed Total:</span>{' '}
              <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                ₹ {Number(estimate.total_estimated_cost).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Decision Selector */}
        <div className="form-group">
          <label className="form-label">Administrative Decision</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { key: 'Approve', label: 'Approve', icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
              { key: 'Request Revision', label: 'Revise', icon: '🔄', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
              { key: 'Reject', label: 'Reject', icon: '❌', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            ].map((opt) => {
              const isSelected = decision === opt.key;
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setDecision(opt.key)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                    background: isSelected ? opt.bg : '#ffffff',
                    color: isSelected ? opt.color : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{opt.icon}</div>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Approved Amount (Only if Approve) */}
        {decision === 'Approve' && (
          <div className="form-group">
            <label className="form-label">Authorized Budget Allocation (₹)</label>
            <input
              type="number"
              min={1}
              step="any"
              className="form-input"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Pre-filled with estimated cost. Adjust if approving a capped or modified figure.
            </span>
          </div>
        )}

        {/* Remarks / Review Notes */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Official Remarks / Review Feedback{' '}
            {decision !== 'Approve' && <span style={{ color: 'red' }}>*</span>}
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder={
              decision === 'Approve'
                ? 'Optional approval comments or directives to executing officer...'
                : decision === 'Request Revision'
                ? 'Specify required revisions (e.g. reduce asphalt overlay thickness, re-negotiate vendor rates)...'
                : 'State clear administrative reason for rejection...'
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required={decision !== 'Approve'}
          />
        </div>
      </form>
    </Modal>
  );
}
