/**
 * POST /api/inspections/[id]/create-issue
 * Convert an inspection finding with defects into an active maintenance issue.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS, ISSUE_CATEGORIES, SEEDED_USERS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canRecordInspection } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: inspectionId } = await params;

    // Viewers cannot create issues
    if (isViewer(user)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Department Viewers have read-only access.' },
        { status: 403 }
      );
    }

    // Fetch the inspection and associated asset
    const inspRows = await query(
      `SELECT i.*, a.category AS asset_category, a.division_id, a.name AS asset_name
       FROM inspections i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.id = $1`,
      [inspectionId]
    );

    if (!inspRows || inspRows.length === 0) {
      return NextResponse.json(
        { error: `Inspection "${inspectionId}" not found.` },
        { status: 404 }
      );
    }

    const inspection = inspRows[0];

    // Check category authorization
    if (!isAdmin(user) && user.category !== inspection.asset_category) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `${user.designation} (${user.category}) cannot create issues for ${inspection.asset_category} assets.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Choose default issue category for this asset category if not specified
    const validCategories = ISSUE_CATEGORIES[inspection.asset_category] || ['Maintenance Required'];
    const chosenCategory = body.issueCategory && validCategories.includes(body.issueCategory)
      ? body.issueCategory
      : validCategories[0];

    const description = body.description?.trim() ||
      inspection.defects_identified ||
      `Issue identified during ${inspection.inspection_type} inspection: ${inspection.observations}`;

    // Priority based on condition or body
    let priority = body.priority || 'Medium';
    if (!body.priority) {
      if (inspection.condition_assessment === 'Critical') priority = 'Critical';
      else if (inspection.condition_assessment === 'Poor') priority = 'High';
      else if (inspection.condition_assessment === 'Fair') priority = 'Medium';
      else priority = 'Low';
    }

    // Assignment: either explicitly provided or default to current user if officer
    let assignedTo = body.assignedTo || null;
    let assignedOfficerName = null;
    if (assignedTo) {
      const officer = SEEDED_USERS.find(u => u.id === assignedTo);
      assignedOfficerName = officer ? officer.name : null;
    } else if (!isAdmin(user)) {
      assignedTo = user.id;
      assignedOfficerName = user.name;
    }

    const issueId = await generateId('Issue');

    await query(
      `INSERT INTO issues (
        id, asset_id, issue_category, description, priority,
        reported_by, assigned_to, assigned_officer_name, status,
        originating_inspection_id, reported_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', $9, NOW())`,
      [
        issueId,
        inspection.asset_id,
        chosenCategory,
        description,
        priority,
        user.name,
        assignedTo,
        assignedOfficerName,
        inspectionId,
      ]
    );

    // Activity log
    await logActivity({
      assetId: inspection.asset_id,
      issueId,
      action: ACTIVITY_ACTIONS.ISSUE_REPORTED,
      summary: `Issue ${issueId} generated from inspection ${inspectionId} by ${user.name} (${priority} Priority).`,
    });

    const newIssue = await query('SELECT * FROM issues WHERE id = $1', [issueId]);

    return NextResponse.json(
      {
        issue: newIssue[0],
        message: `Issue ${issueId} successfully generated from inspection findings.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/inspections/[id]/create-issue error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue from inspection.', details: error.message },
      { status: 500 }
    );
  }
}
