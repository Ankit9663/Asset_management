/**
 * GET /api/assets/[id]/activity
 * 
 * Returns activity log entries for a specific asset.
 */

import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getAssetActivity } from '@/lib/activity-logger';

export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;

    const rows = await getAssetActivity(id);

    return NextResponse.json({ activity: rows });
  } catch (error) {
    console.error('GET /api/assets/[id]/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity for asset.', details: error.message },
      { status: 500 }
    );
  }
}
