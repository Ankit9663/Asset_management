/**
 * Gujarat R&B Asset Management System — Constants & Configuration
 * All enums, categories, types, issue categories, conditions, and statuses.
 * Single source of truth for role-based access, inspections, estimates, and lifecycle.
 */

// ─── Static Demo User (Fallback) ───────────────────────────────────────────
export const STATIC_USER = 'Rajesh Patel (Administrator)';

// ─── Seeded Roles & Permissions ────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  ROAD_OFFICER: 'ROAD_OFFICER',
  BRIDGE_OFFICER: 'BRIDGE_OFFICER',
  BUILDING_OFFICER: 'BUILDING_OFFICER',
  VIEWER: 'VIEWER',
};

// ─── 11 Seeded Demonstration Accounts ──────────────────────────────────────
export const SEEDED_USERS = [
  {
    id: 'usr_admin',
    name: 'Rajesh Patel',
    role: 'ADMIN',
    designation: 'Department Administrator',
    category: 'ALL',
    divisionName: 'Department-wide',
    divisionId: null,
    avatar: 'RP',
  },
  {
    id: 'usr_road_ahd',
    name: 'Amit Shah',
    role: 'ROAD_OFFICER',
    designation: 'Road Maintenance Officer',
    category: 'Road',
    divisionName: 'Ahmedabad',
    divisionId: 1,
    avatar: 'AS',
  },
  {
    id: 'usr_road_sur',
    name: 'Kiran Desai',
    role: 'ROAD_OFFICER',
    designation: 'Road Maintenance Officer',
    category: 'Road',
    divisionName: 'Surat',
    divisionId: 2,
    avatar: 'KD',
  },
  {
    id: 'usr_road_raj',
    name: 'Mehul Parmar',
    role: 'ROAD_OFFICER',
    designation: 'Road Maintenance Officer',
    category: 'Road',
    divisionName: 'Rajkot',
    divisionId: 3,
    avatar: 'MP',
  },
  {
    id: 'usr_bridge_ahd',
    name: 'Nisha Patel',
    role: 'BRIDGE_OFFICER',
    designation: 'Bridge Maintenance Officer',
    category: 'Bridge',
    divisionName: 'Ahmedabad',
    divisionId: 1,
    avatar: 'NP',
  },
  {
    id: 'usr_bridge_sur',
    name: 'Harsh Shah',
    role: 'BRIDGE_OFFICER',
    designation: 'Bridge Maintenance Officer',
    category: 'Bridge',
    divisionName: 'Surat',
    divisionId: 2,
    avatar: 'HS',
  },
  {
    id: 'usr_bridge_vad',
    name: 'Dhruv Mehta',
    role: 'BRIDGE_OFFICER',
    designation: 'Bridge Maintenance Officer',
    category: 'Bridge',
    divisionName: 'Vadodara',
    divisionId: 5,
    avatar: 'DM',
  },
  {
    id: 'usr_building_ahd',
    name: 'Pooja Desai',
    role: 'BUILDING_OFFICER',
    designation: 'Building Maintenance Officer',
    category: 'Building',
    divisionName: 'Ahmedabad',
    divisionId: 1,
    avatar: 'PD',
  },
  {
    id: 'usr_building_sur',
    name: 'Riya Shah',
    role: 'BUILDING_OFFICER',
    designation: 'Building Maintenance Officer',
    category: 'Building',
    divisionName: 'Surat',
    divisionId: 2,
    avatar: 'RS',
  },
  {
    id: 'usr_building_raj',
    name: 'Jay Patel',
    role: 'BUILDING_OFFICER',
    designation: 'Building Maintenance Officer',
    category: 'Building',
    divisionName: 'Rajkot',
    divisionId: 3,
    avatar: 'JP',
  },
  {
    id: 'usr_viewer',
    name: 'Neha Desai',
    role: 'VIEWER',
    designation: 'Department Viewer',
    category: 'ALL',
    divisionName: 'Department-wide',
    divisionId: null,
    avatar: 'ND',
  },
];

// ─── Asset Categories ────────────────────────────────────────────────────────
export const ASSET_CATEGORIES = ['Road', 'Bridge', 'Building'];

// ─── Asset Types (per category) ──────────────────────────────────────────────
export const ASSET_TYPES = {
  Road: ['State Highway', 'Major District Road', 'City Road'],
  Bridge: ['Road Bridge', 'Flyover', 'Culvert'],
  Building: ['Government Office', 'Residential Building', 'School', 'Healthcare Facility'],
};

