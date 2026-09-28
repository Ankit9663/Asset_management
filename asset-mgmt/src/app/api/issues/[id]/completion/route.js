/**
 * Maintenance Completion Submission API
 * 
 * POST /api/issues/[id]/completion
 * Executing officer submits completed work order, actual expenditure items, and variance justification.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, canManageIssue } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: issueId } = await params;

    const issueRows = await query(
      `SELECT i.*, a.category AS asset_category
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.id = $1`,
      [issueId]
    );

    if (!issueRows || issueRows.length === 0) {
      return NextResponse.json({ error: `Issue "${issueId}" not found.` }, { status: 404 });
    }

    const issue = issueRows[0];
    const permission = canManageIssue(user, issue, issue.asset_category);
    if (!permission.allowed) {
      return NextResponse.json({ error: 'Forbidden', message: permission.reason }, { status: 403 });
    }

    const body = await request.json();
    const {
      actualCompletionDate,
      actualExpenditure,
      actualItems = [],
      completionNotes,
      varianceReason,
    } = body;

    if (!completionNotes || !completionNotes.trim()) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'Completion / work resolution notes are required.' },
        { status: 400 }
      );
    }

    const totalActual = Number(actualExpenditure) || 0;
    const approvedAmount = Number(issue.approved_amount) || 0;
    const variance = Math.round((totalActual - approvedAmount) * 100) / 100;

    // If cost overrun > ₹ 1,000, require a variance explanation
    if (variance > 1000 && (!varianceReason || !varianceReason.trim())) {
      return NextResponse.json(
        {
          error: 'Variance explanation required.',
          message: `Actual expenditure exceeded approved budget by ₹ ${variance.toLocaleString('en-IN')}. Please provide an engineering justification in variance reason.`,
        },
        { status: 400 }
      );
    }

    const compDate = actualCompletionDate ? new Date(actualCompletionDate) : new Date();

    // Clear any previous actual items and re-insert
    await query(`DELETE FROM issue_actual_items WHERE issue_id = $1`, [issueId]);

    if (actualItems && actualItems.length > 0) {
      for (const it of actualItems) {
        const itemName = it.itemName || it.item_name || 'Component Work';
        const qty = Number(it.actualQuantity || it.quantity || 1);
        const rate = Number(it.actualUnitCost || it.unit_cost || 0);
        const total = Math.round((Number(it.actualTotal || it.total_cost) || (qty * rate)) * 100) / 100;
        const vendor = it.actualVendor || it.vendor || null;

        await query(
          `INSERT INTO issue_actual_items (
             issue_id, item_name, actual_quantity, actual_unit_cost, actual_total, actual_vendor
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [issueId, itemName, qty, rate, total, vendor]
        );
      }
    }

    // Update issue to Awaiting Verification
    await query(
      `UPDATE issues SET
         status = 'Awaiting Verification',
         verification_status = 'Pending Verification',
         actual_cost = $1,
         cost_variance = $2,
         variance_reason = $3,
         resolution_notes = $4,
         completed_date = $5,
         updated_at = NOW()
       WHERE id = $6`,
      [
        totalActual,
        variance,
        varianceReason?.trim() || null,
        completionNotes.trim(),
        compDate,
        issueId,
      ]
    );

    // Activity Log
    await logActivity({
      assetId: issue.asset_id,
      issueId,
      action: ACTIVITY_ACTIONS.COMPLETION_SUBMITTED,
      summary: `Completion report submitted by ${user.name}. Actual expenditure: ₹ ${totalActual.toLocaleString('en-IN')} (Variance: ₹ ${variance.toLocaleString('en-IN')}). Awaiting administrative verification.`,
    });

    return NextResponse.json({
      message: 'Maintenance completion report submitted successfully. Awaiting administrative verification.',
      status: 'Awaiting Verification',
      actualCost: totalActual,
      costVariance: variance,
    });
  } catch (error) {
    console.error('POST /api/issues/[id]/completion error:', error);
    return NextResponse.json({ error: 'Failed to submit completion report.', details: error.message }, { status: 500 });
  }
}
