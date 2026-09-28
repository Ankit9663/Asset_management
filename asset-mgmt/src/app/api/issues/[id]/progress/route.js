/**
 * Issue Work Progress API
 * 
 * GET  /api/issues/[id]/progress — Get work progress logs and actual expenditure items
 * POST /api/issues/[id]/progress — Add a progress update (transitions to In Progress if Approved)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, canViewIssue, canManageIssue } from '@/lib/auth';

export async function GET(request, { params }) {
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
    if (!canViewIssue(user, issue, issue.asset_category)) {
      return NextResponse.json({ error: 'Forbidden', message: 'Not authorized to view this issue.' }, { status: 403 });
    }

    const progressRows = await query(
      `SELECT * FROM issue_progress WHERE issue_id = $1 ORDER BY created_at DESC`,
      [issueId]
    );

    const actualItems = await query(
      `SELECT * FROM issue_actual_items WHERE issue_id = $1 ORDER BY id ASC`,
      [issueId]
    );

    return NextResponse.json({
      progress: progressRows || [],
      actualItems: actualItems || [],
    });
  } catch (error) {
    console.error('GET /api/issues/[id]/progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress logs.', details: error.message }, { status: 500 });
  }
}

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
      progressPercent,
      notes,
      workStartDate,
      expectedCompletionDate,
    } = body;

    const percent = Math.min(Math.max(Number(progressPercent) || 0, 0), 100);

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: 'Validation failed.', message: 'Progress update notes are required.' }, { status: 400 });
    }

    const startDate = workStartDate ? new Date(workStartDate) : null;
    const expDate = expectedCompletionDate ? new Date(expectedCompletionDate) : null;

    // Insert progress update
    const inserted = await query(
      `INSERT INTO issue_progress (
         issue_id, officer_id, officer_name, progress_percent,
         work_start_date, expected_completion_date, notes, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [issueId, user.id, user.name, percent, startDate, expDate, notes.trim()]
    );

    // If issue is currently 'Approved' or 'Open', move to 'In Progress'
    let statusChanged = false;
    if (issue.status === 'Approved' || issue.status === 'Open') {
      await query(
        `UPDATE issues SET status = 'In Progress', updated_at = NOW() WHERE id = $1`,
        [issueId]
      );
      statusChanged = true;
    }

    // Log Activity
    await logActivity({
      assetId: issue.asset_id,
      issueId,
      action: statusChanged ? ACTIVITY_ACTIONS.MAINTENANCE_STARTED : ACTIVITY_ACTIONS.PROGRESS_UPDATED,
      summary: `Work progress updated to ${percent}% by ${user.name}: "${notes.trim()}".`,
    });

    return NextResponse.json({
      progress: inserted[0],
      issueStatus: statusChanged ? 'In Progress' : issue.status,
      message: `Progress updated to ${percent}%.`,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/issues/[id]/progress error:', error);
    return NextResponse.json({ error: 'Failed to record progress update.', details: error.message }, { status: 500 });
  }
}
