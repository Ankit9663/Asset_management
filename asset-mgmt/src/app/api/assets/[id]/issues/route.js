/**
 * GET /api/assets/[id]/issues
 * 
 * Returns all issues for a specific asset.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const { id } = await params;

    // Verify asset exists
    const asset = await query('SELECT id FROM assets WHERE id = $1', [id]);
    if (!asset || asset.length === 0) {
      return NextResponse.json(
        { error: `Asset "${id}" not found.` },
        { status: 404 }
      );
    }

    const rows = await query(
      `SELECT 
         i.id, i.asset_id, i.issue_category, i.description, i.priority,
         i.reported_by, i.assigned_to, i.status, i.reported_date,
         i.resolution_notes, i.completed_date,
         o.name AS assigned_officer_name
       FROM issues i
       LEFT JOIN officers o ON i.assigned_to = o.id
       WHERE i.asset_id = $1
       ORDER BY 
         CASE i.status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
         CASE i.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         i.reported_date DESC`,
      [id]
    );

    return NextResponse.json({ issues: rows });
  } catch (error) {
    console.error('GET /api/assets/[id]/issues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues for asset.', details: error.message },
      { status: 500 }
    );
  }
}
