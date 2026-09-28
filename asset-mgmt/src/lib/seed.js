/**
 * Seed Data Script (Neon Postgres)
 * 
 * Populates the database with realistic Gujarat R&B data:
 * - 18 assets (6 roads, 5 bridges, 7 buildings)
 * - 14 issues across all statuses and priorities
 * - Activity log entries consistent with the seeded data
 * 
 * Idempotent: checks if data exists before inserting.
 * Reset: drops all data and re-seeds when called with reset=true.
 */

import { query, ensureSchema, resetSchema } from './db.js';
import { STATIC_USER, ACTIVITY_ACTIONS } from './constants.js';
import { logActivity } from './activity-logger.js';

// ─── Asset Seed Data ─────────────────────────────────────────────────────────
const SEED_ASSETS = [
  // Roads (RD-0001 to RD-0006)
  {
    id: 'RD-0001', category: 'Road', type: 'State Highway',
    name: 'Ahmedabad-Vadodara Expressway', district: 'Ahmedabad',
    address: 'NH-48, Ahmedabad to Vadodara stretch', divisionId: 1,
    condition: 'Good', status: 'Active',
    details: { classification: 'State Highway', startPoint: 'Ahmedabad SG Highway', endPoint: 'Vadodara Toll Plaza', lengthKm: 93.4, surfaceType: 'Asphalt' },
  },
  {
    id: 'RD-0002', category: 'Road', type: 'State Highway',
    name: 'SH-17 Rajkot-Jamnagar Highway', district: 'Rajkot',
    address: 'SH-17 via Paddhari', divisionId: 3,
    condition: 'Fair', status: 'Active',
    details: { classification: 'State Highway', startPoint: 'Rajkot GSRTC Bus Stand', endPoint: 'Jamnagar City Gate', lengthKm: 103, surfaceType: 'Asphalt' },
  },
  {
    id: 'RD-0003', category: 'Road', type: 'Major District Road',
    name: 'Gandhinagar-Mehsana MDR', district: 'Gandhinagar',
    address: 'MDR via Kalol', divisionId: 1,
    condition: 'Good', status: 'Active',
    details: { classification: 'Major District Road', startPoint: 'Gandhinagar Sector 1', endPoint: 'Mehsana Bypass', lengthKm: 64, surfaceType: 'Concrete' },
  },
  {
    id: 'RD-0004', category: 'Road', type: 'City Road',
    name: 'Surat Ring Road (South)', district: 'Surat',
    address: 'Southern Ring Road, Surat Municipal limit', divisionId: 2,
    condition: 'Poor', status: 'Under Maintenance',
    details: { classification: 'City Road', startPoint: 'Dumas Road Junction', endPoint: 'Kamrej Crossing', lengthKm: 22.5, surfaceType: 'Asphalt' },
  },
  {
    id: 'RD-0005', category: 'Road', type: 'City Road',
    name: 'Bhavnagar City Road Section-12', district: 'Bhavnagar',
    address: 'Waghawadi Road to Ghogha Circle', divisionId: 1,
    condition: 'Critical', status: 'Under Maintenance',
    details: { classification: 'City Road', startPoint: 'Waghawadi Road', endPoint: 'Ghogha Circle', lengthKm: 4.8, surfaceType: 'Asphalt' },
  },
  {
    id: 'RD-0006', category: 'Road', type: 'Major District Road',
    name: 'Junagadh-Veraval MDR', district: 'Junagadh',
    address: 'MDR connecting Junagadh to Veraval coast', divisionId: 3,
    condition: 'Fair', status: 'Active',
    details: { classification: 'Major District Road', startPoint: 'Junagadh Talav Gate', endPoint: 'Veraval Port Area', lengthKm: 85, surfaceType: 'Asphalt' },
  },

  // Bridges (BR-0001 to BR-0005)
  {
    id: 'BR-0001', category: 'Bridge', type: 'Road Bridge',
    name: 'Sabarmati River Bridge (NH-48)', district: 'Ahmedabad',
    address: 'NH-48 crossing over Sabarmati River', divisionId: 1,
    condition: 'Good', status: 'Active',
    details: { structureType: 'RCC', crossingType: 'River', lengthM: 380 },
  },
  {
    id: 'BR-0002', category: 'Bridge', type: 'Road Bridge',
    name: 'Tapi Bridge (Surat)', district: 'Surat',
    address: 'Ring Road bridge over Tapi River', divisionId: 2,
    condition: 'Fair', status: 'Active',
    details: { structureType: 'Steel', crossingType: 'River', lengthM: 520 },
  },
  {
    id: 'BR-0003', category: 'Bridge', type: 'Flyover',
    name: 'Narmada Flyover (Bharuch)', district: 'Bharuch',
    address: 'Golden Bridge approach, Bharuch', divisionId: 2,
    condition: 'Poor', status: 'Under Maintenance',
    details: { structureType: 'RCC', crossingType: 'Road', lengthM: 210 },
  },
  {
    id: 'BR-0004', category: 'Bridge', type: 'Culvert',
    name: 'Aji River Culvert (Rajkot)', district: 'Rajkot',
    address: 'Aji Dam Road, Rajkot outskirts', divisionId: 3,
    condition: 'Good', status: 'Active',
    details: { structureType: 'Stone Masonry', crossingType: 'River', lengthM: 45 },
  },
  {
    id: 'BR-0005', category: 'Bridge', type: 'Road Bridge',
    name: 'Banas Bridge (Palanpur)', district: 'Banaskantha',
    address: 'NH-14 crossing over Banas River near Palanpur', divisionId: 3,
    condition: 'Critical', status: 'Under Maintenance',
    details: { structureType: 'Composite', crossingType: 'River', lengthM: 290 },
  },

  // Buildings (BLD-0001 to BLD-0007)
  {
    id: 'BLD-0001', category: 'Building', type: 'Government Office',
    name: 'Sachivalay (State Secretariat)', district: 'Gandhinagar',
    address: 'Sector 10, Gandhinagar', divisionId: 4,
    condition: 'Good', status: 'Active',
    details: { buildingUse: 'Government Office', numberOfFloors: 8, areaSqM: 45000 },
  },
  {
    id: 'BLD-0002', category: 'Building', type: 'Government Office',
    name: 'District Collectorate', district: 'Ahmedabad',
    address: 'Lal Darwaja, Old City', divisionId: 4,
    condition: 'Fair', status: 'Active',
    details: { buildingUse: 'Government Office', numberOfFloors: 4, areaSqM: 8500 },
  },
  {
    id: 'BLD-0003', category: 'Building', type: 'Government Office',
    name: 'R&B Division Office', district: 'Surat',
    address: 'Ring Road, Athwa Gate', divisionId: 5,
    condition: 'Good', status: 'Active',
    details: { buildingUse: 'Government Office', numberOfFloors: 3, areaSqM: 2400 },
  },
  {
    id: 'BLD-0004', category: 'Building', type: 'School',
    name: 'Government Primary School No.4', district: 'Vadodara',
    address: 'Manjalpur, Vadodara', divisionId: 5,
    condition: 'Poor', status: 'Active',
    details: { buildingUse: 'School', numberOfFloors: 2, areaSqM: 1200 },
  },
  {
    id: 'BLD-0005', category: 'Building', type: 'Healthcare Facility',
    name: 'Taluka Health Centre', district: 'Mehsana',
    address: 'Visnagar Road, Mehsana', divisionId: 4,
    condition: 'Fair', status: 'Active',
    details: { buildingUse: 'Healthcare Facility', numberOfFloors: 2, areaSqM: 3200 },
  },
  {
    id: 'BLD-0006', category: 'Building', type: 'Residential Building',
    name: 'PWD Rest House', district: 'Kutch',
    address: 'Bhuj-Mandvi Road, Bhuj', divisionId: 5,
    condition: 'Poor', status: 'Active',
    details: { buildingUse: 'Residential', numberOfFloors: 1, areaSqM: 600 },
  },
  {
    id: 'BLD-0007', category: 'Building', type: 'Government Office',
    name: 'District Panchayat Office', district: 'Rajkot',
    address: 'Dhebar Road, Rajkot', divisionId: 4,
    condition: 'Good', status: 'Active',
    details: { buildingUse: 'Government Office', numberOfFloors: 3, areaSqM: 4100 },
  },
];

