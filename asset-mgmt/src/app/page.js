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
      <div className="grid-stats">
        <StatCard
          icon="📊"
          label="Total Assets"
          value={d.totalAssets ?? 0}
          subtext="Across 33 Gujarat districts"
          accent="#2563eb"
          accentBg="#eff6ff"
          onClick={() => router.push('/assets')}
        />
        <StatCard
          icon="🛣️"
          label="Roads"
          value={d.byCategory?.Road ?? 0}
          subtext="State highways & MDRs"
          accent="#6366f1"
          accentBg="#eef2ff"
          onClick={() => router.push('/assets?category=Road')}
        />
        <StatCard
          icon="🌉"
          label="Bridges"
          value={d.byCategory?.Bridge ?? 0}
          subtext="River crossings & flyovers"
          accent="#0284c7"
          accentBg="#f0f9ff"
          onClick={() => router.push('/assets?category=Bridge')}
        />
        <StatCard
          icon="🏛️"
          label="Buildings"
          value={d.byCategory?.Building ?? 0}
          subtext="Civic & admin complexes"
          accent="#d97706"
          accentBg="#fffbeb"
          onClick={() => router.push('/assets?category=Building')}
        />
        <StatCard
          icon="⚠️"
          label="Critical / Poor"
          value={d.poorCriticalAssets ?? 0}
          subtext="Requires immediate inspection"
          accent="#dc2626"
          accentBg="#fef2f2"
          onClick={() => router.push('/assets?condition=Critical')}
        />
        <StatCard
          icon="🔧"
          label="Open Issues"
          value={d.openIssues ?? 0}
          subtext="Active maintenance tickets"
          accent="#ea580c"
          accentBg="#fff7ed"
          onClick={() => router.push('/issues')}
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
