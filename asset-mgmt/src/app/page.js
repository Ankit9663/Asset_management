'use client';

/**
 * Gujarat R&B Asset Management System — Executive Dashboard
 * Comprehensive enterprise analytics with live PostgreSQL aggregates:
 * - 7 Primary Infrastructure & Financial KPI Cards
 * - Administrative Sanction Quick-Action Banner
 * - 5 Live Visual Charts (Category Donut, Condition Stack, Category Spend, Lifecycle Funnel, Monthly Trend)
 * - Priority Attention Tickets & Recent Periodic Field Inspections
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import IssueTable from '@/components/IssueTable';
import ConditionBadge from '@/components/ConditionBadge';
import {
  CategoryDonutChart,
  ConditionDistributionBar,
  SpendByCategoryChart,
  IssueLifecycleFunnel,
  MonthlyTrendChart,
} from '@/components/DashboardCharts';
import { useUser } from '@/context/UserContext';

function formatCompactINR(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return '₹ 0';
  const num = Number(val);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} Lakh`;
  return `₹ ${num.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const dashRes = await fetch('/api/dashboard');
        const dashData = await dashRes.json();
        setDashboard(dashData);
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
        <span>Loading department analytics...</span>
      </div>
    );
  }

  const d = dashboard || {};
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div id="dashboard-page" className="page-enter">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Infrastructure & Operations Command Center</h1>
          <p className="page-subtitle">
            Gujarat Roads & Buildings Department — Statewide Asset & Maintenance Analytics
          </p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => router.push('/assets/new')}
              id="dashboard-add-asset"
            >
              ➕ Register New Asset
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/issues')}
            id="dashboard-view-issues"
          >
            🔧 Work Orders
          </button>
        </div>
      </div>

      {/* Administrative Sanctions Alert Banner (if pending actions exist) */}
      {(d.pendingAdminActions || 0) > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-xs)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚖️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
                Administrative Sanctions Pending Action ({d.pendingAdminActions})
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                {d.pendingEstimates || 0} cost estimate{d.pendingEstimates === 1 ? '' : 's'} awaiting budget approval • {d.pendingVerifications || 0} completed work order{d.pendingVerifications === 1 ? '' : 's'} awaiting closeout verification.
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              style={{ background: '#d97706', borderColor: '#b45309' }}
              onClick={() => router.push('/issues?status=Pending Approval')}
            >
              Review Pending Items →
            </button>
          )}
        </div>
      )}

      {/* 7 KPI Metric Cards */}
      <div className="grid-stats" style={{ marginBottom: '24px' }}>
        <StatCard
          icon="📊"
          label="Total Assets"
          value={d.totalAssets ?? 0}
          subtext={`${d.activeAssets ?? 0} Active • 33 Districts`}
          accent="#2563eb"
          accentBg="#eff6ff"
          onClick={() => router.push('/assets')}
        />
        <StatCard
          icon="🏛️"
          label="Capital Capex"
          value={formatCompactINR(d.totalCapex)}
          subtext="Audited Asset Valuation"
          accent="#0284c7"
          accentBg="#f0f9ff"
          onClick={() => router.push('/assets')}
        />
        <StatCard
          icon="💰"
          label="Maintenance Spend"
          value={formatCompactINR(d.totalMaintenanceSpend)}
          subtext="Completed Work Orders"
          accent="#16a34a"
          accentBg="#f0fdf4"
          onClick={() => router.push('/issues?status=Completed')}
        />
        <StatCard
          icon="🔧"
          label="Open Issues"
          value={d.openIssues ?? 0}
          subtext={`${d.issuesByStatus?.['In Progress'] || 0} Currently Executing`}
          accent="#ea580c"
          accentBg="#fff7ed"
          onClick={() => router.push('/issues')}
        />
        <StatCard
          icon="⏳"
          label="Pending Sanction"
          value={d.pendingAdminActions ?? 0}
          subtext={`${d.pendingEstimates || 0} Est. / ${d.pendingVerifications || 0} Verify`}
          accent="#d97706"
          accentBg="#fffbeb"
          onClick={() => router.push('/issues?status=Pending Approval')}
        />
        <StatCard
          icon="📋"
          label="Overdue Inspections"
          value={d.overdueInspections ?? 0}
          subtext="Next inspection date passed"
          accent="#8b5cf6"
          accentBg="#faf5ff"
          onClick={() => router.push('/assets')}
        />
        <StatCard
          icon="⚠️"
          label="Critical / Poor"
          value={d.poorCriticalAssets ?? 0}
          subtext="High distress priority"
          accent="#dc2626"
          accentBg="#fef2f2"
          onClick={() => router.push('/assets?condition=Critical')}
        />
      </div>

      {/* 5 Enterprise Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Chart 1: Category Distribution */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛣️</span> Asset Portfolio by Category
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-6px', marginBottom: '16px' }}>
            Proportion of state roads, bridges, and public civic buildings.
          </p>
          <CategoryDonutChart data={d.byCategory} />
        </div>

        {/* Chart 2: Condition Stack */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🩺</span> Fleet Structural Condition Distribution
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-6px', marginBottom: '16px' }}>
            Physical health ratings based on latest engineering field assessments.
          </p>
          <ConditionDistributionBar data={d.byCondition} />
        </div>

        {/* Chart 3: Maintenance Spend by Category */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💳</span> Maintenance Expenditure by Category
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-6px', marginBottom: '16px' }}>
            Total audited outlays spent across Roads, Bridges, and Buildings.
          </p>
          <SpendByCategoryChart data={d.spendByCategory} />
        </div>
      </div>

      {/* Lifecycle Funnel & Monthly Trend Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Chart 4: Lifecycle Funnel */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> Issue Lifecycle Funnel
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-6px', marginBottom: '10px' }}>
            Active tickets across the 6 maintenance lifecycle stages.
          </p>
          <IssueLifecycleFunnel data={d.issuesByStatus} />
        </div>

        {/* Chart 5: Monthly Spend Trend */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📈</span> Monthly Maintenance Expenditure Trend
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '-6px', marginBottom: '10px' }}>
            Verified actual maintenance disbursements over recent months.
          </p>
          <MonthlyTrendChart data={d.monthlySpend} />
        </div>
      </div>

      {/* Bottom Operational Feeds Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Urgent Attention Issues */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="card-title" style={{ margin: 0 }}>
              ⚡ High & Critical Priority Work Orders
            </div>
            <Link href="/issues?priority=Critical" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
              View All ({d.attentionIssues?.length || 0}) →
            </Link>
          </div>

          {d.attentionIssues && d.attentionIssues.length > 0 ? (
            <IssueTable
              issues={d.attentionIssues}
              onRowClick={(issueId, assetId) => router.push(`/assets/${assetId}?issue=${issueId}`)}
              showAsset={true}
            />
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon" style={{ width: '48px', height: '48px', fontSize: '22px' }}>✅</div>
              <p className="empty-state-title" style={{ fontSize: '14px' }}>All Clear!</p>
              <p className="empty-state-description" style={{ fontSize: '13px' }}>No critical distress tickets require attention.</p>
            </div>
          )}
        </div>

        {/* Recent Periodic Inspections */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="card-title" style={{ margin: 0 }}>
              📋 Recent Periodic Field Inspections
            </div>
            <Link href="/assets" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Asset Registry →
            </Link>
          </div>

          {d.recentInspections && d.recentInspections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {d.recentInspections.map((insp) => (
                <div
                  key={insp.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => router.push(`/assets/${insp.asset_id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px'
                    }}>
                      {insp.asset_category === 'Road' ? '🛣️' : insp.asset_category === 'Bridge' ? '🌉' : '🏛️'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {insp.asset_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {insp.inspection_type} by {insp.inspector_name} • {new Date(insp.inspection_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ConditionBadge condition={insp.condition_assessment} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon" style={{ width: '48px', height: '48px', fontSize: '22px' }}>📋</div>
              <p className="empty-state-title" style={{ fontSize: '14px' }}>No Recent Inspections</p>
              <p className="empty-state-description" style={{ fontSize: '13px' }}>Completed inspections will show up here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
