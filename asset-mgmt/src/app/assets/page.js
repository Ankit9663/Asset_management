'use client';

/**
 * Asset Inventory Page — List all assets with search, filters, and table.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AssetTable from '@/components/AssetTable';
import FilterBar from '@/components/FilterBar';

export default function AssetsPage() {
  return (
    <Suspense fallback={
      <div className="loading-page"><div className="loading-spinner" /><span>Loading...</span></div>
    }>
      <AssetsPageContent />
    </Suspense>
  );
}

function AssetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceData, setReferenceData] = useState(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  // Fetch reference data once
  useEffect(() => {
    fetch('/api/reference')
      .then(r => r.json())
      .then(setReferenceData)
      .catch(console.error);
  }, []);

  // Fetch assets with filters
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (district) params.set('district', district);
      if (condition) params.set('condition', condition);
      if (status) params.set('status', status);

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, district, condition, status]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(fetchAssets, 300);
    return () => clearTimeout(timeout);
  }, [fetchAssets]);

  const hasFilters = search || category || district || condition || status;

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setDistrict('');
    setCondition('');
    setStatus('');
  };

  const filters = [
    {
      key: 'category',
      label: 'All Categories',
      value: category,
      onChange: setCategory,
      options: (referenceData?.assetCategories || []).map(c => ({ value: c, label: c })),
    },
    {
      key: 'district',
      label: 'All Districts',
      value: district,
      onChange: setDistrict,
      options: (referenceData?.districts || []).map(d => ({ value: d, label: d })),
    },
    {
      key: 'condition',
      label: 'All Conditions',
      value: condition,
      onChange: setCondition,
      options: (referenceData?.assetConditions || []).map(c => ({ value: c, label: c })),
    },
    {
      key: 'status',
      label: 'All Statuses',
      value: status,
      onChange: setStatus,
      options: (referenceData?.assetStatuses || []).map(s => ({ value: s, label: s })),
    },
  ];

  return (
    <div id="assets-page" className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Inventory</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${assets.length} asset${assets.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => router.push('/assets/new')}
            id="assets-add-btn"
          >
            ➕ Add Asset
          </button>
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or ID..."
        filters={filters}
        onClear={clearFilters}
        showClear={!!hasFilters}
      />

      <AssetTable
        assets={assets}
        onRowClick={(id) => router.push(`/assets/${id}`)}
        loading={loading}
      />
    </div>
  );
}