// ─── Category-Specific Detail Fields ─────────────────────────────────────────
export const ASSET_DETAIL_FIELDS = {
  Road: [
    { key: 'classification', label: 'Classification', type: 'select', required: true, options: ['State Highway', 'Major District Road', 'City Road'] },
    { key: 'startPoint', label: 'Start Point', type: 'text', required: true },
    { key: 'endPoint', label: 'End Point', type: 'text', required: true },
    { key: 'lengthKm', label: 'Length (km)', type: 'number', required: true, min: 0.01 },
    { key: 'roadWidthM', label: 'Road Width (m)', type: 'number', required: false, min: 1 },
    { key: 'laneCount', label: 'Number of Lanes', type: 'number', required: false, min: 1 },
    { key: 'surfaceType', label: 'Surface Type', type: 'select', required: false, options: ['Asphalt', 'Concrete', 'Gravel', 'Earthen'] },
    { key: 'constructionYear', label: 'Construction Year', type: 'number', required: false },
  ],
  Bridge: [
    { key: 'structureType', label: 'Structure Type', type: 'select', required: true, options: ['RCC', 'Steel', 'Composite', 'Stone Masonry'] },
    { key: 'crossingType', label: 'Crossing Type', type: 'select', required: true, options: ['River', 'Railway', 'Road', 'Canal'] },
    { key: 'lengthM', label: 'Length (m)', type: 'number', required: true, min: 0.1 },
    { key: 'widthM', label: 'Width (m)', type: 'number', required: false, min: 1 },
    { key: 'spanCount', label: 'Number of Spans', type: 'number', required: false, min: 1 },
    { key: 'loadCapacityTons', label: 'Load Capacity (Tons)', type: 'number', required: false },
    { key: 'constructionYear', label: 'Construction Year', type: 'number', required: false },
  ],
  Building: [
    { key: 'buildingUse', label: 'Primary Usage', type: 'select', required: true, options: ['Government Office', 'Residential', 'School', 'Healthcare Facility', 'Civic Center', 'Other'] },
    { key: 'numberOfFloors', label: 'Number of Floors', type: 'number', required: true, min: 1 },
    { key: 'areaSqM', label: 'Built-up Area (sq m)', type: 'number', required: false, min: 1 },
    { key: 'constructionYear', label: 'Construction Year', type: 'number', required: false },
  ],
};

// ─── Asset Conditions ────────────────────────────────────────────────────────
export const ASSET_CONDITIONS = ['Good', 'Fair', 'Poor', 'Critical'];

// ─── Asset Statuses ──────────────────────────────────────────────────────────
export const ASSET_STATUSES = ['Active', 'Under Maintenance', 'Retired'];

// ─── Periodic Inspections ────────────────────────────────────────────────────
export const INSPECTION_TYPES = ['Routine', 'Detailed', 'Special', 'Post-Maintenance'];

export const INSPECTION_CHECKLISTS = {
  Road: [
    { key: 'surface_condition', label: 'Surface Condition', options: ['Good', 'Fair', 'Poor', 'Critical'] },
    { key: 'potholes_cracks', label: 'Potholes or Cracks', options: ['None', 'Minor Cracking', 'Moderate Potholes', 'Severe Distress'] },
    { key: 'drainage_condition', label: 'Drainage Condition', options: ['Clear & Functional', 'Partially Blocked', 'Severely Clogged', 'Damaged Drain Structure'] },
    { key: 'road_markings', label: 'Road Markings & Signage', options: ['Clearly Visible', 'Faded Markings', 'Missing Signage', 'Critical Blind Spots'] },
    { key: 'shoulder_condition', label: 'Shoulder & Edge Condition', options: ['Stable & Flush', 'Minor Erosion', 'Dangerous Edge Drop (>10cm)', 'Edge Collapse'] },
  ],
  Bridge: [
    { key: 'structural_condition', label: 'Superstructure Condition', options: ['Sound & Intact', 'Minor Spalling', 'Exposed Rebar', 'Structural Distress'] },
    { key: 'visible_cracks', label: 'Visible Cracks / Deflection', options: ['None Observed', 'Hairline Cracks', 'Shear Cracks', 'Active Widening Cracks'] },
    { key: 'corrosion', label: 'Corrosion & Weathering', options: ['None', 'Mild Surface Rust', 'Pitting & Flaking', 'Severe Section Loss'] },
    { key: 'drainage_condition', label: 'Deck Drainage Spouts', options: ['Clear', 'Partially Clogged', 'Completely Blocked', 'Ponding on Deck'] },
    { key: 'expansion_joints', label: 'Expansion Joints & Bearings', options: ['Smooth & Aligned', 'Seal Damaged', 'Joint Displaced', 'Bearing Failure / Jammed'] },
    { key: 'safety_barriers', label: 'Crash Barriers / Railings', options: ['Intact & Firm', 'Dented / Scratched', 'Loose Connections', 'Barrier Breached / Missing'] },
  ],
  Building: [
    { key: 'structural_condition', label: 'Structural Columns & Beams', options: ['No Signs of Distress', 'Minor Hairline Cracks', 'Settlement Cracks', 'Severe Structural Failure'] },
    { key: 'electrical_condition', label: 'Electrical & Wiring Safety', options: ['Safe & Inspected', 'Minor Wear', 'Exposed Cables / Tripping', 'Hazardous / Fire Risk'] },
    { key: 'plumbing_condition', label: 'Plumbing & Water Supply', options: ['Normal Flow, No Leaks', 'Slow Drains', 'Active Seepage / Leakage', 'Broken Mains / Flooding'] },
    { key: 'roof_condition', label: 'Roof / Terrace Waterproofing', options: ['Dry & Clean', 'Minor Staining', 'Active Seepage', 'Severe Water Ingress'] },
    { key: 'fire_safety', label: 'Fire Safety & Exits', options: ['Extinguishers Valid & Clear', 'Signage Missing', 'Obstruction in Exits', 'Non-compliant / Critical'] },
  ],
};

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

