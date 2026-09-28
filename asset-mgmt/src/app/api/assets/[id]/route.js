/**
 * GET /api/assets/[id]  — Get a single asset with related counts
 * PUT /api/assets/[id]  — Edit an asset (category is locked)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { validateAssetCore, validateAssetDetails } from '@/lib/validators';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canViewAsset, canManageAsset } from '@/lib/auth';

/**
 * GET /api/assets/[id]
 * 
 * Returns the full asset record plus:
 *   - division_name
 *   - open_issues count
 *   - total_issues count
 */
export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    const rows = await query(
      `SELECT 
         a.id, a.category, a.type, a.name, a.district, a.address,
         a.latitude, a.longitude, a.division_id, a.condition, a.status,
         a.construction_date, a.commissioning_date, a.construction_cost,
         a.funding_source, a.warranty_expiry_date, a.last_renovation_date, a.book_value,
         a.details, a.created_at, a.updated_at,
         d.name AS division_name,
         (SELECT COUNT(*) FROM issues i WHERE i.asset_id = a.id) AS total_issues,
         (SELECT COUNT(*) FROM issues i WHERE i.asset_id = a.id AND i.status != 'Completed') AS open_issues
       FROM assets a
       LEFT JOIN divisions d ON a.division_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: `Asset "${id}" not found.` },
        { status: 404 }
      );
    }

    const asset = rows[0];

    // Authorization: Category officers can only view assets matching their category
    if (!canViewAsset(user, asset)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Access denied. ${user.designation} (${user.category}) is not authorized to access ${asset.category} assets.`,
        },
        { status: 403 }
      );
    }

    // Financial & maintenance aggregations for completed issues
    const maintStats = await query(
      `SELECT 
         COUNT(*) AS completed_issues,
         COALESCE(SUM(COALESCE(actual_cost, approved_amount, 0)), 0) AS cumulative_maintenance_cost
       FROM issues 
       WHERE asset_id = $1 AND status = 'Completed'`,
      [id]
    );

    // Most recent completed maintenance job
    const recentMaint = await query(
      `SELECT id, COALESCE(actual_cost, approved_amount, 0) AS actual_cost, 
              COALESCE(completed_date, reported_date, NOW()) AS updated_at
       FROM issues 
       WHERE asset_id = $1 AND status = 'Completed'
       ORDER BY COALESCE(completed_date, reported_date, NOW()) DESC LIMIT 1`,
      [id]
    );

    // Latest periodic inspection
    const recentInsp = await query(
      `SELECT * FROM inspections 
       WHERE asset_id = $1 
       ORDER BY inspection_date DESC LIMIT 1`,
      [id]
    );

    // Total inspections count
    const inspCount = await query(
      `SELECT COUNT(*) AS total_inspections FROM inspections WHERE asset_id = $1`,
      [id]
    );

    // Recurring issue detection (>= 2 issues in same category on this asset)
    const recurringRows = await query(
      `SELECT issue_category, COUNT(*) AS count
       FROM issues
       WHERE asset_id = $1
       GROUP BY issue_category
       HAVING COUNT(*) >= 2`,
      [id]
    );

    asset.completed_issues = Number(maintStats[0]?.completed_issues || 0);
    asset.cumulative_maintenance_cost = Number(maintStats[0]?.cumulative_maintenance_cost || 0);
    asset.most_recent_maintenance_date = recentMaint[0]?.updated_at || null;
    asset.most_recent_maintenance_cost = recentMaint[0]?.actual_cost ? Number(recentMaint[0].actual_cost) : null;
    asset.last_inspection = recentInsp[0] || null;
    asset.total_inspections = Number(inspCount[0]?.total_inspections || 0);
    asset.recurring_issues = recurringRows || [];

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('GET /api/assets/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assets/[id]
 * 
 * Edit an asset. Category is locked (cannot be changed after creation).
 * Body: { type?, name?, district?, address?, latitude?, longitude?,
 *         divisionId?, condition?, details? }
 */
export async function PUT(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!canManageAsset(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only Department Administrators are authorized to edit asset specifications.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Fetch existing asset
    const existing = await query('SELECT * FROM assets WHERE id = $1', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Asset "${id}" not found.` },
        { status: 404 }
      );
    }

    const asset = existing[0];

    // Category is locked — use existing
    const updatedData = {
      category: asset.category,
      type: body.type ?? asset.type,
      name: body.name ?? asset.name,
      district: body.district ?? asset.district,
      address: body.address !== undefined ? body.address : asset.address,
      latitude: body.latitude !== undefined ? body.latitude : asset.latitude,
      longitude: body.longitude !== undefined ? body.longitude : asset.longitude,
      divisionId: body.divisionId ?? asset.division_id,
      condition: body.condition ?? asset.condition,
      status: asset.status, // status is not editable via PUT
      details: body.details ?? (typeof asset.details === 'string' ? JSON.parse(asset.details) : asset.details),
    };

    // Validate core fields
    const coreResult = validateAssetCore(updatedData);
    if (!coreResult.valid) {
      return NextResponse.json(
        { error: 'Validation failed.', errors: coreResult.errors },
        { status: 400 }
      );
    }

    // Validate category-specific details
    const detailsResult = validateAssetDetails(asset.category, updatedData.details);
    if (!detailsResult.valid) {
      return NextResponse.json(
        { error: 'Validation failed.', errors: detailsResult.errors },
        { status: 400 }
      );
    }

    // Build summary of changes for activity log
    const changes = [];
    if (updatedData.name !== asset.name) changes.push(`name: "${asset.name}" → "${updatedData.name}"`);
    if (updatedData.type !== asset.type) changes.push(`type: "${asset.type}" → "${updatedData.type}"`);
    if (updatedData.district !== asset.district) changes.push(`district: "${asset.district}" → "${updatedData.district}"`);
    if (String(updatedData.divisionId) !== String(asset.division_id)) changes.push(`division updated`);
    if (updatedData.condition !== asset.condition) changes.push(`condition: "${asset.condition}" → "${updatedData.condition}"`);

    // Update
    await query(
      `UPDATE assets SET
         type = $1, name = $2, district = $3, address = $4,
         latitude = $5, longitude = $6, division_id = $7,
         condition = $8, details = $9, updated_at = NOW()
       WHERE id = $10`,
      [
        updatedData.type,
        updatedData.name.trim(),
        updatedData.district,
        updatedData.address?.trim() || null,
        updatedData.latitude ? Number(updatedData.latitude) : null,
        updatedData.longitude ? Number(updatedData.longitude) : null,
        Number(updatedData.divisionId),
        updatedData.condition,
        updatedData.details ? JSON.stringify(updatedData.details) : null,
        id,
      ]
    );

    // Log activity
    if (changes.length > 0) {
      await logActivity({
        assetId: id,
        action: ACTIVITY_ACTIONS.ASSET_EDITED,
        summary: `Asset ${id} edited: ${changes.join('; ')}.`,
      });
    }

    // Return updated asset
    const updated = await query(
      `SELECT a.*, d.name AS division_name
       FROM assets a LEFT JOIN divisions d ON a.division_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    return NextResponse.json({ asset: updated[0] });
  } catch (error) {
    console.error('PUT /api/assets/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update asset.', details: error.message },
      { status: 500 }
    );
  }
}
