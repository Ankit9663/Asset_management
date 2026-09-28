/**
 * PATCH /api/assets/[id]/retire
 * 
 * Retire an asset. Warns if open issues exist but proceeds.
 * Body: (none required)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';

export async function PATCH(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;

    // Fetch existing
    const existing = await query('SELECT id, name, status FROM assets WHERE id = $1', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Asset "${id}" not found.` },
        { status: 404 }
      );
    }

    const asset = existing[0];

    if (asset.status === 'Retired') {
      return NextResponse.json(
        { error: `Asset "${id}" is already retired.` },
        { status: 400 }
      );
    }

    // Check for open issues — warn but don't block
    const openIssues = await query(
      `SELECT id, issue_category, priority, status 
       FROM issues 
       WHERE asset_id = $1 AND status != 'Completed'`,
      [id]
    );

    const warning = openIssues.length > 0
      ? `Warning: ${openIssues.length} open issue(s) exist for this asset. They remain unresolved.`
      : null;

    // Retire
    await query(
      "UPDATE assets SET status = 'Retired', updated_at = NOW() WHERE id = $1",
      [id]
    );

    // Log
    await logActivity({
      assetId: id,
      action: ACTIVITY_ACTIONS.ASSET_RETIRED,
      summary: `Asset ${id} "${asset.name}" has been retired.${warning ? ` ${warning}` : ''}`,
      oldValue: asset.status,
      newValue: 'Retired',
    });

    return NextResponse.json({
      message: `Asset "${id}" retired successfully.`,
      warning,
      openIssues: openIssues.length > 0 ? openIssues : undefined,
    });
  } catch (error) {
    console.error('PATCH /api/assets/[id]/retire error:', error);
    return NextResponse.json(
      { error: 'Failed to retire asset.', details: error.message },
      { status: 500 }
    );
  }
}
