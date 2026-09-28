'use client';

/**
 * SubmitCompletionModal Component
 * Allows executing maintenance officer to submit completion reports,
 * itemized actual costs, and variance justification for administrative verification.
 */

import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function SubmitCompletionModal({
  isOpen,
  onClose,
  issue,
  onCompletionSubmitted,
}) {
  const approvedBudget = Number(issue?.approved_amount || 0);

  const [actualCompletionDate, setActualCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [completionNotes, setCompletionNotes] = useState('');
  const [varianceReason, setVarianceReason] = useState('');
  const [actualItems, setActualItems] = useState([
    {
      itemName: 'Executed Maintenance Work',
      actualQuantity: 1,
      actualUnitCost: approvedBudget > 0 ? approvedBudget : 0,
      actualTotal: approvedBudget > 0 ? approvedBudget : 0,
      actualVendor: '',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Recalculate total actual cost
  const totalActualCost = actualItems.reduce(
    (sum, it) => sum + (Number(it.actualTotal) || 0),
    0
  );

  const variance = Math.round((totalActualCost - approvedBudget) * 100) / 100;
  const isOverrun = variance > 100;
  const isSavings = variance < -100;

  const handleItemChange = (index, field, value) => {
    setActualItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'actualQuantity' || field === 'actualUnitCost') {
        const qty = Number(field === 'actualQuantity' ? value : item.actualQuantity) || 0;
        const rate = Number(field === 'actualUnitCost' ? value : item.actualUnitCost) || 0;
        item.actualTotal = Math.round(qty * rate * 100) / 100;
      }
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setActualItems((prev) => [
      ...prev,
      {
        itemName: '',
        actualQuantity: 1,
        actualUnitCost: 0,
        actualTotal: 0,
        actualVendor: '',
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (actualItems.length <= 1) return;
    setActualItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!completionNotes.trim()) {
      setError('Please provide completion resolution notes.');
      return;
    }

    if (isOverrun && !varianceReason.trim()) {
      setError('Please provide an official justification for the cost overrun variance.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCompletionDate: new Date(actualCompletionDate).toISOString(),
          actualExpenditure: totalActualCost,
          actualItems,
          completionNotes: completionNotes.trim(),
          varianceReason: varianceReason.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to submit completion.');

      onCompletionSubmitted(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!issue) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Work Order Completion — ${issue.id}`}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#15803d' }}
            onClick={handleSubmit}
            disabled={submitting || totalActualCost <= 0}
          >
            {submitting ? 'Submitting Completion...' : 'Submit for Verification'}
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

        {/* Budget Comparison Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Sanctioned Budget
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              ₹ {approvedBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Total Actual Spend
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
              ₹ {totalActualCost.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Budget Variance
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              marginTop: '2px',
              color: isOverrun ? '#dc2626' : isSavings ? '#16a34a' : 'var(--text-primary)'
            }}>
              {isOverrun && `+ ₹ ${variance.toLocaleString('en-IN')} (Overrun)`}
              {isSavings && `- ₹ ${Math.abs(variance).toLocaleString('en-IN')} (Savings)`}
              {!isOverrun && !isSavings && '₹ 0 (Exact match)'}
            </div>
          </div>
        </div>

        {/* Date & Contractor Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Actual Completion Date</label>
            <input
              type="date"
              className="form-input"
              value={actualCompletionDate}
              onChange={(e) => setActualCompletionDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Itemized Actual Invoices */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              🧾 Actual Expenditure Invoices & Itemized Costs
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItemRow}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              + Add Item
            </button>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {actualItems.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 2fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: '#fafafa',
                  borderRadius: '4px',
                  border: '1px solid #f1f5f9'
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 6px' }}
                  placeholder="Component / Work Description"
                  value={it.itemName}
                  onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                  required
                />
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 6px' }}
                  placeholder="Qty"
                  value={it.actualQuantity}
                  onChange={(e) => handleItemChange(idx, 'actualQuantity', e.target.value)}
                  required
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 6px' }}
                  placeholder="Unit Rate"
                  value={it.actualUnitCost}
                  onChange={(e) => handleItemChange(idx, 'actualUnitCost', e.target.value)}
                  required
                />
                <div style={{ fontSize: '12px', fontWeight: 600, textAlign: 'right', paddingRight: '4px' }}>
                  ₹ {Number(it.actualTotal || 0).toLocaleString('en-IN')}
                </div>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                  placeholder="Vendor / Invoice Ref"
                  value={it.actualVendor}
                  onChange={(e) => handleItemChange(idx, 'actualVendor', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', padding: '2px 4px', fontSize: '12px' }}
                  disabled={actualItems.length <= 1}
                  onClick={() => removeItemRow(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Overrun Justification (Mandatory if Overrun) */}
        {isOverrun && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#92400e' }}>
              ⚠️ Cost Overrun Justification <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              style={{ borderColor: '#f59e0b', background: '#fffbeb' }}
              placeholder="State technical reason for expenditure exceeding approved estimate (e.g. additional subgrade stabilization, unexpected utility rerouting)..."
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              required={isOverrun}
            />
          </div>
        )}

        {/* Completion Notes */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Work Resolution & Quality Notes <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Document how the repair work was executed, materials tested, traffic reinstated, or physical defects resolved..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
