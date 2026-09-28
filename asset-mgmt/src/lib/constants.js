/**
 * Gujarat R&B Asset Management System — Constants & Configuration
 * All enums, categories, types, issue categories, conditions, and statuses.
 * This is the single source of truth for dropdown values and validation.
 */

// ─── Static Demo User ───────────────────────────────────────────────────────
export const STATIC_USER = 'Demo Officer, R&B Division';

// ─── Asset Categories ────────────────────────────────────────────────────────
export const ASSET_CATEGORIES = ['Road', 'Bridge', 'Building'];

// ─── Asset Types (per category) ──────────────────────────────────────────────
export const ASSET_TYPES = {
  Road: ['State Highway', 'Major District Road', 'City Road'],
  Bridge: ['Road Bridge', 'Flyover', 'Culvert'],
  Building: ['Government Office', 'Residential Building', 'School', 'Healthcare Facility'],
};

// ─── Category-Specific Detail Fields ─────────────────────────────────────────
// Each field: { key, label, type, required, options? (for dropdowns) }
export const ASSET_DETAIL_FIELDS = {
  Road: [
    { key: 'classification', label: 'Classification', type: 'select', required: true, options: ['State Highway', 'Major District Road', 'City Road'] },
    { key: 'startPoint', label: 'Start Point', type: 'text', required: true },
    { key: 'endPoint', label: 'End Point', type: 'text', required: true },
    { key: 'lengthKm', label: 'Length (km)', type: 'number', required: true, min: 0.01 },
    { key: 'surfaceType', label: 'Surface Type', type: 'select', required: false, options: ['Asphalt', 'Concrete', 'Gravel', 'Earthen'] },
  ],
  Bridge: [
    { key: 'structureType', label: 'Structure Type', type: 'select', required: true, options: ['RCC', 'Steel', 'Composite', 'Stone Masonry'] },
    { key: 'crossingType', label: 'Crossing Type', type: 'select', required: true, options: ['River', 'Railway', 'Road', 'Canal'] },
    { key: 'lengthM', label: 'Length (m)', type: 'number', required: true, min: 0.1 },
  ],
  Building: [
    { key: 'buildingUse', label: 'Building Use', type: 'select', required: true, options: ['Government Office', 'Residential', 'School', 'Healthcare Facility', 'Other'] },
    { key: 'numberOfFloors', label: 'Number of Floors', type: 'number', required: true, min: 1 },
    { key: 'areaSqM', label: 'Built-up Area (sq m)', type: 'number', required: false, min: 1 },
  ],
};

// ─── Asset Conditions ────────────────────────────────────────────────────────
export const ASSET_CONDITIONS = ['Good', 'Fair', 'Poor', 'Critical'];

// ─── Asset Statuses ──────────────────────────────────────────────────────────
export const ASSET_STATUSES = ['Active', 'Under Maintenance', 'Retired'];

// ─── Issue Categories (per asset category) ───────────────────────────────────
export const ISSUE_CATEGORIES = {
  Road: [
    'Potholes',
    'Surface Cracks',
    'Road Surface Damage',
    'Waterlogging / Drainage',
    'Shoulder / Edge Damage',
    'Road Signage Damage',
    'Road Marking Damage',
    'Road Obstruction',
    'Other Road Issue',
  ],
  Bridge: [
    'Structural Cracks',
    'Concrete Damage',
    'Bearing Damage',
    'Expansion Joint Damage',
    'Railing / Parapet Damage',
    'Deck / Surface Damage',
    'Foundation / Scour Concern',
    'Drainage Problem',
    'Corrosion',
    'Other Bridge Issue',
  ],
  Building: [
    'Roof Leakage',
    'Wall / Ceiling Damage',
    'Structural Damage',
    'Electrical Problem',
    'Plumbing / Water Supply',
    'Drainage / Sanitation',
    'Doors / Windows',
    'Flooring Damage',
    'HVAC / Ventilation',
    'Other Building Issue',
  ],
};

// ─── Issue Priorities ────────────────────────────────────────────────────────
export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// ─── Issue Statuses ──────────────────────────────────────────────────────────
export const ISSUE_STATUSES = ['Open', 'In Progress', 'Completed'];

// ─── Valid Issue Status Transitions ──────────────────────────────────────────
export const ISSUE_TRANSITIONS = {
  'Open': ['In Progress'],
  'In Progress': ['Completed'],
  'Completed': ['Open'],  // reopen
};

// ─── Activity Log Actions ────────────────────────────────────────────────────
export const ACTIVITY_ACTIONS = {
  ASSET_REGISTERED: 'ASSET_REGISTERED',
  ASSET_EDITED: 'ASSET_EDITED',
  CONDITION_UPDATED: 'CONDITION_UPDATED',
  ASSET_RETIRED: 'ASSET_RETIRED',
  ISSUE_REPORTED: 'ISSUE_REPORTED',
  ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
  ISSUE_STATUS_UPDATED: 'ISSUE_STATUS_UPDATED',
  ISSUE_COMPLETED: 'ISSUE_COMPLETED',
  ISSUE_REOPENED: 'ISSUE_REOPENED',
};

// ─── ID Prefixes ─────────────────────────────────────────────────────────────
export const ID_PREFIXES = {
  Road: 'RD',
  Bridge: 'BR',
  Building: 'BLD',
  Issue: 'ISS',
};

// ─── Gujarat Districts ───────────────────────────────────────────────────────
export const DISTRICTS = [
  'Ahmedabad',
  'Amreli',
  'Anand',
  'Aravalli',
  'Banaskantha',
  'Bharuch',
  'Bhavnagar',
  'Botad',
  'Chhota Udaipur',
  'Dahod',
  'Dang',
  'Devbhoomi Dwarka',
  'Gandhinagar',
  'Gir Somnath',
  'Jamnagar',
  'Junagadh',
  'Kheda',
  'Kutch',
  'Mahisagar',
  'Mehsana',
  'Morbi',
  'Narmada',
  'Navsari',
  'Panchmahal',
  'Patan',
  'Porbandar',
  'Rajkot',
  'Sabarkantha',
  'Surat',
  'Surendranagar',
  'Tapi',
  'Vadodara',
  'Valsad',
];

// ─── Seeded Divisions ────────────────────────────────────────────────────────
export const DIVISIONS = [
  { id: 1, name: 'Roads Division, Ahmedabad' },
  { id: 2, name: 'Roads Division, Surat' },
  { id: 3, name: 'Roads Division, Rajkot' },
  { id: 4, name: 'Buildings Division, Gandhinagar' },
  { id: 5, name: 'Buildings Division, Vadodara' },
];

// ─── Seeded Officers ─────────────────────────────────────────────────────────
export const OFFICERS = [
  { id: 1, name: 'Shri A.K. Patel', divisionId: 1 },
  { id: 2, name: 'Shri R.M. Shah', divisionId: 1 },
  { id: 3, name: 'Smt. P.D. Mehta', divisionId: 2 },
  { id: 4, name: 'Shri V.J. Desai', divisionId: 2 },
  { id: 5, name: 'Shri K.N. Trivedi', divisionId: 3 },
  { id: 6, name: 'Smt. S.R. Joshi', divisionId: 4 },
  { id: 7, name: 'Shri H.B. Raval', divisionId: 4 },
  { id: 8, name: 'Shri M.T. Bhatt', divisionId: 5 },
];