// ─── Issue Seed Data ─────────────────────────────────────────────────────────
const SEED_ISSUES = [
  // Open issues
  {
    id: 'ISS-0001', assetId: 'RD-0004', issueCategory: 'Potholes',
    description: 'Multiple large potholes on the southbound lane near Kamrej junction, causing traffic hazards.',
    priority: 'High', assignedTo: 3, status: 'Open',
    reportedDate: '2026-09-15T09:30:00Z',
  },
  {
    id: 'ISS-0002', assetId: 'BR-0005', issueCategory: 'Structural Cracks',
    description: 'Visible longitudinal cracks on pier 3 and 4, approximately 2-3mm wide. Requires immediate structural assessment.',
    priority: 'Critical', assignedTo: 5, status: 'Open',
    reportedDate: '2026-09-10T14:15:00Z',
  },
  {
    id: 'ISS-0003', assetId: 'BLD-0004', issueCategory: 'Roof Leakage',
    description: 'Severe roof leakage in classrooms 3 and 4 during monsoon. Ceiling plaster falling in patches.',
    priority: 'High', assignedTo: null, status: 'Open',
    reportedDate: '2026-09-20T11:00:00Z',
  },
  {
    id: 'ISS-0004', assetId: 'RD-0005', issueCategory: 'Road Surface Damage',
    description: 'Complete surface deterioration over 1.2 km stretch between Waghawadi and Kalanala. Exposed base layer.',
    priority: 'Critical', assignedTo: 1, status: 'Open',
    reportedDate: '2026-09-08T08:45:00Z',
  },
  {
    id: 'ISS-0005', assetId: 'BLD-0006', issueCategory: 'Plumbing / Water Supply',
    description: 'Water supply pipeline burst near the main entrance. Intermittent supply affecting all rooms.',
    priority: 'Medium', assignedTo: null, status: 'Open',
    reportedDate: '2026-09-22T16:30:00Z',
  },

  // In Progress issues
  {
    id: 'ISS-0006', assetId: 'RD-0004', issueCategory: 'Waterlogging / Drainage',
    description: 'Blocked storm drains near Dumas junction causing waterlogging during rains. 200m stretch affected.',
    priority: 'High', assignedTo: 4, status: 'In Progress',
    reportedDate: '2026-09-05T10:00:00Z',
  },
  {
    id: 'ISS-0007', assetId: 'BR-0003', issueCategory: 'Expansion Joint Damage',
    description: 'Expansion joints at both ends of the flyover are damaged. Metal plates exposed and creating noise.',
    priority: 'Medium', assignedTo: 4, status: 'In Progress',
    reportedDate: '2026-09-12T13:20:00Z',
  },
  {
    id: 'ISS-0008', assetId: 'BLD-0002', issueCategory: 'Electrical Problem',
    description: 'Frequent power tripping on the 2nd floor. Wiring inspection needed. Backup generator also failing.',
    priority: 'High', assignedTo: 7, status: 'In Progress',
    reportedDate: '2026-09-14T09:00:00Z',
  },
  {
    id: 'ISS-0009', assetId: 'BR-0005', issueCategory: 'Corrosion',
    description: 'Heavy corrosion on steel reinforcement bars visible on the underside of deck slab. Section near pier 2.',
    priority: 'Critical', assignedTo: 5, status: 'In Progress',
    reportedDate: '2026-09-01T11:30:00Z',
  },

  // Completed issues
  {
    id: 'ISS-0010', assetId: 'RD-0002', issueCategory: 'Road Marking Damage',
    description: 'Faded lane markings over 5 km stretch near Paddhari. Centre line and edge markings not visible at night.',
    priority: 'Low', assignedTo: 5, status: 'Completed',
    reportedDate: '2026-08-20T10:00:00Z',
    resolutionNotes: 'Lane markings repainted using thermoplastic paint. Reflective beads applied. Completed on 2026-09-02.',
    completedDate: '2026-09-02T16:00:00Z',
  },
  {
    id: 'ISS-0011', assetId: 'BLD-0001', issueCategory: 'HVAC / Ventilation',
    description: 'Central AC system on 5th floor not cooling. Compressor making unusual noise.',
    priority: 'Medium', assignedTo: 6, status: 'Completed',
    reportedDate: '2026-08-25T14:30:00Z',
    resolutionNotes: 'Compressor replaced with new unit. Refrigerant recharged. System tested and operational.',
    completedDate: '2026-09-05T11:00:00Z',
  },
  {
    id: 'ISS-0012', assetId: 'BR-0001', issueCategory: 'Railing / Parapet Damage',
    description: 'Vehicle impact damage to railing on east side, approximately 8m section bent.',
    priority: 'Medium', assignedTo: 2, status: 'Completed',
    reportedDate: '2026-08-15T08:00:00Z',
    resolutionNotes: 'Damaged railing section replaced with new steel railing. Crash barrier installed as additional safety measure.',
    completedDate: '2026-08-28T15:30:00Z',
  },
  {
    id: 'ISS-0013', assetId: 'BLD-0005', issueCategory: 'Doors / Windows',
    description: 'Multiple window panes broken in outpatient ward. Security and weather protection compromised.',
    priority: 'Medium', assignedTo: 7, status: 'Completed',
    reportedDate: '2026-08-10T09:00:00Z',
    resolutionNotes: 'All broken window panes replaced with toughened glass. Window frames repainted. 12 panes total.',
    completedDate: '2026-08-22T14:00:00Z',
  },
  {
    id: 'ISS-0014', assetId: 'RD-0006', issueCategory: 'Shoulder / Edge Damage',
    description: 'Road shoulder erosion near Keshod village. 500m stretch with dangerous drop-offs.',
    priority: 'High', assignedTo: 5, status: 'Completed',
    reportedDate: '2026-08-18T11:00:00Z',
    resolutionNotes: 'Shoulder rebuilt with compacted gravel. Edge markers installed. Drainage channel cleared to prevent future erosion.',
    completedDate: '2026-09-10T10:30:00Z',
  },
];

