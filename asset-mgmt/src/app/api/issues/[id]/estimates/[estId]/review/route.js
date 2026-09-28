/**
 * Administrative Estimate Review API
 * 
 * POST /api/issues/[id]/estimates/[estId]/review
 * Allows Department Administrator to Approve, Request Revision, or Reject an estimate.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, canReviewEstimate } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: issueId, estId } = await params;

    // RBAC: Only Admin can review estimates
    const permission = canReviewEstimate(user);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: permission.reason },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { decision, remarks, approvedAmount } = body;

    const validDecisions = ['Approve', 'Request Revision', 'Reject'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        {
          error: 'Invalid decision.',
          message: `Decision must be one of: ${validDecisions.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    if ((decision === 'Request Revision' || decision === 'Reject') && (!remarks || !remarks.trim())) {
      return NextResponse.json(
        {
          error: 'Remarks required.',
          message: `Administrative remarks are required when choosing "${decision}".`,
        },
        { status: 400 }
      );
    }

    // Fetch estimate and issue
    const estRows = await query(
      `SELECT e.*, i.asset_id, i.status AS issue_status
       FROM estimates e
       JOIN issues i ON e.issue_id = i.id
       WHERE e.id = $1 AND e.issue_id = $2`,
      [estId, issueId]
    );

    if (!estRows || estRows.length === 0) {
      return NextResponse.json(
        { error: `Estimate "${estId}" not found for issue "${issueId}".` },
        { status: 404 }
      );
    }

    const estimate = estRows[0];
    const assetId = estimate.asset_id;

    if (decision === 'Approve') {
      const finalAmount = approvedAmount !== undefined && approvedAmount !== null
        ? Number(approvedAmount)
        : Number(estimate.total_estimated_cost);

      // Update estimate to Approved
      await query(
        `UPDATE estimates SET
           status = 'Approved',
           reviewed_by = $1,
           reviewed_by_name = $2,
           reviewed_at = NOW(),
           review_remarks = $3,
           approved_amount = $4
         WHERE id = $5`,
        [user.id, user.name, remarks?.trim() || 'Approved as submitted.', finalAmount, estId]
      );

      // Update issue to Approved
      await query(
        `UPDATE issues SET
           status = 'Approved',
           approval_status = 'Approved',
           approved_amount = $1,
           updated_at = NOW()
         WHERE id = $2`,
        [finalAmount, issueId]
      );

      // Activity Log
      await logActivity({
        assetId,
        issueId,
        action: ACTIVITY_ACTIONS.ESTIMATE_APPROVED,
        summary: `Estimate ${estId} (v${estimate.version}) approved by ${user.name} for ₹ ${finalAmount.toLocaleString('en-IN')}.`,
      });

      return NextResponse.json({
        message: `Estimate ${estId} successfully approved for ₹ ${finalAmount.toLocaleString('en-IN')}. Work order authorized.`,
        status: 'Approved',
        approvedAmount: finalAmount,
      });
    }

    if (decision === 'Request Revision') {
      // Update estimate to Revision Requested
      await query(
        `UPDATE estimates SET
           status = 'Revision Requested',
           reviewed_by = $1,
           reviewed_by_name = $2,
           reviewed_at = NOW(),
           review_remarks = $3
         WHERE id = $4`,
        [user.id, user.name, remarks.trim(), estId]
      );

      // Update issue back to Open so officer can revise
      await query(
        `UPDATE issues SET
           status = 'Open',
           approval_status = 'Revision Requested',
           updated_at = NOW()
         WHERE id = $1`,
        [issueId]
      );

      // Activity Log
      await logActivity({
        assetId,
        issueId,
        action: ACTIVITY_ACTIONS.ESTIMATE_REVISION_REQUESTED,
        summary: `Revision requested on Estimate ${estId} (v${estimate.version}) by ${user.name}: "${remarks.trim()}".`,
      });

      return NextResponse.json({
        message: `Revision requested on estimate ${estId}. Assigned officer has been notified.`,
        status: 'Revision Requested',
      });
    }

    if (decision === 'Reject') {
      // Update estimate to Rejected
      await query(
        `UPDATE estimates SET
           status = 'Rejected',
           reviewed_by = $1,
           reviewed_by_name = $2,
           reviewed_at = NOW(),
           review_remarks = $3
         WHERE id = $4`,
        [user.id, user.name, remarks.trim(), estId]
      );

      // Update issue
      await query(
        `UPDATE issues SET
           status = 'Open',
           approval_status = 'Rejected',
           updated_at = NOW()
         WHERE id = $1`,
        [issueId]
      );

      // Activity Log
      await logActivity({
        assetId,
        issueId,
        action: ACTIVITY_ACTIONS.ESTIMATE_REJECTED,
        summary: `Estimate ${estId} rejected by ${user.name}: "${remarks.trim()}".`,
      });

      return NextResponse.json({
        message: `Estimate ${estId} rejected.`,
        status: 'Rejected',
      });
    }
  } catch (error) {
    console.error('POST /api/issues/[id]/estimates/[estId]/review error:', error);
    return NextResponse.json(
      { error: 'Failed to process estimate review.', details: error.message },
      { status: 500 }
    );
  }
}
