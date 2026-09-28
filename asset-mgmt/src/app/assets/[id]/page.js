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
import { useToast } from '@/components/Toast';

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
  const assetId = params.id;

  const [asset, setAsset] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activity, setActivity] = useState([]);
  const [referenceData, setReferenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issues');

  // Modal states
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newCondition, setNewCondition] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [assetRes, issuesRes, activityRes, refRes] = await Promise.all([
        fetch(`/api/assets/${assetId}`),
        fetch(`/api/assets/${assetId}/issues`),
        fetch(`/api/assets/${assetId}/activity`),
        fetch('/api/reference'),
      ]);

      const assetData = await assetRes.json();
      const issuesData = await issuesRes.json();
      const activityData = await activityRes.json();
      const refData = await refRes.json();

      if (!assetRes.ok) {
        toast.error('Asset not found', assetData.error);
        router.push('/assets');
        return;
      }

      setAsset(assetData.asset);
      setIssues(issuesData.issues || []);
      setActivity(activityData.activity || []);
      setReferenceData(refData);
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
          <button className="btn btn-secondary" onClick={() => router.push(`/assets/${assetId}/edit`)} id="edit-asset-btn">
            ✏️ Edit
          </button>
          <button className="btn btn-secondary" onClick={() => { setNewCondition(asset.condition); setShowConditionModal(true); }} id="update-condition-btn">
            🔄 Update Condition
          </button>
          {asset.status !== 'Retired' && (
            <>
              <button className="btn btn-primary" onClick={() => setShowIssueModal(true)} id="report-issue-btn">
                🚨 Report Issue
              </button>
              <button className="btn btn-danger" onClick={() => setShowRetireModal(true)} id="retire-asset-btn">
                🚫 Retire
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview + Details Grid */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Overview */}
        <div className="card">
          <div className="card-title">Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
          <div className="card-title">{asset.category} Details</div>
          {Object.keys(details).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {Object.entries(details).map(([key, val]) => (
                <InfoItem key={key} label={DETAIL_LABELS[key] || key} value={val ?? '—'} />
              ))}
            </div>
          ) : (
            <p className="text-secondary">No category-specific details recorded.</p>
          )}
        </div>
      </div>

      {/* Tabs: Issues / Activity */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        <TabButton active={activeTab === 'issues'} onClick={() => setActiveTab('issues')} id="tab-issues">
          🔧 Issues ({issues.length})
        </TabButton>
        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} id="tab-activity">
          📋 Activity ({activity.length})
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
        officers={referenceData?.officers || []}
        loading={actionLoading}
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

/** Issue detail modal with actions: assign, transition, complete, reopen */
function IssueDetailModal({ issue, isOpen, onClose, onAction, officers = [], loading }) {
  const [assignTo, setAssignTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (issue) {
      setAssignTo(issue.assigned_to || '');
      setResolutionNotes('');
    }
  }, [issue]);

  if (!issue) return null;

  const canAssign = issue.status === 'Open';
  const canStartProgress = issue.status === 'Open' && (assignTo || issue.assigned_to);
  const canComplete = issue.status === 'In Progress';
  const canReopen = issue.status === 'Completed';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Issue ${issue.id}`} size="lg">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div className="text-tertiary" style={{ fontSize: '12px', marginBottom: '2px' }}>Category</div>
          <div>{issue.issue_category}</div>
        </div>
        <div>
          <div className="text-tertiary" style={{ fontSize: '12px', marginBottom: '2px' }}>Priority</div>
          <PriorityBadge priority={issue.priority} />
        </div>
        <div>
          <div className="text-tertiary" style={{ fontSize: '12px', marginBottom: '2px' }}>Status</div>
          <StatusBadge status={issue.status} />
        </div>
        <div>
          <div className="text-tertiary" style={{ fontSize: '12px', marginBottom: '2px' }}>Assigned To</div>
          <div>{issue.assigned_officer_name || <span className="text-tertiary">Unassigned</span>}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div className="text-tertiary" style={{ fontSize: '12px', marginBottom: '4px' }}>Description</div>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{issue.description}</p>
      </div>

      {issue.resolution_notes && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-completed-bg)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-completed)', marginBottom: '4px' }}>Resolution Notes</div>
          <p style={{ fontSize: '13px' }}>{issue.resolution_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Assign */}
        {(canAssign || issue.status === 'Open') && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign Officer</label>
              <select className="form-select" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} id="issue-assign-select">
                <option value="">Unassigned</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!assignTo || loading}
                onClick={() => onAction(issue.id, { assignedTo: assignTo })}
                id="assign-officer-btn"
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* Transition buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canStartProgress && (
            <button
              className="btn btn-primary btn-sm"
              disabled={loading}
              onClick={() => onAction(issue.id, { status: 'In Progress', assignedTo: assignTo || issue.assigned_to })}
              id="start-progress-btn"
            >
              ▶ Move to In Progress
            </button>
          )}

          {issue.status === 'Open' && !canStartProgress && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', width: '100%' }}>
              💡 Select an officer from the dropdown above to enable moving this issue to <strong>In Progress</strong>.
            </div>
          )}

          {canComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div className="form-group">
                <label className="form-label">Resolution Notes <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                  style={{ minHeight: '80px' }}
                  id="resolution-notes-textarea"
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={loading || !resolutionNotes.trim()}
                onClick={() => onAction(issue.id, { status: 'Completed', resolutionNotes })}
                id="complete-issue-btn"
              >
                ✅ Mark as Completed
              </button>
            </div>
          )}

          {canReopen && (
            <button
              className="btn btn-secondary btn-sm"
              disabled={loading}
              onClick={() => onAction(issue.id, { status: 'Open' })}
              id="reopen-issue-btn"
            >
              🔓 Reopen Issue
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
