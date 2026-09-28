'use client';

/**
 * AssetForm — Create or Edit asset form with category-driven dynamic fields.
 * 
 * Props:
 *   initialData — asset data for editing (null for create)
 *   onSubmit    — callback(formData) → returns promise
 *   isEdit      — boolean, if true category is locked
 *   loading     — submit in progress
 */

import { useState, useEffect } from 'react';

const CATEGORIES = ['Road', 'Bridge', 'Building'];

const CATEGORY_ICONS = {
  'Road': '🛣️',
  'Bridge': '🌉',
  'Building': '🏛️',
};

export default function AssetForm({ initialData, onSubmit, isEdit = false, loading = false, referenceData }) {
  const [step, setStep] = useState(initialData ? 2 : 1);
  const [formData, setFormData] = useState({
    category: initialData?.category || '',
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

  // Parse details if it's a string
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
    setFormData(prev => ({ ...prev, category: cat, type: '', details: {} }));
    setStep(2);
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

  // Step 1: Category Selection
  if (step === 1 && !isEdit) {
    return (
      <div id="asset-form-step-1">
        <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
          Select Asset Category
        </h3>
        <div className="grid-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="card-glass"
              onClick={() => selectCategory(cat)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '32px 24px',
                transition: 'all 0.2s',
              }}
              id={`category-select-${cat.toLowerCase()}`}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                {CATEGORY_ICONS[cat]}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {cat}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {cat === 'Road' && 'Highways, district roads, city roads'}
                {cat === 'Bridge' && 'Bridges, flyovers, culverts'}
                {cat === 'Building' && 'Offices, schools, facilities'}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Full form
  return (
    <form onSubmit={handleSubmit} id="asset-form">
      {/* Errors */}
      {errors.length > 0 && (
        <div style={{
          background: 'var(--color-poor-bg)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
        }}>
          {errors.map((e, i) => (
            <div key={i} style={{ color: 'var(--color-poor)', fontSize: '13px' }}>• {e}</div>
          ))}
        </div>
      )}

      {/* Category indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span className={`badge badge-${formData.category.toLowerCase()}`} style={{ fontSize: '14px', padding: '6px 14px' }}>
          {CATEGORY_ICONS[formData.category]} {formData.category}
        </span>
        {!isEdit && (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => setStep(1)}
            style={{ padding: '4px 8px' }}
          >
            Change
          </button>
        )}
        {isEdit && <span className="text-tertiary text-sm">(Category is locked)</span>}
      </div>

      {/* Common fields */}
      <div className="form-section" style={{ marginBottom: '20px' }}>
        <div className="form-section-title">Basic Information</div>

        <div className="form-group">
          <label className="form-label">Asset Name <span className="required">*</span></label>
          <input
            className="form-input"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter asset name"
            required
            id="asset-name-input"
          />
        </div>

        <div className="form-row">
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

        <div className="form-row">
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
            <label className="form-label">Condition</label>
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

        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            className="form-input"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Street address or landmark"
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

      {/* Category-specific details */}
      {assetDetailFields.length > 0 && (
        <div className="form-section" style={{ marginBottom: '20px' }}>
          <div className="form-section-title">{formData.category} Details</div>
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

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading} id="asset-form-submit">
          {loading && <span className="loading-spinner loading-spinner-sm" />}
          {isEdit ? 'Save Changes' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
}
