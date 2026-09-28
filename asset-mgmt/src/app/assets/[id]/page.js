'use client';

/**
 * Asset Detail Page — Overview, category details, action buttons, issues, activity.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ConditionBadge from '@/components/ConditionBadge';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import IssueTable from '@/components/IssueTable';
import ActivityTimeline from '@/components/ActivityTimeline';
import Modal from '@/components/Modal';
import IssueForm from '@/components/IssueForm';
import AssetFinancialCard from '@/components/AssetFinancialCard';
import InspectionTable from '@/components/InspectionTable';
import RecordInspectionModal from '@/components/RecordInspectionModal';
import IssueDetailModal from '@/components/IssueDetailModal';
import MaintenanceHistoryTab from '@/components/MaintenanceHistoryTab';
import AssetLifecycleTimeline from '@/components/AssetLifecycleTimeline';
import { useToast } from '@/components/Toast';
import { useUser } from '@/context/UserContext';

const DETAIL_LABELS = {
  classification: 'Classification',
  startPoint: 'Start Point',
  endPoint: 'End Point',
  lengthKm: 'Length (km)',
  surfaceType: 'Surface Type',
  structureType: 'Structure Type',
  crossingType: 'Crossing Type',
  lengthM: 'Length (m)',
  buildingUse: 'Building Use',
  numberOfFloors: 'Number of Floors',
  areaSqM: 'Built-up Area (sq m)',
};

const CATEGORY_ICONS = { Road: '🛣️', Bridge: '🌉', Building: '🏛️' };

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const { currentUser } = useUser();
  const assetId = params.id;

  const [asset, setAsset] = useState(null);
  const [issues, setIssues] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [activity, setActivity] = useState([]);
  const [referenceData, setReferenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issues');

  // Modal states
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newCondition, setNewCondition] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [assetRes, issuesRes, activityRes, refRes, inspRes] = await Promise.all([
        fetch(`/api/assets/${assetId}`),
        fetch(`/api/assets/${assetId}/issues`),
        fetch(`/api/assets/${assetId}/activity`),
        fetch('/api/reference'),
        fetch(`/api/inspections?assetId=${assetId}`),
      ]);

      const assetData = await assetRes.json();
      const issuesData = await issuesRes.json();
      const activityData = await activityRes.json();
      const refData = await refRes.json();
      const inspData = await inspRes.json();

      if (!assetRes.ok) {
        toast.error('Asset not found', assetData.error);
        router.push('/assets');
        return;
      }

      setAsset(assetData.asset);
      setIssues(issuesData.issues || []);
      setActivity(activityData.activity || []);
      setReferenceData(refData);
      setInspections(inspData.inspections || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Error', 'Failed to load asset data.');
    } finally {
      setLoading(false);
    }
  }, [assetId, router, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Check URL query param for auto-opening specific issue (e.g. navigated from /issues)
  useEffect(() => {
    if (issues.length > 0 && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const targetIssueId = urlParams.get('issue');
      if (targetIssueId) {
        const target = issues.find(i => i.id === targetIssueId);
        if (target) {
          setSelectedIssue(target);
          setShowIssueDetailModal(true);
        }
      }
    }
  }, [issues]);

  // ─── Condition Update ──────────────────────────────────────
  const handleConditionUpdate = async () => {
    if (!newCondition) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/condition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: newCondition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Condition Updated', `Now: ${newCondition}`);
      setShowConditionModal(false);
      fetchAll();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Retire Asset ──────────────────────────────────────────
  const handleRetire = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/retire`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.warning) toast.warning('Asset Retired', data.warning);
      else toast.success('Asset Retired', data.message);
      setShowRetireModal(false);
      fetchAll();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Report Issue ──────────────────────────────────────────
  const handleIssueSubmit = async (formData) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw { errors: data.errors || [data.error] };
      toast.success('Issue Reported', `${data.issue.id} created`);
      setShowIssueModal(false);
      fetchAll();
    } catch (err) {
      setActionLoading(false);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Issue Actions ─────────────────────────────────────────
  const handleIssueAction = async (issueId, updates) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0] || data.error);
      toast.success('Issue Updated', data.issue?.status ? `Status: ${data.issue.status}` : 'Changes saved');
      setShowIssueDetailModal(false);
      setSelectedIssue(null);
      fetchAll();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateIssueFromInspection = async (insp) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inspections/${insp.id}/create-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success('Issue Generated', `${data.issue.id} created from inspection`);
      setActiveTab('issues');
      fetchAll();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openIssueDetail = (issueId) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
      setShowIssueDetailModal(true);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <span>Loading asset...</span>
      </div>
    );
  }

  if (!asset) return null;

  const details = typeof asset.details === 'string' ? JSON.parse(asset.details || '{}') : (asset.details || {});
  const openIssues = issues.filter(i => i.status !== 'Completed');
  const completedIssues = issues.filter(i => i.status === 'Completed');
  const conditions = referenceData?.assetConditions || ['Good', 'Fair', 'Poor', 'Critical'];

  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = currentUser?.role === 'VIEWER';
  const canManageCategory = isAdmin || (!isViewer && currentUser?.category === asset.category);

  // Compute next inspection status
  const nextDueDate = asset.last_inspection?.next_due_date ? new Date(asset.last_inspection.next_due_date) : null;
  const today = new Date();
  let inspectionStatus = 'Up to Date';
  let inspectionStatusBadge = 'good';
  if (nextDueDate) {
    const diffDays = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      inspectionStatus = `Overdue by ${Math.abs(diffDays)}d`;
      inspectionStatusBadge = 'critical';
    } else if (diffDays <= 15) {
      inspectionStatus = `Due in ${diffDays}d`;
      inspectionStatusBadge = 'fair';
    } else {
      inspectionStatus = 'Scheduled';
      inspectionStatusBadge = 'good';
    }
  } else if (inspections.length === 0) {
    inspectionStatus = 'Pending';
    inspectionStatusBadge = 'fair';
  }

  return (
    <div id="asset-detail-page" className="page-enter">
      {/* Breadcrumb Hierarchy */}
      <div className="breadcrumb">
        <Link href="/" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/assets" className="breadcrumb-link">Asset Inventory</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>{CATEGORY_ICONS[asset.category]}</span>
            <h1 className="page-title">{asset.name}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="text-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: '#eff6ff', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
              {asset.id}
            </span>
            <span className="text-muted">•</span>
            <span className={`badge badge-${asset.category?.toLowerCase()}`}>{asset.category}</span>
            <ConditionBadge condition={asset.condition} />
            <StatusBadge status={asset.status} />
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => router.push('/assets')}>
            ← Back
          </button>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => router.push(`/assets/${assetId}/edit`)} id="edit-asset-btn">
              ✏️ Edit
            </button>
          )}
          {canManageCategory && (
            <>
              <button className="btn btn-secondary" onClick={() => { setNewCondition(asset.condition); setShowConditionModal(true); }} id="update-condition-btn">
                🔄 Update Condition
              </button>
              <button className="btn btn-secondary" onClick={() => setShowInspectionModal(true)} id="record-inspection-btn">
                📋 Record Inspection
              </button>
            </>
          )}
          {asset.status !== 'Retired' && !isViewer && (
            <button className="btn btn-primary" onClick={() => setShowIssueModal(true)} id="report-issue-btn">
              🚨 Report Issue
            </button>
          )}
          {asset.status !== 'Retired' && isAdmin && (
            <button className="btn btn-danger" onClick={() => setShowRetireModal(true)} id="retire-asset-btn">
              🚫 Retire
            </button>
          )}
        </div>
      </div>

      {/* Recurring Issues Alert Banner */}
      {asset.recurring_issues && asset.recurring_issues.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
              Recurring Maintenance Incidents Detected
            </div>
            <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
              This asset has logged repeated maintenance issues in category:{' '}
              <strong>{asset.recurring_issues.map(r => `${r.issue_category} (${r.count}x)`).join(', ')}</strong>.
              A comprehensive engineering audit or structural refurbishment is recommended.
            </div>
          </div>
        </div>
      )}

      {/* Overview + Details + Inspection Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Overview */}
        <div className="card">
          <div className="card-title">Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <InfoItem label="Type" value={asset.type} />
            <InfoItem label="District" value={asset.district} />
            <InfoItem label="Division" value={asset.division_name} />
            <InfoItem label="Address" value={asset.address || '—'} />
            <InfoItem label="Latitude" value={asset.latitude ?? '—'} />
            <InfoItem label="Longitude" value={asset.longitude ?? '—'} />
            <InfoItem label="Created" value={formatDate(asset.created_at)} />
            <InfoItem label="Updated" value={formatDate(asset.updated_at)} />
          </div>
        </div>

        {/* Category Details */}
        <div className="card">
          <div className="card-title">{asset.category} Specifications</div>
          {Object.keys(details).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {Object.entries(details).map(([key, val]) => (
                <InfoItem key={key} label={DETAIL_LABELS[key] || key} value={val ?? '—'} />
              ))}
            </div>
          ) : (
            <p className="text-secondary">No category-specific details recorded.</p>
          )}
        </div>

        {/* Periodic Inspection Summary Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="card-title" style={{ margin: 0 }}>Inspection Status</div>
              <span className={`badge badge-${inspectionStatusBadge}`}>
                {inspectionStatus}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Last Inspected
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {asset.last_inspection?.inspection_date ? formatDate(asset.last_inspection.inspection_date) : 'Never'}
                </div>
                {asset.last_inspection && (
                  <div style={{ marginTop: '4px' }}>
                    <ConditionBadge condition={asset.last_inspection.condition_assessment} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Next Due Date
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {nextDueDate ? formatDate(nextDueDate) : 'Unscheduled'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Total Inspections: <strong>{inspections.length}</strong>
                </div>
              </div>
            </div>

            {asset.last_inspection && (
              <div style={{ fontSize: '12px', background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Latest Finding:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{asset.last_inspection.observations}</span>
              </div>
            )}
          </div>

          {canManageCategory && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
              onClick={() => setShowInspectionModal(true)}
            >
              📋 Record New Inspection
            </button>
          )}
        </div>
      </div>

      {/* Asset Financial & Lifecycle Overview Card */}
      <AssetFinancialCard asset={asset} />

      {/* Tabs: Issues / Periodic Inspections / Maintenance History / Lifecycle Timeline / Activity */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0', overflowX: 'auto' }}>
        <TabButton active={activeTab === 'issues'} onClick={() => setActiveTab('issues')} id="tab-issues">
          🔧 Issues ({issues.length})
        </TabButton>
        <TabButton active={activeTab === 'inspections'} onClick={() => setActiveTab('inspections')} id="tab-inspections">
          📋 Periodic Inspections ({inspections.length})
        </TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} id="tab-history">
          🏁 Maintenance History ({completedIssues.length})
        </TabButton>
        <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} id="tab-timeline">
          📜 Lifecycle Timeline
        </TabButton>
        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} id="tab-activity">
          🕒 Activity Log ({activity.length})
        </TabButton>
      </div>

      {activeTab === 'issues' && (
        <div>
          {openIssues.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Open / In Progress ({openIssues.length})
              </h3>
              <IssueTable issues={openIssues} showAsset={false} onRowClick={(id) => openIssueDetail(id)} />
            </div>
          )}
          {completedIssues.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Completed ({completedIssues.length})
              </h3>
              <IssueTable issues={completedIssues} showAsset={false} onRowClick={(id) => openIssueDetail(id)} />
            </div>
          )}
          {issues.length === 0 && (
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-icon" style={{ width: '48px', height: '48px', fontSize: '22px' }}>✅</div>
              <h3 className="empty-state-title" style={{ fontSize: '14px' }}>No issues reported</h3>
              <p className="empty-state-description" style={{ fontSize: '13px' }}>This asset has no maintenance issues.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inspections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
              Periodic Inspection Records ({inspections.length})
            </h3>
            {canManageCategory && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowInspectionModal(true)}
              >
                + Record Inspection
              </button>
            )}
          </div>
          <InspectionTable
            inspections={inspections}
            onCreateIssue={handleCreateIssueFromInspection}
            userCanManage={canManageCategory}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
              Verified Maintenance Outlay History ({completedIssues.length})
            </h3>
          </div>
          <MaintenanceHistoryTab
            completedIssues={completedIssues}
            onIssueClick={(id) => openIssueDetail(id)}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Asset Chronological Lifecycle
            </h3>
            <p className="text-secondary" style={{ fontSize: '12.5px', margin: 0 }}>
              Audit timeline tracing capital commissioning, periodic inspections, distress reports, and verified maintenance closeouts.
            </p>
          </div>
          <AssetLifecycleTimeline
            asset={asset}
            issues={issues}
            inspections={inspections}
            activities={activity}
            onIssueClick={(id) => openIssueDetail(id)}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <ActivityTimeline activities={activity} />
        </div>
      )}

      {/* ─── Condition Update Modal ─── */}
      <Modal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        title="Update Condition"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowConditionModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConditionUpdate} disabled={actionLoading || newCondition === asset.condition}>
              {actionLoading ? <span className="loading-spinner loading-spinner-sm" /> : 'Update'}
            </button>
          </>
        }
      >
        <p className="text-secondary" style={{ fontSize: '13px', marginBottom: '12px' }}>
          Current condition: <ConditionBadge condition={asset.condition} />
        </p>
        <div className="form-group">
          <label className="form-label">New Condition</label>
          <select className="form-select" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} id="condition-select">
            {conditions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Modal>

      {/* ─── Report Issue Modal ─── */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Report Issue"
        size="lg"
      >
        <IssueForm
          assetId={assetId}
          assetCategory={asset.category}
          onSubmit={handleIssueSubmit}
          onCancel={() => setShowIssueModal(false)}
          loading={actionLoading}
          issueCategories={referenceData?.issueCategories || {}}
          officers={referenceData?.officers || []}
        />
      </Modal>

      {/* ─── Retire Confirmation Modal ─── */}
      <Modal
        isOpen={showRetireModal}
        onClose={() => setShowRetireModal(false)}
        title="Retire Asset"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowRetireModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleRetire} disabled={actionLoading}>
              {actionLoading ? <span className="loading-spinner loading-spinner-sm" /> : '🚫 Retire Asset'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-primary)' }}>
          Are you sure you want to retire <strong>{asset.name}</strong> ({asset.id})?
        </p>
        {openIssues.length > 0 && (
          <div style={{ background: 'var(--color-fair-bg)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '12px', marginTop: '12px' }}>
            <p style={{ color: 'var(--color-fair)', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ Warning: {openIssues.length} open issue(s) will remain unresolved.
            </p>
          </div>
        )}
        <p className="text-secondary" style={{ fontSize: '13px', marginTop: '12px' }}>
          This action cannot be undone. The asset will be hidden from default listings.
        </p>
      </Modal>

      {/* ─── Issue Detail Modal ─── */}
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={showIssueDetailModal}
        onClose={() => { setShowIssueDetailModal(false); setSelectedIssue(null); }}
        onAction={handleIssueAction}
        onRefresh={fetchAll}
        officers={referenceData?.officers || []}
        loading={actionLoading}
      />

      {/* ─── Record Inspection Modal ─── */}
      <RecordInspectionModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        asset={asset}
        onSuccess={(newInsp) => {
          toast.success('Inspection Recorded', `Condition assessed as ${newInsp.condition_assessment}`);
          fetchAll();
        }}
      />
    </div>
  );
}

/* ─── Sub Components ──────────────────────────────────────────────── */

function InfoItem({ label, value }) {
  const isEmpty = value === null || value === undefined || value === '' || value === '—';
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: isEmpty ? 400 : 600,
        color: isEmpty ? 'var(--text-muted)' : 'var(--text-primary)',
        marginTop: '2px',
        fontStyle: isEmpty ? 'italic' : 'normal'
      }}>
        {isEmpty ? 'Not Specified' : value}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, id }) {
  return (
    <button
      className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
      onClick={onClick}
      id={id}
      style={{
        borderRadius: '8px 8px 0 0',
        padding: '8px 16px',
        fontSize: '13.5px',
        fontWeight: active ? 600 : 500,
        background: active ? '#ffffff' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--text-tertiary)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