/**
 * Helper to get officer name from ID.
 */
function getOfficerName(officerId) {
  const names = {
    1: 'Shri A.K. Patel', 2: 'Shri R.M. Shah', 3: 'Smt. P.D. Mehta',
    4: 'Shri V.J. Desai', 5: 'Shri K.N. Trivedi', 6: 'Smt. S.R. Joshi',
    7: 'Shri H.B. Raval', 8: 'Shri M.T. Bhatt',
  };
  return names[officerId] || `Officer #${officerId}`;
}

/**
 * Check if seed data already exists.
 */
async function isSeedDataPresent() {
  const rows = await query('SELECT COUNT(*) AS count FROM assets');
  return parseInt(rows[0].count, 10) > 0;
}

/**
 * Insert seed assets.
 */
async function seedAssets() {
  for (let i = 0; i < SEED_ASSETS.length; i++) {
    const a = SEED_ASSETS[i];
    const daysAgo = 30 + (SEED_ASSETS.length - i) * 3;

    await query(
      `INSERT INTO assets (id, category, type, name, district, address, division_id, condition, status, details, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '${daysAgo} days')
       ON CONFLICT (id) DO NOTHING`,
      [a.id, a.category, a.type, a.name, a.district, a.address || null, a.divisionId, a.condition, a.status, JSON.stringify(a.details)]
    );
  }
}

