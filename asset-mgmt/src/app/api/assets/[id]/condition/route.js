/**
 * PATCH /api/assets/[id]/condition
 * 
 * Update an asset's condition. Separate endpoint for dedicated tracking.
 * Body: { condition: 'Good' | 'Fair' | 'Poor' | 'Critical' }
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ASSET_CONDITIONS, ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, isViewer, canViewAsset } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (isViewer(user)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Department Viewers have read-only access and cannot update asset conditions.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.condition || !ASSET_CONDITIONS.includes(body.condition)) {
      return NextResponse.json(
        { error: `Invalid condition. Must be one of: ${ASSET_CONDITIONS.join(', ')}.` },
        { status: 400 }
      );
    }

    // Fetch existing
    const existing = await query('SELECT id, category, condition, status FROM assets WHERE id = $1', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Asset "${id}" not found.` },
        { status: 404 }
      );
    }

    const asset = existing[0];

    // Category restriction
    if (!canViewAsset(user, asset)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `${user.designation} (${user.category}) cannot modify ${asset.category} conditions.` },
        { status: 403 }
      );
    }
    const oldCondition = asset.condition;

    if (oldCondition === body.condition) {
      return NextResponse.json({ message: 'Condition unchanged.', asset });
    }

    // Update
    await query(
      'UPDATE assets SET condition = $1, updated_at = NOW() WHERE id = $2',
      [body.condition, id]
    );

    // Log
    await logActivity({
      assetId: id,
      action: ACTIVITY_ACTIONS.CONDITION_UPDATED,
      summary: `Condition of asset ${id} updated from "${oldCondition}" to "${body.condition}".`,
      oldValue: oldCondition,
      newValue: body.condition,
    });

    // Return updated asset
    const updated = await query('SELECT * FROM assets WHERE id = $1', [id]);
    return NextResponse.json({ asset: updated[0] });
  } catch (error) {
    console.error('PATCH /api/assets/[id]/condition error:', error);
    return NextResponse.json(
      { error: 'Failed to update condition.', details: error.message },
      { status: 500 }
    );
  }
}
