/**
 * GET /api/dashboard
 * 
 * Returns aggregated counts for the dashboard:
 *   - Total assets, by category, by condition
 *   - Open issues count
 *   - Poor/Critical condition assets count
 *   - Issues requiring attention (High/Critical priority, not Completed)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';

export async function GET() {
  try {
    await ensureSchema();

    // Total assets (excluding Retired)
    const totalResult = await query(
      "SELECT COUNT(*) AS count FROM assets WHERE status != 'Retired'"
    );
    const totalAssets = Number(totalResult[0].count);

    // Assets by category
    const categoryResult = await query(
      `SELECT category, COUNT(*) AS count 
       FROM assets WHERE status != 'Retired' 
       GROUP BY category 
       ORDER BY category`
    );
    const byCategory = {};
    for (const row of categoryResult) {
      byCategory[row.category] = Number(row.count);
    }

    // Assets by condition (Active only)
    const conditionResult = await query(
      `SELECT condition, COUNT(*) AS count 
       FROM assets WHERE status != 'Retired' 
       GROUP BY condition 
       ORDER BY condition`
    );
    const byCondition = {};
    for (const row of conditionResult) {
      byCondition[row.condition] = Number(row.count);
    }

    // Poor/Critical assets count
    const poorCriticalResult = await query(
      "SELECT COUNT(*) AS count FROM assets WHERE status != 'Retired' AND condition IN ('Poor', 'Critical')"
    );
    const poorCriticalAssets = Number(poorCriticalResult[0].count);

    // Open issues count
    const openIssuesResult = await query(
      "SELECT COUNT(*) AS count FROM issues WHERE status != 'Completed'"
    );
    const openIssues = Number(openIssuesResult[0].count);

    // Issues by status
    const issueStatusResult = await query(
      `SELECT status, COUNT(*) AS count 
       FROM issues 
       GROUP BY status 
       ORDER BY status`
    );
    const issuesByStatus = {};
    for (const row of issueStatusResult) {
      issuesByStatus[row.status] = Number(row.count);
    }

    // Issues requiring attention: High/Critical priority, not Completed
    const attentionIssues = await query(
      `SELECT 
         i.id, i.asset_id, i.issue_category, i.description, i.priority,
         i.status, i.reported_date, i.assigned_to,
         a.name AS asset_name,
         a.category AS asset_category,
         o.name AS assigned_officer_name
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       LEFT JOIN officers o ON i.assigned_to = o.id
       WHERE i.status != 'Completed' AND i.priority IN ('High', 'Critical')
       ORDER BY 
         CASE i.priority WHEN 'Critical' THEN 1 ELSE 2 END,
         i.reported_date ASC
       LIMIT 10`
    );

    return NextResponse.json({
      totalAssets,
      byCategory,
      byCondition,
      poorCriticalAssets,
      openIssues,
      issuesByStatus,
      attentionIssues,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data.', details: error.message },
      { status: 500 }
    );
  }
}
