'use client';

/**
 * MaintenanceProgressTracker Component
 * Visual work progress tracker with execution timeline, percentage indicator,
 * and quick update form for field maintenance officers.
 */

import { useState } from 'react';

export default function MaintenanceProgressTracker({
  issue,
  progressLogs = [],
  canManage = false,
  onProgressAdded,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [progressPercent, setProgressPercent] = useState(
    progressLogs.length > 0 ? progressLogs[0].progress_percent : 25
  );
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentPercent = progressLogs.length > 0
    ? progressLogs[0].progress_percent
    : (issue.status === 'Completed' ? 100 : issue.status === 'Awaiting Verification' ? 95 : issue.status === 'In Progress' ? 30 : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError('Please provide execution progress notes.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercent: Number(progressPercent),
          notes: notes.trim(),
          expectedCompletionDate: expectedDate ? new Date(expectedDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update progress.');

      setNotes('');
      setShowAddForm(false);
      if (onProgressAdded) onProgressAdded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '20px',
      background: '#ffffff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚧</span> Execution Progress & Field Updates
          </h4>
          <p className="text-secondary" style={{ fontSize: '12px', margin: '2px 0 0' }}>
            Active physical execution milestones logged by field officers.
          </p>
        </div>

        {canManage && issue.status !== 'Completed' && !showAddForm && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddForm(true)}
          >
            + Log Progress Update
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
          <span className="text-secondary">Physical Completion</span>
          <span style={{ color: currentPercent === 100 ? '#16a34a' : 'var(--color-primary)' }}>
            {currentPercent}%
          </span>
        </div>
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${currentPercent}%`,
            background: currentPercent === 100
              ? '#16a34a'
              : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Add Progress Update Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              Record Field Milestone
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAddForm(false)}
            >
              ✕ Cancel
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Cumulative Progress: <strong>{progressPercent}%</strong>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated Completion Date</label>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '12px', padding: '6px 8px' }}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Field Execution Notes <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              style={{ fontSize: '13px' }}
              placeholder="e.g. Completed milling on 400m stretch; contractor applying tack coat..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Post Progress Update'}
            </button>
          </div>
        </form>
      )}

      {/* Historical Progress Updates Timeline */}
      {progressLogs && progressLogs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {progressLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #f1f5f9',
                fontSize: '13px'
              }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: log.progress_percent === 100 ? '#dcfce7' : '#eff6ff',
                color: log.progress_percent === 100 ? '#15803d' : '#1d4ed8',
                padding: '3px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                {log.progress_percent}%
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {log.notes}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  By <strong>{log.officer_name}</strong> • {new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {log.expected_completion_date && (
                    <span> • Target: {new Date(log.expected_completion_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '4px 0' }}>
          No work progress updates posted yet.
        </div>
      )}
    </div>
  );
}
