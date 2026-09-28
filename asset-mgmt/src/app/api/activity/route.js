/**
 * GET /api/activity
 * 
 * Returns recent global activity log entries.
 * Query params:
 *   limit — max entries (default 20)
 */

import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getRecentActivity } from '@/lib/activity-logger';

export async function GET(request) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100);

    const activity = await getRecentActivity(limit);

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log.', details: error.message },
      { status: 500 }
    );
  }
}
