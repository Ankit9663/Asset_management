'use client';

/**
 * All Issues Page — List all maintenance issues with filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import IssueTable from '@/components/IssueTable';
import FilterBar from '@/components/FilterBar';

export default function IssuesPage() {
  const router = useRouter();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceData, setReferenceData] = useState(null);

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');

  // Fetch reference data once
  useEffect(() => {
    fetch('/api/reference')
      .then(r => r.json())
      .then(setReferenceData)
      .catch(console.error);
  }, []);

  // Fetch issues with filters
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (category) params.set('category', category);

      const res = await fetch(`/api/issues?${params.toString()}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error('Fetch issues error:', err);
    } finally {
      setLoading(false);
    }
  }, [status, priority, category]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const hasFilters = status || priority || category;

  const clearFilters = () => {
    setStatus('');
    setPriority('');
    setCategory('');
  };

  const filters = [
    {
      key: 'status',
      label: 'All Statuses',
      value: status,
      onChange: setStatus,
      options: (referenceData?.issueStatuses || []).map(s => ({ value: s, label: s })),
    },
    {
      key: 'priority',
      label: 'All Priorities',
      value: priority,
      onChange: setPriority,
      options: (referenceData?.issuePriorities || []).map(p => ({ value: p, label: p })),
    },
    {
      key: 'category',
      label: 'All Asset Categories',
      value: category,
      onChange: setCategory,
      options: (referenceData?.assetCategories || []).map(c => ({ value: c, label: c })),
    },
  ];

  return (
    <div id="issues-page" className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Issues</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${issues.length} issue${issues.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onClear={clearFilters}
        showClear={!!hasFilters}
      />

      <IssueTable
        issues={issues}
        onRowClick={(issueId, assetId) => router.push(`/assets/${assetId}?issue=${issueId}`)}
        showAsset={true}
        loading={loading}
      />
    </div>
  );
}
