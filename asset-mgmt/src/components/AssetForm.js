'use client';

/**
 * AssetForm — Modern Enterprise Light Theme Asset Creation & Editing.
 * Features compact segmented category selection and high-legibility inputs.
 * 
 * Props:
 *   initialData   — asset data for editing (null for create)
 *   onSubmit      — callback(formData) → returns promise
 *   isEdit        — boolean, if true category is locked
 *   loading       — submit in progress
 *   referenceData — system reference constants
 */

import { useState, useEffect } from 'react';

const CATEGORIES = ['Road', 'Bridge', 'Building'];

const CATEGORY_ICONS = {
  'Road': '🛣️',
  'Bridge': '🌉',
  'Building': '🏛️',
};

export default function AssetForm({ initialData, onSubmit, isEdit = false, loading = false, referenceData }) {
  const [formData, setFormData] = useState({
    category: initialData?.category || 'Road',
    type: initialData?.type || '',
    name: initialData?.name || '',
    district: initialData?.district || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    divisionId: initialData?.division_id || '',
    condition: initialData?.condition || 'Good',
    details: initialData?.details || {},
  });
  const [errors, setErrors] = useState([]);

  // Parse details if string
  useEffect(() => {
    if (initialData?.details && typeof initialData.details === 'string') {
      try {
        setFormData(prev => ({ ...prev, details: JSON.parse(initialData.details) }));
      } catch (e) { /* ignore */ }
    }
  }, [initialData]);

  const ref = referenceData || {};
  const assetTypes = ref.assetTypes?.[formData.category] || [];
  const assetDetailFields = ref.assetDetailFields?.[formData.category] || [];
  const districts = ref.districts || [];
  const divisions = ref.divisions || [];
  const conditions = ref.assetConditions || ['Good', 'Fair', 'Poor', 'Critical'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const updateDetail = (key, value) => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [key]: value },
    }));
  };

  const selectCategory = (cat) => {
    if (isEdit || cat === formData.category) return;
    setFormData(prev => ({ ...prev, category: cat, type: '', details: {} }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors([err.message || 'Failed to save asset.']);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="asset-form">
      {/* Error banner */}
      {errors.length > 0 && (
        <div style={{
          background: 'var(--color-poor-bg)',
          border: '1px solid var(--color-poor-border)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
        }}>
          {errors.map((e, i) => (
            <div key={i} style={{ color: 'var(--color-poor)', fontSize: '13px', fontWeight: 500 }}>
              • {e}
            </div>
          ))}
        </div>
      )}

      {/* ─── Compact Segmented Category Selection ─── */}
      <div style={{ marginBottom: '24px' }}>
        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
          Asset Category {isEdit ? <span className="text-muted" style={{ fontWeight: 400 }}>(Locked after creation)</span> : <span className="required">*</span>}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = formData.category === cat;
            return (
              <button
                key={cat}
                type="button"
                disabled={isEdit}
                onClick={() => selectCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: isEdit ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                }}
                id={`category-select-${cat.toLowerCase()}`}
              >
                <span style={{ fontSize: '22px' }}>{CATEGORY_ICONS[cat]}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', lineHeight: 1.2 }}>{cat}</div>
                  <div style={{ fontSize: '11px', color: isSelected ? 'var(--color-primary)' : 'var(--text-tertiary)', marginTop: '2px' }}>
                    {cat === 'Road' && 'Highways, MDRs'}
                    {cat === 'Bridge' && 'Bridges, Flyovers'}
                    {cat === 'Building' && 'Offices, Facilities'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Core Information ─── */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
        <div className="card-title">Basic Information</div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Asset Name <span className="required">*</span></label>
          <input
            className="form-input"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g. Ahmedabad-Vadodara Expressway"
            required
            id="asset-name-input"
          />
        </div>

        <div className="form-row" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Type <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value)}
              required
              id="asset-type-select"
            >
              <option value="">Select type</option>
              {assetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">District <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.district}
              onChange={(e) => updateField('district', e.target.value)}
              required
              id="asset-district-select"
            >
              <option value="">Select district</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Division <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.divisionId}
              onChange={(e) => updateField('divisionId', e.target.value)}
              required
              id="asset-division-select"
            >
              <option value="">Select division</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Condition</label>
            <select
              className="form-select"
              value={formData.condition}
              onChange={(e) => updateField('condition', e.target.value)}
              id="asset-condition-select"
            >
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Address / Location Description</label>
          <input
            className="form-input"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="e.g. NH-48 via Paddhari junction"
            id="asset-address-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              className="form-input"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => updateField('latitude', e.target.value)}
              placeholder="e.g. 23.0225"
              id="asset-lat-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              className="form-input"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => updateField('longitude', e.target.value)}
              placeholder="e.g. 72.5714"
              id="asset-lng-input"
            />
          </div>
        </div>
      </div>

      {/* ─── Category-Specific Details ─── */}
      {assetDetailFields.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
          <div className="card-title">{formData.category} Specifications</div>
          <div className="form-row">
            {assetDetailFields.map((field) => (
              <div className="form-group" key={field.key}>
                <label className="form-label">
                  {field.label}
                  {field.required && <span className="required"> *</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="form-select"
                    value={formData.details[field.key] || ''}
                    onChange={(e) => updateDetail(field.key, e.target.value)}
                    required={field.required}
                    id={`detail-${field.key}`}
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    min={field.min}
                    value={formData.details[field.key] || ''}
                    onChange={(e) => updateDetail(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                    id={`detail-${field.key}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading} id="asset-form-submit">
          {loading && <span className="loading-spinner loading-spinner-sm" />}
          {isEdit ? 'Save Changes' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
}
