'use client';

/**
 * RecordInspectionModal Component
 * Interactive inspection logging with category-specific checklist questions,
 * condition ratings, defect logs, and next due date schedule.
 */

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { INSPECTION_TYPES, INSPECTION_CHECKLISTS, CONDITIONS } from '@/lib/constants';

export default function RecordInspectionModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}) {
  const [inspectionType, setInspectionType] = useState('Routine');
  const [conditionAssessment, setConditionAssessment] = useState('Good');
  const [observations, setObservations] = useState('');
  const [defectsIdentified, setDefectsIdentified] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [checklist, setChecklist] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize checklist items based on asset category
  useEffect(() => {
    if (asset?.category && INSPECTION_CHECKLISTS[asset.category]) {
      const items = INSPECTION_CHECKLISTS[asset.category];
      const initial = {};
      items.forEach((item) => {
        initial[item.key] = item.options[0]; // Default to best/standard option
      });
      setChecklist(initial);
    }

    // Default next inspection date: 6 months from today
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    setNextDueDate(sixMonthsLater.toISOString().split('T')[0]);
  }, [asset]);

  if (!asset) return null;

  const checklistItems = INSPECTION_CHECKLISTS[asset.category] || [];

  const handleChecklistChange = (key, value) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!observations.trim()) {
      setError('Please provide detailed field inspection observations.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          inspectionType,
          conditionAssessment,
          observations: observations.trim(),
          defectsIdentified: defectsIdentified.trim() || null,
          recommendedActions: recommendedActions.trim() || null,
          nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : null,
          checklist,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to record inspection.');
      }

      onSuccess(data.inspection);
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
      title={`Record Periodic Inspection — ${asset.name}`}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="loading-spinner loading-spinner-sm" style={{ marginRight: '6px' }} />
                Recording...
              </>
            ) : (
              'Save Official Inspection'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Inspection Type */}
          <div className="form-group">
            <label className="form-label">Inspection Type</label>
            <select
              className="form-select"
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
            >
              {INSPECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t} Inspection
                </option>
              ))}
            </select>
          </div>

          {/* Next Due Date */}
          <div className="form-group">
            <label className="form-label">Scheduled Next Due Date</label>
            <input
              type="date"
              className="form-input"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Condition Rating Selector */}
        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label">Overall Assessed Condition</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['Good', 'Fair', 'Poor', 'Critical'].map((c) => {
              const isSelected = conditionAssessment === c;
              let bg = '#f8fafc';
              let borderColor = 'var(--border)';
              let color = 'var(--text-primary)';

              if (isSelected) {
                if (c === 'Good') { bg = '#f0fdf4'; borderColor = '#22c55e'; color = '#15803d'; }
                if (c === 'Fair') { bg = '#fffbeb'; borderColor = '#f59e0b'; color = '#b45309'; }
                if (c === 'Poor') { bg = '#fef2f2'; borderColor = '#ef4444'; color = '#b91c1c'; }
                if (c === 'Critical') { bg = '#450a0a'; borderColor = '#991b1b'; color = '#ffffff'; }
              }

              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setConditionAssessment(c)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${borderColor}`,
                    background: bg,
                    color: color,
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  {c === 'Good' && '🟢 '}
                  {c === 'Fair' && '🟡 '}
                  {c === 'Poor' && '🟠 '}
                  {c === 'Critical' && '🔴 '}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Component Checklist */}
        {checklistItems.length > 0 && (
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              📋 {asset.category} Structural Checklist
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {checklistItems.map((item) => (
                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.label}
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                    value={checklist[item.key] || item.options[0]}
                    onChange={(e) => handleChecklistChange(item.key, e.target.value)}
                  >
                    {item.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observations */}
        <div className="form-group">
          <label className="form-label">
            Field Observations & Findings <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Document detailed findings, physical conditions observed, weather conditions, or general wear..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            required
          />
        </div>

        {/* Defects Identified */}
        <div className="form-group">
          <label className="form-label">
            Specific Defects / Distress Identified (Optional)
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="e.g. 5 potholes near km 12.4, 2mm cracks on pier 3, roof water ingress near staircase..."
            value={defectsIdentified}
            onChange={(e) => setDefectsIdentified(e.target.value)}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Note: Identifying defects allows 1-click conversion into an active maintenance issue.
          </span>
        </div>

        {/* Recommended Actions */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Recommended Maintenance Actions</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Schedule asphalt resurfacing, replace joint seals, repair plastering..."
            value={recommendedActions}
            onChange={(e) => setRecommendedActions(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
