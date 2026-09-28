'use client';

/**
 * AssetTable — tabular display of assets with badges and click-to-navigate.
 * 
 * Props:
 *   assets    — array of asset objects
 *   onRowClick — callback(assetId)
 *   loading   — show loading state
 */

import ConditionBadge from './ConditionBadge';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

const CATEGORY_ICONS = {
  'Road': '🛣️',
  'Bridge': '🌉',
  'Building': '🏛️',
};

export default function AssetTable({ assets = [], onRowClick, loading = false }) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-page">
          <div className="loading-spinner" />
          <span>Loading assets...</span>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon="🏗️"
        title="No assets found"
        description="Try adjusting your filters or add a new asset to get started."
      />
    );
  }

  return (
    <div className="table-container" id="asset-table">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>District</th>
            <th>Condition</th>
            <th>Status</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              className="clickable-row"
              onClick={() => onRowClick?.(asset.id)}
              id={`asset-row-${asset.id}`}
            >
              <td className="cell-id">{asset.id}</td>
              <td className="cell-name">{asset.name}</td>
              <td>
                <span className={`badge badge-${asset.category?.toLowerCase()}`}>
                  {CATEGORY_ICONS[asset.category]} {asset.category}
                </span>
              </td>
              <td className="text-secondary">{asset.type}</td>
              <td className="text-secondary">{asset.district}</td>
              <td><ConditionBadge condition={asset.condition} /></td>
              <td><StatusBadge status={asset.status} /></td>
              <td>
                {Number(asset.open_issues) > 0 ? (
                  <span className="badge badge-open">{asset.open_issues} open</span>
                ) : (
                  <span className="text-tertiary text-sm">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