// ─── Issue Lifecycle Statuses ────────────────────────────────────────────────
export const ISSUE_STATUSES = [
  'Open',
  'Pending Approval',
  'Approved',
  'In Progress',
  'Awaiting Verification',
  'Completed',
];

// ─── Valid Issue Status Transitions ──────────────────────────────────────────
export const ISSUE_TRANSITIONS = {
  'Open': ['Pending Approval', 'Approved', 'In Progress'],
  'Pending Approval': ['Approved', 'Open'],
  'Approved': ['In Progress'],
  'In Progress': ['Awaiting Verification', 'Completed'],
  'Awaiting Verification': ['Completed', 'In Progress'],
  'Completed': ['Open'],
};

// ─── Estimate Approval Statuses ──────────────────────────────────────────────
export const ESTIMATE_STATUSES = [
  'Pending Review',
  'Approved',
  'Revision Requested',
  'Rejected',
];

// ─── Activity Log Actions ────────────────────────────────────────────────────
export const ACTIVITY_ACTIONS = {
  ASSET_REGISTERED: 'ASSET_REGISTERED',
  ASSET_COMMISSIONED: 'ASSET_COMMISSIONED',
  ASSET_EDITED: 'ASSET_EDITED',
  CONDITION_UPDATED: 'CONDITION_UPDATED',
  ASSET_RETIRED: 'ASSET_RETIRED',
  INSPECTION_RECORDED: 'INSPECTION_RECORDED',
  DEFECT_IDENTIFIED: 'DEFECT_IDENTIFIED',
  ISSUE_REPORTED: 'ISSUE_REPORTED',
  ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
  ESTIMATE_SUBMITTED: 'ESTIMATE_SUBMITTED',
  ESTIMATE_REVISION_REQUESTED: 'ESTIMATE_REVISION_REQUESTED',
  ESTIMATE_APPROVED: 'ESTIMATE_APPROVED',
  ESTIMATE_REJECTED: 'ESTIMATE_REJECTED',
  MAINTENANCE_STARTED: 'MAINTENANCE_STARTED',
  PROGRESS_UPDATED: 'PROGRESS_UPDATED',
  COMPLETION_SUBMITTED: 'COMPLETION_SUBMITTED',
  COMPLETION_VERIFIED: 'COMPLETION_VERIFIED',
  ISSUE_COMPLETED: 'ISSUE_COMPLETED',
  ISSUE_REOPENED: 'ISSUE_REOPENED',
};

// ─── ID Prefixes ─────────────────────────────────────────────────────────────
export const ID_PREFIXES = {
  Road: 'RD',
  Bridge: 'BR',
  Building: 'BLD',
  Issue: 'ISS',
  Inspection: 'INSP',
  Estimate: 'EST',
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
  { id: 1, name: 'Roads & Buildings Division, Ahmedabad' },
  { id: 2, name: 'Roads & Buildings Division, Surat' },
  { id: 3, name: 'Roads & Buildings Division, Rajkot' },
  { id: 4, name: 'Roads & Buildings Division, Gandhinagar' },
  { id: 5, name: 'Roads & Buildings Division, Vadodara' },
];

// ─── Seeded Officers ─────────────────────────────────────────────────────────
export const OFFICERS = SEEDED_USERS.filter(u => u.role !== 'VIEWER');
