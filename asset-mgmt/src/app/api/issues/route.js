/**
 * GET /api/issues  — List all issues with filters
 * POST /api/issues — Create a new issue
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { validateIssueCreation } from '@/lib/validators';
import { ACTIVITY_ACTIONS, STATIC_USER } from '@/lib/constants';

/**
 * GET /api/issues
 * 
 * Query params:
 *   status   — Open | In Progress | Completed
 *   priority — Low | Medium | High | Critical
 *   assetId  — filter by specific asset
 *   category — filter by asset category (Road | Bridge | Building)
 */
export async function GET(request) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assetId = searchParams.get('assetId');
    const category = searchParams.get('category');

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(
      `SELECT 
         i.id, i.asset_id, i.issue_category, i.description, i.priority,
         i.reported_by, i.assigned_to, i.status, i.reported_date,
         i.resolution_notes, i.completed_date,
         a.name AS asset_name,
         a.category AS asset_category,
         o.name AS assigned_officer_name
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       LEFT JOIN officers o ON i.assigned_to = o.id
       ${whereClause}
       ORDER BY 
         CASE i.status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
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
 * Body: { assetId, issueCategory, description, priority?, reportedBy? }
 */
export async function POST(request) {
  try {
    await ensureSchema();

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

    // Generate ID
    const id = await generateId('Issue');

    // Insert
    await query(
      `INSERT INTO issues (id, asset_id, issue_category, description, priority, reported_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Open')`,
      [
        id,
        body.assetId,
        body.issueCategory,
        body.description.trim(),
        body.priority || 'Medium',
        body.reportedBy || STATIC_USER,
      ]
    );

    // Log activity
    await logActivity({
      assetId: body.assetId,
      issueId: id,
      action: ACTIVITY_ACTIONS.ISSUE_REPORTED,
      summary: `Issue ${id} reported on ${asset.name}: ${body.issueCategory} (${body.priority || 'Medium'} priority).`,
    });

    // Fetch created issue
    const rows = await query(
      `SELECT i.*, o.name AS assigned_officer_name 
       FROM issues i 
       LEFT JOIN officers o ON i.assigned_to = o.id 
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
