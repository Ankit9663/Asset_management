'use client';

/**
 * Add Asset Page — Category selection then dynamic form.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AssetForm from '@/components/AssetForm';
import { useToast } from '@/components/Toast';

export default function NewAssetPage() {
  const router = useRouter();
  const toast = useToast();
  const [referenceData, setReferenceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/reference')
      .then(r => r.json())
      .then(setReferenceData)
      .catch(console.error);
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw { errors: data.errors || [data.error || 'Failed to create asset.'] };
      }

      toast.success('Asset Created', `${data.asset.id} — ${data.asset.name}`);
      router.push(`/assets/${data.asset.id}`);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  if (!referenceData) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <span>Loading form data...</span>
      </div>
    );
  }

  return (
    <div id="new-asset-page" className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Asset</h1>
          <p className="page-subtitle">Register a new road, bridge, or building asset</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => router.back()}>
            ← Back
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <AssetForm
          onSubmit={handleSubmit}
          loading={loading}
          referenceData={referenceData}
        />
      </div>
    </div>
  );
}
