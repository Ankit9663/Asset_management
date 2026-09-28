/**
 * PATCH /api/issues/[id]/complete
 * 
 * Dedicated endpoint to complete an issue.
 * Body: { resolutionNotes: string }
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { validateIssueTransition } from '@/lib/validators';
import { ACTIVITY_ACTIONS } from '@/lib/constants';

export async function PATCH(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await request.json();

    // Fetch existing issue
    const existing = await query(
      `SELECT i.*, a.name AS asset_name 
       FROM issues i 
       JOIN assets a ON i.asset_id = a.id 
       WHERE i.id = $1`,
      [id]
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Issue "${id}" not found.` },
        { status: 404 }
      );
    }

    const issue = existing[0];

    // Validate transition
    const validation = validateIssueTransition(issue.status, 'Completed', {
      assignedTo: issue.assigned_to,
      resolutionNotes: body.resolutionNotes,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Cannot complete issue.', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update
    await query(
      `UPDATE issues 
       SET status = 'Completed', resolution_notes = $1, completed_date = NOW() 
       WHERE id = $2`,
      [body.resolutionNotes.trim(), id]
    );

    // Log
    await logActivity({
      assetId: issue.asset_id,
      issueId: id,
      action: ACTIVITY_ACTIONS.ISSUE_COMPLETED,
      summary: `Issue ${id} on "${issue.asset_name}" marked as completed.`,
      oldValue: issue.status,
      newValue: 'Completed',
    });

    // Fetch updated
    const updated = await query(
      `SELECT i.*, a.name AS asset_name, a.category AS asset_category, o.name AS assigned_officer_name
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       LEFT JOIN officers o ON i.assigned_to = o.id
       WHERE i.id = $1`,
      [id]
    );

    return NextResponse.json({ issue: updated[0] });
  } catch (error) {
    console.error('PATCH /api/issues/[id]/complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete issue.', details: error.message },
      { status: 500 }
    );
  }
}
