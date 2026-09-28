/**
 * GET /api/issues  — List all issues with filters & category-specific RBAC
 * POST /api/issues — Create a new issue (linked to inspection or standalone)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { validateIssueCreation } from '@/lib/validators';
import { ACTIVITY_ACTIONS, SEEDED_USERS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canViewIssue } from '@/lib/auth';

/**
 * GET /api/issues
 * 
 * Query params:
 *   status    — Open | In Progress | Completed | etc.
 *   priority  — Low | Medium | High | Critical
 *   assetId   — filter by specific asset
 *   category  — filter by asset category (Road | Bridge | Building)
 *   assignedTo— filter by officer user id
 */
export async function GET(request) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assetId = searchParams.get('assetId');
    let category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');

    // Role-based Category Enforcement
    if (!isAdmin(user) && !isViewer(user)) {
      // Officer can only see issues within their category
      category = user.category;
    }

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`i.status = $${paramIdx++}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`i.priority = $${paramIdx++}`);
      params.push(priority);
    }

    if (assetId) {
      conditions.push(`i.asset_id = $${paramIdx++}`);
      params.push(assetId);
    }

    if (category) {
      conditions.push(`a.category = $${paramIdx++}`);
      params.push(category);
    }

    if (assignedTo) {
      conditions.push(`i.assigned_to = $${paramIdx++}`);
      params.push(assignedTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(
      `SELECT 
         i.id, i.asset_id, i.issue_category, i.description, i.priority,
         i.reported_by, i.assigned_to, i.assigned_officer_name,
         i.status, i.approval_status, i.approved_amount, i.current_estimate_id,
         i.actual_cost, i.cost_variance, i.variance_reason, i.originating_inspection_id,
         i.verification_status, i.verified_by, i.verified_at, i.verification_remarks,
         i.reported_date, i.resolution_notes, i.completed_date,
         a.name AS asset_name,
         a.category AS asset_category
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       ${whereClause}
       ORDER BY 
         CASE i.status 
           WHEN 'Pending Approval' THEN 1 
           WHEN 'Open' THEN 2 
           WHEN 'In Progress' THEN 3 
           WHEN 'Awaiting Verification' THEN 4 
           ELSE 5 
         END,
         CASE i.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         i.reported_date DESC`,
      params
    );

    return NextResponse.json({ issues: rows, total: rows.length });
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues
 * 
 * Body: { assetId, issueCategory, description, priority?, assignedTo?, originatingInspectionId? }
 */
export async function POST(request) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);

    if (isViewer(user)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Department Viewers have read-only access and cannot report issues.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.assetId) {
      return NextResponse.json(
        { error: 'assetId is required.' },
        { status: 400 }
      );
    }

    // Fetch the asset to check category and status
    const assetRows = await query('SELECT id, category, status, name FROM assets WHERE id = $1', [body.assetId]);
    if (!assetRows || assetRows.length === 0) {
      return NextResponse.json(
        { error: `Asset "${body.assetId}" not found.` },
        { status: 404 }
      );
    }

    const asset = assetRows[0];

    // Authorization: Category officer can only report issues on their category
    if (!isAdmin(user) && user.category !== asset.category) {
      return NextResponse.json(
        { error: 'Forbidden', message: `${user.designation} (${user.category}) cannot report issues on ${asset.category} assets.` },
        { status: 403 }
      );
    }

    // Business rule: no issues on retired assets
    if (asset.status === 'Retired') {
      return NextResponse.json(
        { error: `Cannot report an issue on retired asset "${asset.id}".` },
        { status: 400 }
      );
    }

    // Validate issue data against asset category
    const validation = validateIssueCreation(body, asset.category);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed.', errors: validation.errors },
        { status: 400 }
      );
    }

    // Resolve assigned officer name
    let assignedOfficerName = null;
    if (body.assignedTo) {
      const matched = SEEDED_USERS.find(u => u.id === body.assignedTo);
      assignedOfficerName = matched ? matched.name : null;
    }

    // Generate ID
    const id = await generateId('Issue');
    const reportedBy = user ? `${user.name} (${user.designation})` : 'System Officer';

    // Insert
    await query(
      `INSERT INTO issues (
         id, asset_id, issue_category, description, priority, reported_by,
         assigned_to, assigned_officer_name, originating_inspection_id, status, approval_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Open', 'None')`,
      [
        id,
        body.assetId,
        body.issueCategory,
        body.description.trim(),
        body.priority || 'Medium',
        reportedBy,
        body.assignedTo || null,
        assignedOfficerName,
        body.originatingInspectionId || null,
      ]
    );

    // Log activity
    await logActivity({
      assetId: body.assetId,
      issueId: id,
      action: ACTIVITY_ACTIONS.ISSUE_REPORTED,
      summary: `Issue ${id} reported on ${asset.name}: ${body.issueCategory} (${body.priority || 'Medium'} priority)${body.originatingInspectionId ? ` [Linked to Inspection ${body.originatingInspectionId}]` : ''}.`,
      actor: reportedBy,
    });

    if (body.assignedTo && assignedOfficerName) {
      await logActivity({
        assetId: body.assetId,
        issueId: id,
        action: ACTIVITY_ACTIONS.ISSUE_ASSIGNED,
        summary: `Issue ${id} assigned to ${assignedOfficerName}.`,
        actor: reportedBy,
      });
    }

    // Fetch created issue
    const rows = await query(
      `SELECT i.*, a.name AS asset_name, a.category AS asset_category
       FROM issues i 
       JOIN assets a ON i.asset_id = a.id
       WHERE i.id = $1`,
      [id]
    );

    return NextResponse.json({ issue: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue.', details: error.message },
      { status: 500 }
    );
  }
}
