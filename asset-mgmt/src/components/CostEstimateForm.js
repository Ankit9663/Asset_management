'use client';

/**
 * CostEstimateForm Component
 * Dynamic multi-item cost estimation form with automatic subtotal,
 * contingency (5%), tax (18%), and proposed vendor inputs.
 */

import { useState } from 'react';

const COMMON_UNITS = [
  'sq m',
  'metric ton',
  'cum',
  'meter',
  'nos',
  'lump sum',
  'hours',
  'bags',
  'kg',
];

export default function CostEstimateForm({
  issue,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [observedProblem, setObservedProblem] = useState(issue?.description || '');
  const [probableCause, setProbableCause] = useState('');
  const [repairMethod, setRepairMethod] = useState('');
  const [estimatedDurationDays, setEstimatedDurationDays] = useState(7);
  const [contingencyPercent, setContingencyPercent] = useState(5);
  const [taxPercent, setTaxPercent] = useState(18);

  const [items, setItems] = useState([
    {
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'sq m',
      unitCost: 0,
      proposedVendor: '',
      vendorContact: '',
      quotationRef: '',
    },
  ]);

  const [error, setError] = useState(null);

  // Line item manipulation
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'sq m',
        unitCost: 0,
        proposedVendor: '',
        vendorContact: '',
        quotationRef: '',
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.unitCost) || 0;
    return sum + (qty * rate);
  }, 0);

  const contingencyAmount = Math.round((calculatedSubtotal * (Number(contingencyPercent) / 100)) * 100) / 100;
  const taxableAmount = calculatedSubtotal + contingencyAmount;
  const taxAmount = Math.round((taxableAmount * (Number(taxPercent) / 100)) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!observedProblem.trim()) {
      setError('Please provide observed problem description.');
      return;
    }
    if (!repairMethod.trim()) {
      setError('Please specify proposed repair method & engineering specifications.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        setError(`Item #${i + 1} requires a valid item description.`);
        return;
      }
      if (Number(items[i].quantity) <= 0 || Number(items[i].unitCost) <= 0) {
        setError(`Item #${i + 1} (${items[i].itemName || 'unnamed'}) must have quantity > 0 and unit rate > 0.`);
        return;
      }
    }

    try {
      await onSubmit({
        observedProblem: observedProblem.trim(),
        probableCause: probableCause.trim() || null,
        repairMethod: repairMethod.trim(),
        estimatedDurationDays: Number(estimatedDurationDays) || 7,
        contingencyPercent: Number(contingencyPercent) || 5,
        taxPercent: Number(taxPercent) || 18,
        items,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit estimate.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Scope Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">
            Observed Distress / Problem Statement <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            value={observedProblem}
            onChange={(e) => setObservedProblem(e.target.value)}
            placeholder="Detailed engineering description of structural distress or failure..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Probable Cause of Defect</label>
          <input
            type="text"
            className="form-input"
            value={probableCause}
            onChange={(e) => setProbableCause(e.target.value)}
            placeholder="e.g. Heavy monsoon traffic, poor drainage, thermal fatigue..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Estimated Execution Duration (Days)</label>
          <input
            type="number"
            min={1}
            max={365}
            className="form-input"
            value={estimatedDurationDays}
            onChange={(e) => setEstimatedDurationDays(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">
            Proposed Repair Methodology & Specs <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            value={repairMethod}
            onChange={(e) => setRepairMethod(e.target.value)}
            placeholder="Detailed procedure: milling depth, tack coat grade, concrete mix design, curing protocol..."
            required
          />
        </div>
      </div>

      {/* Component-Wise Line Items */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
            📐 Bill of Quantities / Component-Wise Line Items
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={addItemRow}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            + Add Line Item
          </button>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((it, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1fr 1.5fr 1.5fr auto',
                gap: '8px',
                alignItems: 'center',
                padding: '8px',
                background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                borderRadius: '6px',
                border: '1px solid #f1f5f9'
              }}
            >
              <div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Item Name (e.g. Bituminous Tack Coat)"
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                  value={it.itemName}
                  onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  className="form-input"
                  placeholder="Qty"
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                  value={it.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  required
                />
              </div>

              <div>
                <select
                  className="form-select"
                  style={{ fontSize: '12px', padding: '6px 4px' }}
                  value={it.unit}
                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                >
                  {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="form-input"
                  placeholder="Rate (₹)"
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                  value={it.unitCost}
                  onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                  required
                />
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', paddingRight: '4px' }}>
                ₹ {((Number(it.quantity) || 0) * (Number(it.unitCost) || 0)).toLocaleString('en-IN')}
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', padding: '4px 6px', fontSize: '14px' }}
                  disabled={items.length <= 1}
                  onClick={() => removeItemRow(idx)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>

              {/* Vendor & Quotation Reference (Optional row) */}
              <div style={{ gridColumn: 'span 6', display: 'flex', gap: '8px', marginTop: '2px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 2 }}
                  placeholder="Proposed Contractor / Supplier Name"
                  value={it.proposedVendor}
                  onChange={(e) => handleItemChange(idx, 'proposedVendor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 1.5 }}
                  placeholder="Quotation / SOR Ref #"
                  value={it.quotationRef}
                  onChange={(e) => handleItemChange(idx, 'quotationRef', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Financial Calculation Box */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Base Works Subtotal:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ₹ {calculatedSubtotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Physical Contingencies:</span>
            <input
              type="number"
              min={0}
              max={25}
              style={{ width: '48px', padding: '2px 4px', fontSize: '12px' }}
              className="form-input"
              value={contingencyPercent}
              onChange={(e) => setContingencyPercent(e.target.value)}
            />
            <span>%</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ₹ {contingencyAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>GST / Statutory Taxes:</span>
            <input
              type="number"
              min={0}
              max={28}
              style={{ width: '48px', padding: '2px 4px', fontSize: '12px' }}
              className="form-input"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
            <span>%</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ₹ {taxAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{
          borderTop: '2px solid var(--border)',
          paddingTop: '8px',
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Total Proposed Estimate:
          </span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
            ₹ {grandTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || grandTotal <= 0}>
          {loading ? (
            <>
              <span className="loading-spinner loading-spinner-sm" style={{ marginRight: '6px' }} />
              Submitting Estimate...
            </>
          ) : (
            'Submit Estimate for Approval'
          )}
        </button>
      </div>
    </form>
  );
}
