/**
 * Maintenance Completion Verification API
 * 
 * POST /api/issues/[id]/verify
 * Allows Department Administrator to officially verify or reject completed maintenance work.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, canVerifyCompletion } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: issueId } = await params;

    // RBAC: Only Admin can verify
    const permission = canVerifyCompletion(user);
    if (!permission.allowed) {
      return NextResponse.json({ error: 'Forbidden', message: permission.reason }, { status: 403 });
    }

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
    const body = await request.json();
    const { decision, verificationRemarks } = body;

    if (!['Verified', 'Rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision.', message: 'Decision must be either "Verified" or "Rejected".' },
        { status: 400 }
      );
    }

    if (decision === 'Rejected' && (!verificationRemarks || !verificationRemarks.trim())) {
      return NextResponse.json(
        { error: 'Remarks required.', message: 'Audit remarks are required when rejecting completion.' },
        { status: 400 }
      );
    }

    if (decision === 'Verified') {
      await query(
        `UPDATE issues SET
           status = 'Completed',
           verification_status = 'Verified',
           verified_by = $1,
           verified_at = NOW(),
           verification_remarks = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [user.name, verificationRemarks?.trim() || 'Work verified and approved according to department standards.', issueId]
      );

      // Activity Log
      await logActivity({
        assetId: issue.asset_id,
        issueId,
        action: ACTIVITY_ACTIONS.COMPLETION_VERIFIED,
        summary: `Maintenance work officially verified by ${user.name}. Work order completed and signed off.`,
      });

      await logActivity({
        assetId: issue.asset_id,
        issueId,
        action: ACTIVITY_ACTIONS.ISSUE_COMPLETED,
        summary: `Issue ${issueId} closed and marked Completed after official administrative verification.`,
      });

      return NextResponse.json({
        message: `Maintenance work officially verified by ${user.name}. Work order is now completed and closed.`,
        status: 'Completed',
        verificationStatus: 'Verified',
      });
    }

    if (decision === 'Rejected') {
      await query(
        `UPDATE issues SET
           status = 'In Progress',
           verification_status = 'Verification Rejected',
           verification_remarks = $1,
           updated_at = NOW()
         WHERE id = $2`,
        [verificationRemarks.trim(), issueId]
      );

      // Activity Log
      await logActivity({
        assetId: issue.asset_id,
        issueId,
        action: ACTIVITY_ACTIONS.PROGRESS_UPDATED,
        summary: `Maintenance completion rejected by ${user.name}: "${verificationRemarks.trim()}". Returned for remediation.`,
      });

      return NextResponse.json({
        message: 'Completion rejected. Work order returned to executing officer for remediation.',
        status: 'In Progress',
        verificationStatus: 'Verification Rejected',
      });
    }
  } catch (error) {
    console.error('POST /api/issues/[id]/verify error:', error);
    return NextResponse.json({ error: 'Failed to verify maintenance completion.', details: error.message }, { status: 500 });
  }
}
