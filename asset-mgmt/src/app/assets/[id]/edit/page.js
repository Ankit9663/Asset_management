'use client';

/**
 * Edit Asset Page — Pre-populated form with category locked.
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AssetForm from '@/components/AssetForm';
import { useToast } from '@/components/Toast';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const assetId = params.id;

  const [asset, setAsset] = useState(null);
  const [referenceData, setReferenceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assetRes, refRes] = await Promise.all([
          fetch(`/api/assets/${assetId}`),
          fetch('/api/reference'),
        ]);

        const assetData = await assetRes.json();
        const refData = await refRes.json();

        if (!assetRes.ok) {
          toast.error('Asset not found', assetData.error);
          router.push('/assets');
          return;
        }

        // Parse details if string
        const a = assetData.asset;
        if (a.details && typeof a.details === 'string') {
          a.details = JSON.parse(a.details);
        }

        setAsset(a);
        setReferenceData(refData);
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Error', 'Failed to load asset.');
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, [assetId, router, toast]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw { errors: data.errors || [data.error || 'Failed to update asset.'] };
      }

      toast.success('Asset Updated', `${data.asset.id} — Changes saved.`);
      router.push(`/assets/${assetId}`);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  if (pageLoading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <span>Loading asset...</span>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div id="edit-asset-page" className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Asset</h1>
          <p className="page-subtitle">
            {asset.id} — {asset.name}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => router.push(`/assets/${assetId}`)}>
            ← Back to Detail
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <AssetForm
          initialData={asset}
          onSubmit={handleSubmit}
          isEdit={true}
          loading={loading}
          referenceData={referenceData}
        />
      </div>
    </div>
  );
}
