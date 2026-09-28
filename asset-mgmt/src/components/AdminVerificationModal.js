'use client';

/**
 * AdminVerificationModal Component
 * Allows Department Administrator to conduct final administrative verification,
 * compare estimate vs actual variance, and officially close maintenance work orders.
 */

import { useState } from 'react';
import Modal from './Modal';

export default function AdminVerificationModal({
  isOpen,
  onClose,
  issue,
  onVerificationComplete,
}) {
  const [decision, setDecision] = useState('Verified');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!issue) return null;

  const approvedAmount = Number(issue.approved_amount || 0);
  const actualCost = Number(issue.actual_cost || 0);
  const variance = Number(issue.cost_variance || (actualCost - approvedAmount));
  const isOverrun = variance > 100;
  const isSavings = variance < -100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (decision === 'Rejected' && !remarks.trim()) {
      setError('Official audit remarks are required when rejecting completion.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          verificationRemarks: remarks.trim() || 'Work verified and approved according to department quality standards.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to verify completion.');

      onVerificationComplete(data);
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
      title={`Administrative Completion Verification — ${issue.id}`}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${decision === 'Verified' ? 'btn-primary' : 'btn-danger'}`}
            style={decision === 'Verified' ? { background: '#16a34a', borderColor: '#15803d' } : {}}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Processing Verification...' : `Confirm: ${decision === 'Verified' ? 'Verify & Close Order' : 'Reject Completion'}`}
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

        {/* Financial Variance Audit Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Approved Estimate
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              ₹ {approvedAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Actual Expenditure
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
              ₹ {actualCost.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Financial Variance
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              marginTop: '2px',
              color: isOverrun ? '#dc2626' : isSavings ? '#16a34a' : 'var(--text-primary)'
            }}>
              {isOverrun && `+ ₹ ${variance.toLocaleString('en-IN')} (Overrun)`}
              {isSavings && `- ₹ ${Math.abs(variance).toLocaleString('en-IN')} (Savings)`}
              {!isOverrun && !isSavings && 'Exact Match'}
            </div>
          </div>
        </div>

        {/* Cost Variance Justification (if any) */}
        {issue.variance_reason && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>
              Officer Variance Justification
            </div>
            <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
              "{issue.variance_reason}"
            </div>
          </div>
        )}

        {/* Resolution Notes Submitted */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Field Resolution Summary
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', background: '#fafafa', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid #f1f5f9' }}>
            {issue.resolution_notes || 'No resolution notes provided.'}
          </div>
        </div>

        {/* Verification Decision */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Official Verification Decision</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDecision('Verified')}
              style={{
                padding: '12px 10px',
                borderRadius: 'var(--radius)',
                border: `2px solid ${decision === 'Verified' ? '#16a34a' : 'var(--border)'}`,
                background: decision === 'Verified' ? '#f0fdf4' : '#ffffff',
                color: decision === 'Verified' ? '#166534' : 'var(--text-secondary)',
                fontWeight: decision === 'Verified' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>✅</div>
              Verify & Close Order
            </button>

            <button
              type="button"
              onClick={() => setDecision('Rejected')}
              style={{
                padding: '12px 10px',
                borderRadius: 'var(--radius)',
                border: `2px solid ${decision === 'Rejected' ? '#dc2626' : 'var(--border)'}`,
                background: decision === 'Rejected' ? '#fef2f2' : '#ffffff',
                color: decision === 'Rejected' ? '#991b1b' : 'var(--text-secondary)',
                fontWeight: decision === 'Rejected' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>❌</div>
              Demand Remediation
            </button>
          </div>
        </div>

        {/* Remarks */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Official Audit Remarks / Sign-off Comments{' '}
            {decision === 'Rejected' && <span style={{ color: 'red' }}>*</span>}
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder={
              decision === 'Verified'
                ? 'Optional sign-off remarks, quality inspection certificate ref, or closeout notes...'
                : 'Mandatory: Specify why the completed work does not satisfy specifications...'
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required={decision === 'Rejected'}
          />
        </div>
      </form>
    </Modal>
  );
}
