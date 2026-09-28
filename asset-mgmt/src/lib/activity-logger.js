/**
 * Centralized Activity Logger (Neon Postgres)
 * 
 * Every mutation in the system calls logActivity() to record what happened.
 * All functions are async for the Neon HTTP driver.
 */

import { query } from './db.js';
import { STATIC_USER } from './constants.js';

/**
 * Write an activity log entry.
 * 
 * @param {Object} entry - The log entry
 * @param {string} entry.assetId - The asset this action relates to
 * @param {string|null} [entry.issueId] - The issue ID (null for asset-only actions)
 * @param {string} entry.action - One of ACTIVITY_ACTIONS enum values
 * @param {string} [entry.actor] - Who performed the action (defaults to STATIC_USER)
 * @param {string} entry.summary - Human-readable description of what happened
 * @param {string|null} [entry.oldValue] - Previous value (for condition/status changes)
 * @param {string|null} [entry.newValue] - New value (for condition/status changes)
 * @param {string|null} [entry.timestamp] - Override timestamp (for seed data); defaults to now
 * @returns {Promise<Object>} The inserted log entry
 */
export async function logActivity({
  assetId,
  issueId = null,
  action,
  actor = STATIC_USER,
  summary,
  oldValue = null,
  newValue = null,
  timestamp = null,
}) {
  const rows = await query(
    `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary, old_value, new_value)
     VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6, $7, $8)
     RETURNING id`,
    [assetId, issueId, action, actor, timestamp, summary, oldValue, newValue]
  );

  return {
    id: rows[0].id,
    assetId,
    issueId,
    action,
    actor,
    summary,
    oldValue,
    newValue,
  };
}

/**
 * Retrieve recent activity entries (global).
 * 
 * @param {number} [limit=20] - Max entries to return
 * @returns {Promise<Array>} Activity log entries, newest first
 */
export async function getRecentActivity(limit = 20) {
  const rows = await query(
    `SELECT 
       al.id, al.asset_id, al.issue_id, al.action, al.actor,
       al.timestamp, al.summary, al.old_value, al.new_value,
       a.name AS asset_name,
       a.category AS asset_category
     FROM activity_log al
     LEFT JOIN assets a ON al.asset_id = a.id
     ORDER BY al.timestamp DESC, al.id DESC
     LIMIT $1`,
    [limit]
  );

  return rows;
}

/**
 * Retrieve activity entries for a specific asset.
 * 
 * @param {string} assetId - The asset ID
 * @param {number} [limit=50] - Max entries to return
 * @returns {Promise<Array>} Activity log entries for the asset, newest first
 */
export async function getAssetActivity(assetId, limit = 50) {
  const rows = await query(
    `SELECT id, asset_id, issue_id, action, actor, timestamp, summary, old_value, new_value
     FROM activity_log
     WHERE asset_id = $1
     ORDER BY timestamp DESC, id DESC
     LIMIT $2`,
    [assetId, limit]
  );

  return rows;
}
