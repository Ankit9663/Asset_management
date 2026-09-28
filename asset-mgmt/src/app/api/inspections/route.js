/**
 * Periodic Inspections API
 * 
 * GET  /api/inspections           — List inspections (optional ?assetId=...)
 * POST /api/inspections           — Record a new periodic inspection
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS, INSPECTION_TYPES, CONDITIONS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canViewAsset, canRecordInspection } from '@/lib/auth';

/**
 * GET /api/inspections
 * Query params:
 *   - assetId: filter by asset
 *   - limit: maximum rows (default 100)
 */
export async function GET(request) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    let sql = `
      SELECT 
        i.*,
        a.name AS asset_name,
        a.category AS asset_category,
        a.type AS asset_type,
        a.district AS asset_district
      FROM inspections i
      JOIN assets a ON i.asset_id = a.id
    `;
    const params = [];

    const conditions = [];

    if (assetId) {
      params.push(assetId);
      conditions.push(`i.asset_id = $${params.length}`);
    }

    // Role-based visibility: Category officers only see inspections for their category
    if (!isAdmin(user) && !isViewer(user) && user.category !== 'ALL') {
      params.push(user.category);
      conditions.push(`a.category = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY i.inspection_date DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const inspections = await query(sql, params);

    return NextResponse.json({ inspections: inspections || [] });
  } catch (error) {
    console.error('GET /api/inspections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inspections
 * Body:
 *   - assetId (required)
 *   - inspectionType ('Routine' | 'Pre-Monsoon' | 'Post-Monsoon' | 'Emergency' | 'Special')
 *   - conditionAssessment ('Good' | 'Fair' | 'Poor' | 'Critical')
 *   - observations (required string)
 *   - defectsIdentified (string)
 *   - recommendedActions (string)
 *   - nextDueDate (ISO string / date)
 *   - checklist (object JSON)
 *   - inspectionDate (optional, defaults to NOW())
 */
export async function POST(request) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const {
      assetId,
      inspectionType = 'Routine',
      conditionAssessment = 'Good',
      observations,
      defectsIdentified,
      recommendedActions,
      nextDueDate,
      checklist,
      inspectionDate,
    } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'assetId is required.' },
        { status: 400 }
      );
    }

    if (!observations || !observations.trim()) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'Inspection observations are required.' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const assetRows = await query('SELECT * FROM assets WHERE id = $1', [assetId]);
    if (!assetRows || assetRows.length === 0) {
      return NextResponse.json(
        { error: `Asset "${assetId}" not found.` },
        { status: 404 }
      );
    }
    const asset = assetRows[0];

    // Check permission
    const permission = canRecordInspection(user, asset);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: permission.reason },
        { status: 403 }
      );
    }

    const id = await generateId('Inspection');
    const inspDate = inspectionDate ? new Date(inspectionDate) : new Date();
    const dueDate = nextDueDate ? new Date(nextDueDate) : null;

    // Insert inspection
    await query(
      `INSERT INTO inspections (
        id, asset_id, inspection_date, inspector_id, inspector_name,
        inspection_type, condition_assessment, observations,
        defects_identified, recommended_actions, next_due_date,
        checklist, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        id,
        assetId,
        inspDate,
        user.id,
        user.name,
        inspectionType,
        conditionAssessment,
        observations.trim(),
        defectsIdentified ? defectsIdentified.trim() : null,
        recommendedActions ? recommendedActions.trim() : null,
        dueDate,
        checklist ? JSON.stringify(checklist) : null,
      ]
    );

    // Update asset condition to match latest inspection
    await query(
      `UPDATE assets 
       SET condition = $1, updated_at = NOW() 
       WHERE id = $2`,
      [conditionAssessment, assetId]
    );

    // Log Activity
    await logActivity({
      assetId,
      action: ACTIVITY_ACTIONS.INSPECTION_RECORDED,
      summary: `Periodic ${inspectionType} inspection recorded by ${user.name}. Condition assessed as ${conditionAssessment}.`,
    });

    const insertedRows = await query(
      `SELECT i.*, a.name AS asset_name, a.category AS asset_category 
       FROM inspections i 
       JOIN assets a ON i.asset_id = a.id 
       WHERE i.id = $1`,
      [id]
    );

    return NextResponse.json(
      { inspection: insertedRows[0], message: 'Inspection recorded successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/inspections error:', error);
    return NextResponse.json(
      { error: 'Failed to record inspection.', details: error.message },
      { status: 500 }
    );
  }
}
