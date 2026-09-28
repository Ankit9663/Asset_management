/**
 * GET /api/assets  — List assets with filters & search
 * POST /api/assets — Create a new asset
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { validateAsset } from '@/lib/validators';
import { ACTIVITY_ACTIONS, STATIC_USER } from '@/lib/constants';

/**
 * GET /api/assets
 * 
 * Query params:
 *   search    — filter by name or ID (ILIKE)
 *   category  — Road | Bridge | Building
 *   district  — exact match
 *   division  — division_id
 *   condition — Good | Fair | Poor | Critical
 *   status    — Active | Under Maintenance | Retired (defaults to exclude Retired)
 */
export async function GET(request) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const district = searchParams.get('district');
    const division = searchParams.get('division');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status');

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    // Default: exclude Retired unless explicitly requested
    if (status) {
      conditions.push(`a.status = $${paramIdx++}`);
      params.push(status);
    } else {
      conditions.push(`a.status != 'Retired'`);
    }

    if (search) {
      conditions.push(`(a.name ILIKE $${paramIdx} OR a.id ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`a.category = $${paramIdx++}`);
      params.push(category);
    }

    if (district) {
      conditions.push(`a.district = $${paramIdx++}`);
      params.push(district);
    }

    if (division) {
      conditions.push(`a.division_id = $${paramIdx++}`);
      params.push(Number(division));
    }

    if (condition) {
      conditions.push(`a.condition = $${paramIdx++}`);
      params.push(condition);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(
      `SELECT 
         a.id, a.category, a.type, a.name, a.district, a.address,
         a.latitude, a.longitude, a.division_id, a.condition, a.status,
         a.details, a.created_at, a.updated_at,
         d.name AS division_name,
         (SELECT COUNT(*) FROM issues i WHERE i.asset_id = a.id AND i.status != 'Completed') AS open_issues
       FROM assets a
       LEFT JOIN divisions d ON a.division_id = d.id
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );

    return NextResponse.json({ assets: rows, total: rows.length });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assets
 * 
 * Body: { category, type, name, district, address?, latitude?, longitude?,
 *         divisionId, condition?, details: { ...category-specific } }
 */
export async function POST(request) {
  try {
    await ensureSchema();

    const body = await request.json();

    // Validate
    const validation = validateAsset(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed.', errors: validation.errors },
        { status: 400 }
      );
    }

    // Generate ID
    const id = await generateId(body.category);

    // Insert
    await query(
      `INSERT INTO assets (id, category, type, name, district, address, latitude, longitude, division_id, condition, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        body.category,
        body.type,
        body.name.trim(),
        body.district,
        body.address?.trim() || null,
        body.latitude ? Number(body.latitude) : null,
        body.longitude ? Number(body.longitude) : null,
        Number(body.divisionId),
        body.condition || 'Good',
        'Active',
        body.details ? JSON.stringify(body.details) : null,
      ]
    );

    // Log activity
    await logActivity({
      assetId: id,
      action: ACTIVITY_ACTIONS.ASSET_REGISTERED,
      summary: `New ${body.category.toLowerCase()} asset "${body.name.trim()}" registered as ${id}.`,
    });

    // Fetch the created asset
    const rows = await query('SELECT * FROM assets WHERE id = $1', [id]);

    return NextResponse.json({ asset: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to create asset.', details: error.message },
      { status: 500 }
    );
  }
}
