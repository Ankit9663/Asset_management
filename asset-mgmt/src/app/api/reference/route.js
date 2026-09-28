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
  ASSET_DETAIL_FIELDS, INSPECTION_TYPES, INSPECTION_CHECKLISTS,
  SEEDED_USERS, DIVISIONS,
} from '@/lib/constants';

export async function GET() {
  try {
    await ensureSchema();

    let divisions = DIVISIONS;
    try {
      const dbDivisions = await query('SELECT id, name FROM divisions ORDER BY id');
      if (dbDivisions && dbDivisions.length > 0) divisions = dbDivisions;
    } catch (e) {}

    // Category-specific officers for assignment
    const officers = SEEDED_USERS.filter(u => u.role !== 'VIEWER').map(u => ({
      id: u.id,
      name: `${u.name} (${u.designation.replace(' Maintenance Officer', '')} - ${u.divisionName})`,
      rawName: u.name,
      role: u.role,
      category: u.category,
      divisionName: u.divisionName,
      divisionId: u.divisionId,
    }));

    return NextResponse.json({
      divisions,
      officers,
      districts: DISTRICTS,
      assetCategories: ASSET_CATEGORIES,
      assetTypes: ASSET_TYPES,
      assetConditions: ASSET_CONDITIONS,
      assetStatuses: ASSET_STATUSES,
      assetDetailFields: ASSET_DETAIL_FIELDS,
      inspectionTypes: INSPECTION_TYPES,
      inspectionChecklists: INSPECTION_CHECKLISTS,
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
