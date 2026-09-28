'use client';

/**
 * InspectionTable Component
 * Renders periodic inspection history, checklist answers, defects, and issue conversion.
 */

import { useState } from 'react';
import ConditionBadge from './ConditionBadge';
import Modal from './Modal';

export default function InspectionTable({
  inspections = [],
  onCreateIssue,
  userCanManage = false,
}) {
  const [selectedInspection, setSelectedInspection] = useState(null);

  if (!inspections || inspections.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-primary)' }}>
          No Inspections Recorded Yet
        </h4>
        <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
          Periodic field inspections ensure preventive maintenance and structural safety.
        </p>
      </div>
    );
  }

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'Pre-Monsoon':
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
      case 'Post-Monsoon':
        return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
      case 'Emergency':
        return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
      case 'Special':
        return { background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
      default:
        return { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
    }
  };

  return (
    <div>
      <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Inspection ID</th>
              <th style={{ width: '110px' }}>Date</th>
              <th style={{ width: '130px' }}>Type</th>
              <th style={{ width: '140px' }}>Inspector</th>
              <th style={{ width: '110px' }}>Condition</th>
              <th>Observations & Defects</th>
              <th style={{ width: '120px' }}>Next Due</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((insp) => {
              const checklistData = typeof insp.checklist === 'string'
                ? JSON.parse(insp.checklist || '{}')
                : (insp.checklist || {});
              const hasChecklist = Object.keys(checklistData).length > 0;
              const hasDefects = Boolean(insp.defects_identified && insp.defects_identified.trim().length > 0);

              const formattedDate = insp.inspection_date
                ? new Date(insp.inspection_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              const formattedDue = insp.next_due_date
                ? new Date(insp.next_due_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              return (
                <tr key={insp.id}>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {insp.id}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{formattedDate}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        display: 'inline-block',
                        ...getTypeBadgeStyle(insp.inspection_type),
                      }}
                    >
                      {insp.inspection_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 500 }}>
                    {insp.inspector_name}
                  </td>
                  <td>
                    <ConditionBadge condition={insp.condition_assessment} />
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {insp.observations}
                    </div>
                    {hasDefects && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#dc2626',
                          background: '#fef2f2',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #fee2e2',
                          display: 'inline-block',
                          marginTop: '2px',
                        }}
                      >
                        ⚠️ <strong>Defects:</strong> {insp.defects_identified}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formattedDue}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {hasChecklist && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setSelectedInspection(insp)}
                          title="View category checklist results"
                        >
                          Checklist
                        </button>
                      )}
                      {hasDefects && userCanManage && onCreateIssue && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '3px 8px', fontSize: '11px', background: '#dc2626', borderColor: '#b91c1c' }}
                          onClick={() => onCreateIssue(insp)}
                          title="Convert defect finding into maintenance issue"
                        >
                          + Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Checklist View Modal */}
      {selectedInspection && (
        <Modal
          isOpen={Boolean(selectedInspection)}
          onClose={() => setSelectedInspection(null)}
          title={`Checklist Findings — ${selectedInspection.id}`}
          size="md"
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedInspection(null)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Conducted by <strong>{selectedInspection.inspector_name}</strong> on{' '}
                {new Date(selectedInspection.inspection_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <ConditionBadge condition={selectedInspection.condition_assessment} />
            </div>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)' }}>
              {selectedInspection.observations}
            </p>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '13px' }}>
              Standard Category Component Checklist
            </div>
            <div style={{ padding: '12px 14px' }}>
              {Object.entries(
                typeof selectedInspection.checklist === 'string'
                  ? JSON.parse(selectedInspection.checklist || '{}')
                  : (selectedInspection.checklist || {})
              ).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        val.includes('Severe') || val.includes('Failed') || val.includes('Heavy') || val.includes('Critical')
                          ? '#dc2626'
                          : val.includes('Moderate') || val.includes('Minor') || val.includes('Slow')
                          ? '#d97706'
                          : '#16a34a',
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedInspection.recommended_actions && (
            <div style={{ marginTop: '16px', background: '#eff6ff', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>
                Recommended Actions
              </div>
              <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
                {selectedInspection.recommended_actions}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
