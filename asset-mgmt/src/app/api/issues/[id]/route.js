import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { validateIssueTransition } from '@/lib/validators';
import { ACTIVITY_ACTIONS, SEEDED_USERS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canViewIssue, canManageIssue } from '@/lib/auth';

/**
 * GET /api/issues/[id]
 */
export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

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
       WHERE i.id = $1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: `Issue "${id}" not found.` },
        { status: 404 }
      );
    }

    const issue = rows[0];

    // Authorization: Category officer cannot view other category issues
    if (!canViewIssue(user, issue, issue.asset_category)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Access denied. ${user.designation} (${user.category}) is not authorized to access ${issue.asset_category} maintenance records.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('GET /api/issues/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/issues/[id]
 * 
 * Handles:
 *   - Assigning an officer (assignedTo) — Admin only
 *   - Status transitions (Open → In Progress, etc.)
 *   - Updating resolution notes
 *   - Updating description or priority
 * 
 * Body: { status?, assignedTo?, resolutionNotes?, description?, priority? }
 */
export async function PUT(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    // Fetch existing issue
    const existing = await query(
      `SELECT i.*, a.name AS asset_name, a.category AS asset_category
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

    // Check general issue management authorization
    const authCheck = canManageIssue(user, issue, issue.asset_category);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: authCheck.reason },
        { status: 403 }
      );
    }

    // Only Admin can assign / reassign issues
    if (body.assignedTo !== undefined && body.assignedTo !== issue.assigned_to) {
      if (!isAdmin(user)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Only Department Administrators can assign or reassign maintenance issues.' },
          { status: 403 }
        );
      }
    }
    const updates = [];
    const logEntries = [];

    // Handle status transition
    if (body.status && body.status !== issue.status) {
      const transitionData = {
        assignedTo: body.assignedTo ?? issue.assigned_to,
        resolutionNotes: body.resolutionNotes,
      };

      const validation = validateIssueTransition(issue.status, body.status, transitionData);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid transition.', errors: validation.errors },
          { status: 400 }
        );
      }

      updates.push(`status = '${body.status}'`);

      if (body.status === 'Completed') {
        updates.push(`completed_date = NOW()`);
        updates.push(`resolution_notes = '${body.resolutionNotes.trim().replace(/'/g, "''")}'`);

        logEntries.push({
          assetId: issue.asset_id,
          issueId: id,
          action: ACTIVITY_ACTIONS.ISSUE_COMPLETED,
          summary: `Issue ${id} on "${issue.asset_name}" marked as completed.`,
          oldValue: issue.status,
          newValue: 'Completed',
        });
      } else if (body.status === 'Open' && issue.status === 'Completed') {
        // Reopen
        updates.push(`completed_date = NULL`);
        updates.push(`resolution_notes = NULL`);

        logEntries.push({
          assetId: issue.asset_id,
          issueId: id,
          action: ACTIVITY_ACTIONS.ISSUE_REOPENED,
          summary: `Issue ${id} on "${issue.asset_name}" has been reopened.`,
          oldValue: 'Completed',
          newValue: 'Open',
        });
      } else {
        logEntries.push({
          assetId: issue.asset_id,
          issueId: id,
          action: ACTIVITY_ACTIONS.ISSUE_STATUS_UPDATED,
          summary: `Issue ${id} status changed from "${issue.status}" to "${body.status}".`,
          oldValue: issue.status,
          newValue: body.status,
        });
      }
    }

    // Handle assignment
    if (body.assignedTo !== undefined && body.assignedTo !== issue.assigned_to) {
      // Use parameterized query for assignment update
      // We'll handle this separately via direct parameterized update below
    }

    // Build parameterized update
    const setClauses = [];
    const updateParams = [];
    let pIdx = 1;

    if (body.status && body.status !== issue.status) {
      setClauses.push(`status = $${pIdx++}`);
      updateParams.push(body.status);

      if (body.status === 'Completed') {
        setClauses.push(`completed_date = NOW()`);
        setClauses.push(`resolution_notes = $${pIdx++}`);
        updateParams.push(body.resolutionNotes.trim());
      } else if (body.status === 'Open' && issue.status === 'Completed') {
        setClauses.push(`completed_date = NULL`);
        setClauses.push(`resolution_notes = NULL`);
      }
    }

    if (body.assignedTo !== undefined && String(body.assignedTo) !== String(issue.assigned_to)) {
      setClauses.push(`assigned_to = $${pIdx++}`);
      updateParams.push(body.assignedTo || null);

      let officerName = null;
      if (body.assignedTo) {
        const matched = SEEDED_USERS.find(u => u.id === body.assignedTo);
        if (matched) {
          officerName = matched.name;
        } else {
          const userRows = await query('SELECT name FROM users WHERE id = $1', [body.assignedTo]);
          officerName = userRows?.[0]?.name || String(body.assignedTo);
        }

        setClauses.push(`assigned_officer_name = $${pIdx++}`);
        updateParams.push(officerName);

        logEntries.push({
          assetId: issue.asset_id,
          issueId: id,
          action: ACTIVITY_ACTIONS.ISSUE_ASSIGNED,
          summary: `Issue ${id} assigned to ${officerName}.`,
          actor: user ? `${user.name} (${user.designation})` : 'Administrator',
        });
      } else {
        setClauses.push(`assigned_officer_name = NULL`);
      }
    }

    if (body.description && body.description !== issue.description) {
      setClauses.push(`description = $${pIdx++}`);
      updateParams.push(body.description.trim());
    }

    if (body.priority && body.priority !== issue.priority) {
      setClauses.push(`priority = $${pIdx++}`);
      updateParams.push(body.priority);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: 'No changes to apply.', issue });
    }

    // Add the WHERE clause parameter
    updateParams.push(id);
    const whereParam = `$${pIdx}`;

    await query(
      `UPDATE issues SET ${setClauses.join(', ')} WHERE id = ${whereParam}`,
      updateParams
    );

    // Log all activities
    for (const entry of logEntries) {
      await logActivity(entry);
    }

    // Fetch updated issue
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
    console.error('PUT /api/issues/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update issue.', details: error.message },
      { status: 500 }
    );
  }
}
