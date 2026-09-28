/**
 * Maintenance Cost Estimates API (Multi-Version & Component-Wise)
 * 
 * GET  /api/issues/[id]/estimates — Retrieve all estimate versions with line items
 * POST /api/issues/[id]/estimates — Submit a new component-wise cost estimate (or revised version)
 */

import { NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/db';
import { generateId } from '@/lib/id-generator';
import { logActivity } from '@/lib/activity-logger';
import { ACTIVITY_ACTIONS } from '@/lib/constants';
import { getAuthenticatedUser, isAdmin, isViewer, canViewIssue, canManageIssue } from '@/lib/auth';

/**
 * GET /api/issues/[id]/estimates
 * Returns all estimate versions for this issue with line items.
 */
export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: issueId } = await params;

    // Check issue & access
    const issueRows = await query(
      `SELECT i.*, a.category AS asset_category
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.id = $1`,
      [issueId]
    );

    if (!issueRows || issueRows.length === 0) {
      return NextResponse.json(
        { error: `Issue "${issueId}" not found.` },
        { status: 404 }
      );
    }

    const issue = issueRows[0];
    if (!canViewIssue(user, issue, issue.asset_category)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You are not authorized to view this issue.' },
        { status: 403 }
      );
    }

    // Fetch estimates ordered by version DESC
    const estimates = await query(
      `SELECT * FROM estimates WHERE issue_id = $1 ORDER BY version DESC`,
      [issueId]
    );

    if (estimates && estimates.length > 0) {
      const estimateIds = estimates.map(e => e.id);
      const items = await query(
        `SELECT * FROM estimate_items WHERE estimate_id = ANY($1) ORDER BY id ASC`,
        [estimateIds]
      );

      // Group items by estimate_id
      const itemMap = {};
      items.forEach(item => {
        if (!itemMap[item.estimate_id]) itemMap[item.estimate_id] = [];
        itemMap[item.estimate_id].push(item);
      });

      estimates.forEach(est => {
        est.items = itemMap[est.id] || [];
      });
    }

    return NextResponse.json({ estimates: estimates || [] });
  } catch (error) {
    console.error('GET /api/issues/[id]/estimates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues/[id]/estimates
 * Submit a component-wise estimate version
 */
export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const user = await getAuthenticatedUser(request);
    const { id: issueId } = await params;

    // Fetch issue and asset category
    const issueRows = await query(
      `SELECT i.*, a.category AS asset_category
       FROM issues i
       JOIN assets a ON i.asset_id = a.id
       WHERE i.id = $1`,
      [issueId]
    );

    if (!issueRows || issueRows.length === 0) {
      return NextResponse.json(
        { error: `Issue "${issueId}" not found.` },
        { status: 404 }
      );
    }

    const issue = issueRows[0];

    // Check manage permission
    const permission = canManageIssue(user, issue, issue.asset_category);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: permission.reason },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      observedProblem,
      probableCause,
      repairMethod,
      estimatedDurationDays = 7,
      contingencyPercent = 5,
      taxPercent = 18,
      items = [],
      inspectionDate,
    } = body;

    if (!observedProblem || !observedProblem.trim()) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'Observed problem description is required.' },
        { status: 400 }
      );
    }

    if (!repairMethod || !repairMethod.trim()) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'Proposed repair method is required.' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed.', message: 'At least one component line item is required.' },
        { status: 400 }
      );
    }

    // Calculate line items total
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemName = it.itemName || it.item_name;
      const quantity = Number(it.quantity) || 0;
      const unitCost = Number(it.unitCost || it.unit_cost) || 0;
      const unit = it.unit || 'nos';

      if (!itemName || !itemName.trim()) {
        return NextResponse.json(
          { error: 'Validation failed.', message: `Line item #${i + 1} is missing a name/description.` },
          { status: 400 }
        );
      }

      if (quantity <= 0 || unitCost <= 0) {
        return NextResponse.json(
          { error: 'Validation failed.', message: `Line item "${itemName}" must have positive quantity and unit rate.` },
          { status: 400 }
        );
      }

      const totalCost = Math.round(quantity * unitCost * 100) / 100;
      calculatedSubtotal += totalCost;

      validatedItems.push({
        itemName: itemName.trim(),
        description: it.description?.trim() || null,
        quantity,
        unit,
        unitCost,
        totalCost,
        proposedVendor: (it.proposedVendor || it.proposed_vendor || '').trim() || null,
        vendorContact: (it.vendorContact || it.vendor_contact || '').trim() || null,
        quotationRef: (it.quotationRef || it.quotation_ref || '').trim() || null,
      });
    }

    const cPercent = Number(contingencyPercent) >= 0 ? Number(contingencyPercent) : 5;
    const tPercent = Number(taxPercent) >= 0 ? Number(taxPercent) : 18;

    const contingencyAmount = Math.round((calculatedSubtotal * (cPercent / 100)) * 100) / 100;
    const taxableBase = calculatedSubtotal + contingencyAmount;
    const taxAmount = Math.round((taxableBase * (tPercent / 100)) * 100) / 100;
    const totalEstimatedCost = Math.round((taxableBase + taxAmount) * 100) / 100;

    // Determine version
    const versionRows = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM estimates WHERE issue_id = $1`,
      [issueId]
    );
    const nextVersion = Number(versionRows[0]?.next_version || 1);

    // Generate Estimate ID
    const estId = await generateId('Estimate');
    const inspDate = inspectionDate ? new Date(inspectionDate) : new Date();

    // Insert estimate
    await query(
      `INSERT INTO estimates (
        id, issue_id, version, inspection_date, observed_problem,
        probable_cause, repair_method, estimated_duration_days,
        subtotal, contingency_percent, tax_percent, total_estimated_cost,
        status, submitted_by, submitted_by_name, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending Review', $13, $14, NOW())`,
      [
        estId,
        issueId,
        nextVersion,
        inspDate,
        observedProblem.trim(),
        probableCause ? probableCause.trim() : null,
        repairMethod.trim(),
        Number(estimatedDurationDays) || 7,
        calculatedSubtotal,
        cPercent,
        tPercent,
        totalEstimatedCost,
        user.id,
        user.name,
      ]
    );

    // Insert line items
    for (const item of validatedItems) {
      await query(
        `INSERT INTO estimate_items (
          estimate_id, item_name, description, quantity,
          unit, unit_cost, total_cost, proposed_vendor,
          vendor_contact, quotation_ref
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          estId,
          item.itemName,
          item.description,
          item.quantity,
          item.unit,
          item.unitCost,
          item.totalCost,
          item.proposedVendor,
          item.vendorContact,
          item.quotationRef,
        ]
      );
    }

    // Update issue state
    await query(
      `UPDATE issues SET
         current_estimate_id = $1,
         status = 'Pending Approval',
         approval_status = 'Pending Review',
         assigned_to = COALESCE(assigned_to, $2),
         assigned_officer_name = COALESCE(assigned_officer_name, $3),
         updated_at = NOW()
       WHERE id = $4`,
      [estId, user.id, user.name, issueId]
    );

    // Log Activity
    await logActivity({
      assetId: issue.asset_id,
      issueId,
      action: ACTIVITY_ACTIONS.ESTIMATE_SUBMITTED,
      summary: `Estimate ${estId} (Version ${nextVersion}) submitted by ${user.name} for ₹ ${totalEstimatedCost.toLocaleString('en-IN')}.`,
    });

    // Return created estimate with items
    const insertedEst = await query('SELECT * FROM estimates WHERE id = $1', [estId]);
    const insertedItems = await query('SELECT * FROM estimate_items WHERE estimate_id = $1 ORDER BY id ASC', [estId]);
    const estimate = { ...insertedEst[0], items: insertedItems || [] };

    return NextResponse.json(
      {
        estimate,
        message: `Estimate ${estId} (v${nextVersion}) submitted successfully for administrative review.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/issues/[id]/estimates error:', error);
    return NextResponse.json(
      { error: 'Failed to submit estimate.', details: error.message },
      { status: 500 }
    );
  }
}
