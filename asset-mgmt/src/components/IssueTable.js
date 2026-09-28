'use client';

/**
 * IssueTable — tabular display of maintenance issues.
 * 
 * Props:
 *   issues     — array of issue objects
 *   onRowClick — callback(issueId, assetId)
 *   showAsset  — whether to show the asset name column
 *   loading    — show loading state
 */

import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import EmptyState from './EmptyState';

export default function IssueTable({ issues = [], onRowClick, showAsset = true, loading = false }) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-page">
          <div className="loading-spinner" />
          <span>Loading issues...</span>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <EmptyState
        icon="🔧"
        title="No issues found"
        description="No maintenance issues match the current filters."
      />
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="table-container" id="issue-table">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            {showAsset && <th>Asset</th>}
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Reported</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={issue.id}
              className={onRowClick ? 'clickable-row' : ''}
              onClick={() => onRowClick?.(issue.id, issue.asset_id)}
              id={`issue-row-${issue.id}`}
            >
              <td className="cell-id">{issue.id}</td>
              {showAsset && (
                <td className="cell-name">{issue.asset_name || issue.asset_id}</td>
              )}
              <td className="text-secondary">{issue.issue_category}</td>
              <td><PriorityBadge priority={issue.priority} /></td>
              <td><StatusBadge status={issue.status} /></td>
              <td className="text-secondary">
                {issue.assigned_officer_name || <span className="text-tertiary">Unassigned</span>}
              </td>
              <td className="text-secondary text-sm">{formatDate(issue.reported_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
