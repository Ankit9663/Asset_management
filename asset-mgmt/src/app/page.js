'use client';

/**
 * Dashboard Page — Summary cards, attention issues, recent activity.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import IssueTable from '@/components/IssueTable';
import ActivityTimeline from '@/components/ActivityTimeline';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, actRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/activity?limit=15'),
        ]);
        const dashData = await dashRes.json();
        const actData = await actRes.json();
        setDashboard(dashData);
        setActivity(actData.activity || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const d = dashboard || {};

  return (
    <div id="dashboard-page" className="page-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Gujarat Roads & Buildings Department — Asset Overview</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => router.push('/assets/new')}
            id="dashboard-add-asset"
          >
            ➕ Add Asset
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats" style={{ marginBottom: '32px' }}>
        <StatCard
          icon="📊"
          label="Total Assets"
          value={d.totalAssets ?? 0}
          accent="var(--color-primary)"
          accentBg="var(--color-primary-glow)"
          onClick={() => router.push('/assets')}
        />
        <StatCard
          icon="🛣️"
          label="Roads"
          value={d.byCategory?.Road ?? 0}
          accent="var(--color-road)"
          accentBg="var(--color-road-bg)"
          onClick={() => router.push('/assets?category=Road')}
        />
        <StatCard
          icon="🌉"
          label="Bridges"
          value={d.byCategory?.Bridge ?? 0}
          accent="var(--color-bridge)"
          accentBg="var(--color-bridge-bg)"
          onClick={() => router.push('/assets?category=Bridge')}
        />
        <StatCard
          icon="🏛️"
          label="Buildings"
          value={d.byCategory?.Building ?? 0}
          accent="var(--color-building)"
          accentBg="var(--color-building-bg)"
          onClick={() => router.push('/assets?category=Building')}
        />
        <StatCard
          icon="🔧"
          label="Open Issues"
          value={d.openIssues ?? 0}
          accent="var(--color-open)"
          accentBg="var(--color-open-bg)"
          onClick={() => router.push('/issues')}
        />
        <StatCard
          icon="⚠️"
          label="Poor / Critical"
          value={d.poorCriticalAssets ?? 0}
          footer="Assets needing attention"
          accent="var(--color-poor)"
          accentBg="var(--color-poor-bg)"
          onClick={() => router.push('/assets?condition=Poor')}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid-2">
        {/* Issues Requiring Attention */}
        <div className="card">
          <div className="card-title">⚡ Issues Requiring Attention</div>
          {d.attentionIssues && d.attentionIssues.length > 0 ? (
            <IssueTable
              issues={d.attentionIssues}
              onRowClick={(issueId, assetId) => router.push(`/assets/${assetId}`)}
              showAsset={true}
            />
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon" style={{ width: '48px', height: '48px', fontSize: '22px' }}>✅</div>
              <p className="empty-state-title" style={{ fontSize: '14px' }}>All clear!</p>
              <p className="empty-state-description" style={{ fontSize: '13px' }}>No high-priority issues pending.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-title">📋 Recent Activity</div>
          <ActivityTimeline activities={activity} />
        </div>
      </div>
    </div>
  );
}