/**
 * Insert seed issues.
 */
async function seedIssues() {
  for (const issue of SEED_ISSUES) {
    await query(
      `INSERT INTO issues (id, asset_id, issue_category, description, priority, reported_by, assigned_to, status, reported_date, resolution_notes, completed_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        issue.id, issue.assetId, issue.issueCategory, issue.description,
        issue.priority, STATIC_USER, issue.assignedTo || null, issue.status,
        issue.reportedDate, issue.resolutionNotes || null, issue.completedDate || null,
      ]
    );
  }
}

/**
 * Insert seed activity log entries consistent with seed data.
 */
async function seedActivityLog() {
  // Asset registration entries
  for (const asset of SEED_ASSETS) {
    await logActivity({
      assetId: asset.id,
      action: ACTIVITY_ACTIONS.ASSET_REGISTERED,
      summary: `${asset.category} "${asset.name}" registered in ${asset.district} district.`,
      timestamp: `2026-07-15T${String(8 + SEED_ASSETS.indexOf(asset) % 8).padStart(2, '0')}:00:00Z`,
    });
  }

  // Condition changes for Poor/Critical assets
  const conditionAssets = SEED_ASSETS.filter(a => a.condition === 'Poor' || a.condition === 'Critical');
  for (const asset of conditionAssets) {
    await logActivity({
      assetId: asset.id,
      action: ACTIVITY_ACTIONS.CONDITION_UPDATED,
      summary: `Condition of "${asset.name}" updated from Fair to ${asset.condition}.`,
      oldValue: 'Fair',
      newValue: asset.condition,
      timestamp: '2026-08-20T10:00:00Z',
    });
  }

  // Issue reported entries
  for (const issue of SEED_ISSUES) {
    await logActivity({
      assetId: issue.assetId,
      issueId: issue.id,
      action: ACTIVITY_ACTIONS.ISSUE_REPORTED,
      summary: `Issue ${issue.id} reported: ${issue.issueCategory} (${issue.priority} priority).`,
      timestamp: issue.reportedDate,
    });
  }

  // Issue assigned entries
  for (const issue of SEED_ISSUES) {
    if (issue.assignedTo) {
      const officerName = getOfficerName(issue.assignedTo);
      const assignDate = new Date(issue.reportedDate);
      assignDate.setHours(assignDate.getHours() + 2);
      await logActivity({
        assetId: issue.assetId,
        issueId: issue.id,
        action: ACTIVITY_ACTIONS.ISSUE_ASSIGNED,
        summary: `Issue ${issue.id} assigned to ${officerName}.`,
        timestamp: assignDate.toISOString(),
      });
    }
  }

  // In Progress transitions
  const inProgressIssues = SEED_ISSUES.filter(i => i.status === 'In Progress' || i.status === 'Completed');
  for (const issue of inProgressIssues) {
    const progressDate = new Date(issue.reportedDate);
    progressDate.setDate(progressDate.getDate() + 2);
    await logActivity({
      assetId: issue.assetId,
      issueId: issue.id,
      action: ACTIVITY_ACTIONS.ISSUE_STATUS_UPDATED,
      summary: `Issue ${issue.id} moved to In Progress.`,
      oldValue: 'Open',
      newValue: 'In Progress',
      timestamp: progressDate.toISOString(),
    });
  }

  // Completed transitions
  const completedIssues = SEED_ISSUES.filter(i => i.status === 'Completed');
  for (const issue of completedIssues) {
    await logActivity({
      assetId: issue.assetId,
      issueId: issue.id,
      action: ACTIVITY_ACTIONS.ISSUE_COMPLETED,
      summary: `Issue ${issue.id} completed. ${issue.resolutionNotes?.substring(0, 60)}...`,
      oldValue: 'In Progress',
      newValue: 'Completed',
      timestamp: issue.completedDate,
    });
  }
}

/**
 * Update ID counters to match seed data.
 */
async function updateCounters() {
  await query("UPDATE id_counters SET next_val = 7 WHERE prefix = 'RD'");
  await query("UPDATE id_counters SET next_val = 6 WHERE prefix = 'BR'");
  await query("UPDATE id_counters SET next_val = 8 WHERE prefix = 'BLD'");
  await query("UPDATE id_counters SET next_val = 15 WHERE prefix = 'ISS'");
}

/**
 * Run the full seed process.
 * @param {boolean} reset - If true, drops all data first
 * @returns {Promise<{ message: string, assets: number, issues: number }>}
 */
export async function runSeed(reset = false) {
  if (reset) {
    await resetSchema();
  } else {
    await ensureSchema();
  }

  if (!reset) {
    const present = await isSeedDataPresent();
    if (present) {
      return { message: 'Seed data already present. Use reset=true to re-seed.', assets: 0, issues: 0 };
    }
  }

  await seedAssets();
  await seedIssues();
  await seedActivityLog();
  await updateCounters();

  return {
    message: reset ? 'Database reset and re-seeded successfully.' : 'Database seeded successfully.',
    assets: SEED_ASSETS.length,
    issues: SEED_ISSUES.length,
  };
}
