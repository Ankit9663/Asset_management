'use client';

/**
 * IssueForm — Report a new issue against an asset.
 * 
 * Props:
 *   assetId       — the target asset ID
 *   assetCategory — 'Road' | 'Bridge' | 'Building' (for filtering issue categories)
 *   onSubmit      — callback(formData) → returns promise
 *   onCancel      — close/cancel handler
 *   loading       — submit in progress
 *   issueCategories — ISSUE_CATEGORIES object from reference data
 *   officers       — array of officer objects for assignment
 */

import { useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function IssueForm({
  assetId,
  assetCategory,
  onSubmit,
  onCancel,
  loading = false,
  issueCategories = {},
  officers = [],
}) {
  const [formData, setFormData] = useState({
    assetId,
    issueCategory: '',
    description: '',
    priority: 'Medium',
    assignedTo: '',
  });
  const [errors, setErrors] = useState([]);

  const categories = issueCategories[assetCategory] || [];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Client-side pre-validation
    const clientErrors = [];
    if (!formData.issueCategory) clientErrors.push('Issue category is required.');
    if (!formData.description.trim()) clientErrors.push('Description is required.');
    if (formData.issueCategory?.startsWith('Other') && formData.description.trim().length < 20) {
      clientErrors.push('For "Other" categories, description must be at least 20 characters.');
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors([err.message || 'Failed to report issue.']);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="issue-form">
      {errors.length > 0 && (
        <div style={{
          background: 'var(--color-poor-bg)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          {errors.map((e, i) => (
            <div key={i} style={{ color: 'var(--color-poor)', fontSize: '13px' }}>• {e}</div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Issue Category <span className="required">*</span></label>
        <select
          className="form-select"
          value={formData.issueCategory}
          onChange={(e) => updateField('issueCategory', e.target.value)}
          required
          id="issue-category-select"
        >
          <option value="">Select issue type</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ marginTop: '12px' }}>
        <label className="form-label">Description <span className="required">*</span></label>
        <textarea
          className="form-textarea"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe the issue in detail..."
          required
          id="issue-description-textarea"
        />
        {formData.issueCategory?.startsWith('Other') && (
          <span className="form-help">
            Minimum 20 characters required for "Other" categories
            ({formData.description.trim().length}/20)
          </span>
        )}
      </div>

      <div className="form-row" style={{ marginTop: '12px' }}>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            className="form-select"
            value={formData.priority}
            onChange={(e) => updateField('priority', e.target.value)}
            id="issue-priority-select"
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Assign Officer</label>
          <select
            className="form-select"
            value={formData.assignedTo}
            onChange={(e) => updateField('assignedTo', e.target.value)}
            id="issue-officer-select"
          >
            <option value="">Unassigned</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading} id="issue-form-submit">
          {loading && <span className="loading-spinner loading-spinner-sm" />}
          Report Issue
        </button>
      </div>
    </form>
  );
}
