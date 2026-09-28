'use client';

/**
 * IssueDetailModal Component
 * Full-featured maintenance issue workspace including:
 * - 6-stage lifecycle progression stepper
 * - Assignment and status controls
 * - Component-wise cost estimation (Multi-version)
 * - Administrative estimate review (Approve / Request Revision / Reject)
 * - Execution progress milestones & timeline
 * - Completion submission with actual expenditure & variance justification
 * - Administrative verification & formal sign-off
 */

import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import IssueLifecycleStepper from './IssueLifecycleStepper';
import CostEstimateForm from './CostEstimateForm';
import EstimateHistoryViewer from './EstimateHistoryViewer';
import AdminEstimateReviewModal from './AdminEstimateReviewModal';
import MaintenanceProgressTracker from './MaintenanceProgressTracker';
import SubmitCompletionModal from './SubmitCompletionModal';
import AdminVerificationModal from './AdminVerificationModal';
import { useUser } from '@/context/UserContext';
import { useToast } from './Toast';

export default function IssueDetailModal({
  issue,
  isOpen,
  onClose,
  onAction,
  onRefresh,
  officers = [],
  loading = false,
}) {
  const { currentUser } = useUser();
  const toast = useToast();

  const [estimates, setEstimates] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);
  const [actualItems, setActualItems] = useState([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [selectedEstimateForReview, setSelectedEstimateForReview] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [assignTo, setAssignTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = currentUser?.role === 'VIEWER';

  // Check if current user is authorized for this category
  const isCategoryMatch = issue && (currentUser?.category === 'ALL' || currentUser?.category === issue.asset_category || currentUser?.category === issue.category);
  const canManageThisIssue = (isAdmin || (isCategoryMatch && !isViewer));

  const fetchEstimates = useCallback(async (issueId) => {
    if (!issueId) return;
    setLoadingEstimates(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/estimates`);
      const data = await res.json();
      setEstimates(data.estimates || []);
    } catch (err) {
      console.error('Failed to fetch estimates:', err);
    } finally {
      setLoadingEstimates(false);
    }
  }, []);

  const fetchProgress = useCallback(async (issueId) => {
    if (!issueId) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/progress`);
      const data = await res.json();
      setProgressLogs(data.progress || []);
      setActualItems(data.actualItems || []);
    } catch (err) {
      console.error('Failed to fetch progress logs:', err);
    }
  }, []);

  useEffect(() => {
    if (issue) {
      setAssignTo(issue.assigned_to || '');
      setResolutionNotes(issue.resolution_notes || '');
      setShowEstimateForm(false);
      setSelectedEstimateForReview(null);
      setShowCompletionModal(false);
      setShowVerificationModal(false);
      fetchEstimates(issue.id);
      fetchProgress(issue.id);
    }
  }, [issue, fetchEstimates, fetchProgress]);

  if (!issue) return null;

  const handleEstimateSubmit = async (estimateData) => {
    const res = await fetch(`/api/issues/${issue.id}/estimates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimateData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to submit estimate');
    }

    toast.success('Estimate Submitted', `Version ${data.estimate?.version || 1} submitted for administrative review.`);
    setShowEstimateForm(false);
    await fetchEstimates(issue.id);
    if (onRefresh) onRefresh();
  };

  const handleReviewCompleted = async (reviewResult) => {
    toast.success('Review Processed', reviewResult.message);
    setSelectedEstimateForReview(null);
    await fetchEstimates(issue.id);
    if (onRefresh) onRefresh();
  };

  const handleProgressAdded = async () => {
    toast.success('Progress Updated', 'Milestone posted successfully.');
    await fetchProgress(issue.id);
    if (onRefresh) onRefresh();
  };

  const handleCompletionSubmitted = async (resData) => {
    toast.success('Completion Submitted', resData.message);
    setShowCompletionModal(false);
    await fetchProgress(issue.id);
    if (onRefresh) onRefresh();
  };

  const handleVerificationComplete = async (resData) => {
    toast.success('Verification Processed', resData.message);
    setShowVerificationModal(false);
    if (onRefresh) onRefresh();
  };

  const latestEstimate = estimates.length > 0 ? estimates[0] : null;
  const isEstimateApproved = issue.status === 'Approved' || latestEstimate?.status === 'Approved';
  const isRevisionRequested = latestEstimate?.status === 'Revision Requested' || issue.approval_status === 'Revision Requested';

  const canCreateEstimate = canManageThisIssue && (issue.status === 'Open' || isRevisionRequested);
  const canStartProgress = (issue.status === 'Approved' || issue.status === 'Open') && (assignTo || issue.assigned_to) && canManageThisIssue;
  const canSubmitCompletion = issue.status === 'In Progress' && canManageThisIssue;
  const canAdminVerify = issue.status === 'Awaiting Verification' && isAdmin;
  const canReopen = issue.status === 'Completed' && canManageThisIssue;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Maintenance Order — ${issue.id}`} size="lg">
        {/* Lifecycle Stepper */}
        <IssueLifecycleStepper status={issue.status} />

        {/* Top Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{issue.issue_category}</div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Priority</div>
            <div style={{ marginTop: '2px' }}><PriorityBadge priority={issue.priority} /></div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Lifecycle Status</div>
            <div style={{ marginTop: '2px' }}><StatusBadge status={issue.status} /></div>
          </div>
          <div>
            <div className="text-tertiary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Officer</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {issue.assigned_officer_name || <span style={{ color: '#d97706' }}>Unassigned</span>}
            </div>
          </div>
        </div>

        {/* Issue Description & Originating Inspection Link */}
        <div style={{ marginBottom: '18px' }}>
          <div className="text-tertiary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Problem Description
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
            {issue.description}
          </p>
          {issue.originating_inspection_id && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🔍</span> Generated from field inspection: <strong>{issue.originating_inspection_id}</strong>
            </div>
          )}
        </div>

        {/* ─── STAGE: AWAITING VERIFICATION BANNER ─── */}
        {issue.status === 'Awaiting Verification' && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔍</span> Work Completed — Awaiting Official Administrative Sign-Off
              </div>
              <div style={{ fontSize: '12.5px', color: '#1e3a8a', marginTop: '4px' }}>
                Actual Expenditure: <strong>₹ {Number(issue.actual_cost || 0).toLocaleString('en-IN')}</strong> • Approved Budget: ₹ {Number(issue.approved_amount || 0).toLocaleString('en-IN')}
                {Number(issue.cost_variance) > 0 && (
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}> (Overrun: + ₹ {Number(issue.cost_variance).toLocaleString('en-IN')})</span>
                )}
                {Number(issue.cost_variance) < 0 && (
                  <span style={{ color: '#15803d', fontWeight: 600 }}> (Savings: - ₹ {Math.abs(Number(issue.cost_variance)).toLocaleString('en-IN')})</span>
                )}
              </div>
            </div>

            {canAdminVerify && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
                onClick={() => setShowVerificationModal(true)}
              >
                ⚖️ Verify & Sign Off Order
              </button>
            )}
          </div>
        )}

        {/* ─── STAGE: COMPLETED & VERIFIED CLOSEOUT ─── */}
        {issue.status === 'Completed' && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏁</span> Work Order Completed & Officially Verified
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>
                Verified by {issue.verified_by || 'Admin'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', color: '#14532d' }}>
              <div>
                <span>Final Expenditure:</span> <strong>₹ {Number(issue.actual_cost || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span>Sanctioned Budget:</span> <strong>₹ {Number(issue.approved_amount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span>Net Variance:</span>{' '}
                <strong style={{ color: Number(issue.cost_variance) > 0 ? '#b91c1c' : '#15803d' }}>
                  {Number(issue.cost_variance) > 0 ? `+ ₹ ${Number(issue.cost_variance).toLocaleString('en-IN')} (Overrun)` : `- ₹ ${Math.abs(Number(issue.cost_variance || 0)).toLocaleString('en-IN')} (Savings)`}
                </strong>
              </div>
            </div>

            {issue.verification_remarks && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '8px 12px', borderRadius: '4px' }}>
                <strong>Sign-off Remarks:</strong> "{issue.verification_remarks}"
              </div>
            )}
          </div>
        )}

        {/* ─── EXECUTION PROGRESS TRACKER (When In Progress, Awaiting Verification, or Completed) ─── */}
        {(issue.status === 'In Progress' || issue.status === 'Awaiting Verification' || issue.status === 'Completed') && (
          <MaintenanceProgressTracker
            issue={issue}
            progressLogs={progressLogs}
            canManage={canManageThisIssue}
            onProgressAdded={handleProgressAdded}
          />
        )}

        {/* ─── COST ESTIMATION & APPROVAL SECTION ─── */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: '20px',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💰</span> Component Cost Estimates & Administrative Sanction
              </h4>
              <p className="text-secondary" style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Multi-item bill of quantities, statutory taxes, and administrative approval trail.
              </p>
            </div>

            {canCreateEstimate && !showEstimateForm && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowEstimateForm(true)}
              >
                {estimates.length === 0 ? '+ Prepare Cost Estimate' : `+ Submit Revised Estimate (v${estimates.length + 1})`}
              </button>
            )}
          </div>

          {/* Form Mode */}
          {showEstimateForm ? (
            <div style={{ background: '#fcfcfd', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  New Estimate Version {estimates.length + 1}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowEstimateForm(false)}
                >
                  ✕ Close Form
                </button>
              </div>
              <CostEstimateForm
                issue={issue}
                onSubmit={handleEstimateSubmit}
                onCancel={() => setShowEstimateForm(false)}
              />
            </div>
          ) : (
            <div>
              {loadingEstimates ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div className="loading-spinner loading-spinner-sm" />
                </div>
              ) : (
                <EstimateHistoryViewer
                  estimates={estimates}
                  isAdmin={isAdmin}
                  onReviewClick={(est) => setSelectedEstimateForReview(est)}
                />
              )}
            </div>
          )}
        </div>

        {/* ─── WORKFLOW & TRANSITION CONTROLS ─── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Assignment control */}
          {issue.status === 'Open' && canManageThisIssue && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
                <label className="form-label">Assign Category Officer</label>
                <select
                  className="form-select"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                >
                  <option value="">Select Officer...</option>
                  {officers
                    .filter(o => currentUser?.role === 'ADMIN' || o.category === issue.asset_category || o.category === 'ALL')
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.designation})
                      </option>
                    ))}
                </select>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!assignTo || assignTo === issue.assigned_to || loading}
                onClick={() => onAction(issue.id, { assignedTo })}
              >
                Save Assignment
              </button>
            </div>
          )}

          {/* Action Transition Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {canStartProgress && issue.status !== 'In Progress' && (
              <button
                className="btn btn-primary btn-sm"
                disabled={loading}
                onClick={() => onAction(issue.id, { status: 'In Progress', assignedTo: assignTo || issue.assigned_to })}
              >
                ▶ Move to In Progress
              </button>
            )}

            {/* Officer Submit Completion Report Button */}
            {canSubmitCompletion && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#16a34a', borderColor: '#15803d' }}
                onClick={() => setShowCompletionModal(true)}
              >
                🏁 Submit Work Order Completion Report
              </button>
            )}

            {canReopen && (
              <button
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => onAction(issue.id, { status: 'Open' })}
              >
                🔓 Reopen Maintenance Order
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Admin Review Modal */}
      {selectedEstimateForReview && (
        <AdminEstimateReviewModal
          isOpen={Boolean(selectedEstimateForReview)}
          onClose={() => setSelectedEstimateForReview(null)}
          issue={issue}
          estimate={selectedEstimateForReview}
          onReviewSubmit={handleReviewCompleted}
        />
      )}

      {/* Officer Submit Completion Modal */}
      {showCompletionModal && (
        <SubmitCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          issue={issue}
          onCompletionSubmitted={handleCompletionSubmitted}
        />
      )}

      {/* Admin Verification Modal */}
      {showVerificationModal && (
        <AdminVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          issue={issue}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  );
}
