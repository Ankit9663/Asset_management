/**
 * GET /api/dashboard
 * 
 * Returns rich live enterprise analytics aggregated from Neon Postgres:
 *   - Core Asset counts & totals
 *   - Capex & Cumulative completed maintenance expenditure
 *   - Condition and category distributions
 *   - Issue lifecycle funnel counts
 *   - Category-wise maintenance expenditure breakdown
 *   - Monthly expenditure trend
 *   - Pending administrative sanctions (estimates & verifications)
 *   - Overdue periodic inspections
 *   - Urgent priority issues & recent inspections
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';

export async function GET() {
  try {
    await ensureSchema();

    // 1. Total and Active Assets
    const totalResult = await query("SELECT COUNT(*) AS count FROM assets");
    const activeResult = await query("SELECT COUNT(*) AS count FROM assets WHERE status != 'Retired'");
    const totalAssets = Number(totalResult[0]?.count || 0);
    const activeAssets = Number(activeResult[0]?.count || 0);

    // 2. Capital & Maintenance Financial Totals
    const capexResult = await query(
      "SELECT COALESCE(SUM(construction_cost), 0) AS total_capex FROM assets WHERE status != 'Retired'"
    );
    const totalCapex = Number(capexResult[0]?.total_capex || 0);

    const maintSpendResult = await query(
      "SELECT COALESCE(SUM(COALESCE(actual_cost, approved_amount, 0)), 0) AS total_spend FROM issues WHERE status = 'Completed'"
    );
    const totalMaintenanceSpend = Number(maintSpendResult[0]?.total_spend || 0);

    // 3. Assets by Category
    const categoryResult = await query(
      `SELECT category, COUNT(*) AS count 
       FROM assets WHERE status != 'Retired' 
       GROUP BY category 
       ORDER BY category`
    );
    const byCategory = { Road: 0, Bridge: 0, Building: 0 };
    for (const row of categoryResult) {
      byCategory[row.category] = Number(row.count);
    }

    // 4. Assets by Condition (Active only)
    const conditionResult = await query(
      `SELECT condition, COUNT(*) AS count 
       FROM assets WHERE status != 'Retired' 
       GROUP BY condition 
       ORDER BY condition`
    );
    const byCondition = { Good: 0, Fair: 0, Poor: 0, Critical: 0 };
    for (const row of conditionResult) {
      byCondition[row.condition] = Number(row.count);
    }

    const poorCriticalAssets = (byCondition.Poor || 0) + (byCondition.Critical || 0);

    // 5. Issues by Lifecycle Status
    const issueStatusResult = await query(
      `SELECT status, COUNT(*) AS count 
       FROM issues 
       GROUP BY status 
       ORDER BY status`
    );
    const issuesByStatus = {
      'Open': 0,
      'Pending Approval': 0,
      'Approved': 0,
      'In Progress': 0,
      'Awaiting Verification': 0,
      'Completed': 0,
    };
    let openIssues = 0;
    for (const row of issueStatusResult) {
      issuesByStatus[row.status] = Number(row.count);
      if (row.status !== 'Completed') {
        openIssues += Number(row.count);
      }
    }

    // 6. Maintenance Expenditure by Asset Category
    const spendByCategoryResult = await query(
      `SELECT a.category, COALESCE(SUM(COALESCE(i.actual_cost, i.approved_amount, 0)), 0) AS total_spend
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.status = 'Completed'
       GROUP BY a.category`
    );
    const spendByCategory = { Road: 0, Bridge: 0, Building: 0 };
    for (const row of spendByCategoryResult) {
      spendByCategory[row.category] = Number(row.total_spend);
    }

    // 7. Monthly Maintenance Expenditure Trend (Recent Completed Issues)
    const monthlySpendResult = await query(
      `SELECT 
         TO_CHAR(COALESCE(completed_date, reported_date), 'Mon YYYY') AS month_label,
         DATE_TRUNC('month', COALESCE(completed_date, reported_date)) AS month_date,
         COALESCE(SUM(COALESCE(actual_cost, approved_amount, 0)), 0) AS amount
       FROM issues
       WHERE status = 'Completed'
       GROUP BY month_label, month_date
       ORDER BY month_date ASC
       LIMIT 6`
    );
    const monthlySpend = monthlySpendResult.map(r => ({
      month: r.month_label,
      amount: Number(r.amount),
    }));

    // 8. Pending Administrative Sanctions
    const pendingEstimatesResult = await query(
      "SELECT COUNT(*) AS count FROM estimates WHERE status = 'Pending Review'"
    );
    const pendingVerificationsResult = await query(
      "SELECT COUNT(*) AS count FROM issues WHERE status = 'Awaiting Verification'"
    );
    const pendingEstimates = Number(pendingEstimatesResult[0]?.count || 0);
    const pendingVerifications = Number(pendingVerificationsResult[0]?.count || 0);
    const pendingAdminActions = pendingEstimates + pendingVerifications;

    // 9. Overdue Periodic Inspections
    const overdueResult = await query(
      `SELECT COUNT(DISTINCT a.id) AS count
       FROM assets a
       JOIN inspections i ON a.id = i.asset_id
       WHERE a.status != 'Retired' 
         AND i.next_due_date < NOW()`
    );
    const overdueInspections = Number(overdueResult[0]?.count || 0);

    // 10. Urgent Issues Requiring Attention (Critical/High priority not completed)
    const attentionIssues = await query(
      `SELECT 
         i.id, i.asset_id, i.issue_category, i.description, i.priority,
         i.status, i.reported_date, i.assigned_to, i.assigned_officer_name,
         a.name AS asset_name,
         a.category AS asset_category
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.status != 'Completed' AND i.priority IN ('High', 'Critical')
       ORDER BY 
         CASE i.priority WHEN 'Critical' THEN 1 ELSE 2 END,
         i.reported_date ASC
       LIMIT 8`
    );

    // 11. Recent Inspections Across State
    const recentInspections = await query(
      `SELECT 
         i.id, i.asset_id, i.inspection_date, i.inspector_name,
         i.inspection_type, i.condition_assessment, i.observations, i.defects_identified,
         a.name AS asset_name, a.category AS asset_category, a.district AS asset_district
       FROM inspections i
       JOIN assets a ON i.asset_id = a.id
       ORDER BY i.inspection_date DESC
       LIMIT 6`
    );

    return NextResponse.json({
      totalAssets,
      activeAssets,
      totalCapex,
      totalMaintenanceSpend,
      byCategory,
      byCondition,
      poorCriticalAssets,
      openIssues,
      issuesByStatus,
      spendByCategory,
      monthlySpend,
      pendingEstimates,
      pendingVerifications,
      pendingAdminActions,
      overdueInspections,
      attentionIssues: attentionIssues || [],
      recentInspections: recentInspections || [],
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data.', details: error.message },
      { status: 500 }
    );
  }
}
