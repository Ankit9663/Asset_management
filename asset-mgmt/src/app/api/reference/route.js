/**
 * GET /api/reference
 * 
 * Returns all reference/dropdown data: divisions, officers, districts.
 * Used by forms to populate dropdowns without hardcoding on the client.
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import {
  DISTRICTS, ASSET_CATEGORIES, ASSET_TYPES, ASSET_CONDITIONS,
  ASSET_STATUSES, ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES,
  ASSET_DETAIL_FIELDS,
} from '@/lib/constants';

export async function GET() {
  try {
    await ensureSchema();

    const divisions = await query('SELECT id, name FROM divisions ORDER BY id');
    const officers = await query(`
      SELECT o.id, o.name, o.division_id AS "divisionId", d.name AS "divisionName"
      FROM officers o
      JOIN divisions d ON o.division_id = d.id
      ORDER BY o.id
    `);

    return NextResponse.json({
      divisions,
      officers,
      districts: DISTRICTS,
      assetCategories: ASSET_CATEGORIES,
      assetTypes: ASSET_TYPES,
      assetConditions: ASSET_CONDITIONS,
      assetStatuses: ASSET_STATUSES,
      assetDetailFields: ASSET_DETAIL_FIELDS,
      issueCategories: ISSUE_CATEGORIES,
      issuePriorities: ISSUE_PRIORITIES,
      issueStatuses: ISSUE_STATUSES,
    });
  } catch (error) {
    console.error('Reference API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference data.' },
      { status: 500 }
    );
  }
}
