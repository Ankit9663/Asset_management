/**
 * Seed Data Script (Neon Postgres) — Enterprise Advanced Features
 * 
 * Populates realistic Gujarat R&B data:
 * - 11 Seeded Users across all roles & divisions
 * - 18 Assets with complete financial, lifecycle & category-specific parameters
 * - 12 Periodic Inspections with category checklists, defect tracking & due dates
 * - 14 Issues covering the complete lifecycle:
 *     Open, Pending Approval, Revision Requested, In Progress, Awaiting Verification, Completed
 * - Component-wise Estimates (multi-version) with line items, vendors, taxes & contingencies
 * - Progress updates & actual expenditure records
 * - Unified activity log events matching all historical lifecycle events
 */

import { query, ensureSchema, resetSchema } from './db.js';
import {
  SEEDED_USERS,
  ACTIVITY_ACTIONS,
} from './constants.js';

// ─── 18 Seed Assets with Financial & Lifecycle Fields ────────────────────────
export const SEED_ASSETS = [
  // Roads (RD-0001 to RD-0006)
  {
    id: 'RD-0001', category: 'Road', type: 'State Highway',
    name: 'Ahmedabad-Vadodara Expressway', district: 'Ahmedabad',
    address: 'NH-48, Ahmedabad to Vadodara stretch', divisionId: 1,
    condition: 'Good', status: 'Active',
    constructionDate: '2016-03-15', commissioningDate: '2017-01-26',
    constructionCost: 485000000, fundingSource: 'State Budget (R&B Major Works)',
    warrantyExpiryDate: '2022-01-26', lastRenovationDate: '2024-05-10', bookValue: 395000000,
    details: { classification: 'State Highway', startPoint: 'Ahmedabad SG Highway', endPoint: 'Vadodara Toll Plaza', lengthKm: 93.4, roadWidthM: 24, laneCount: 6, surfaceType: 'Asphalt', constructionYear: 2017 },
  },
  {
    id: 'RD-0002', category: 'Road', type: 'State Highway',
    name: 'SH-17 Rajkot-Jamnagar Highway', district: 'Rajkot',
    address: 'SH-17 via Paddhari', divisionId: 3,
    condition: 'Fair', status: 'Active',
    constructionDate: '2014-08-10', commissioningDate: '2015-11-15',
    constructionCost: 260000000, fundingSource: 'World Bank (G-RIDE Project)',
    warrantyExpiryDate: '2020-11-15', lastRenovationDate: '2023-10-12', bookValue: 182000000,
    details: { classification: 'State Highway', startPoint: 'Rajkot GSRTC Bus Stand', endPoint: 'Jamnagar City Gate', lengthKm: 103, roadWidthM: 14, laneCount: 4, surfaceType: 'Asphalt', constructionYear: 2015 },
  },
  {
    id: 'RD-0003', category: 'Road', type: 'Major District Road',
    name: 'Gandhinagar-Mehsana MDR', district: 'Gandhinagar',
    address: 'MDR via Kalol', divisionId: 1,
    condition: 'Good', status: 'Active',
    constructionDate: '2019-01-05', commissioningDate: '2020-03-20',
    constructionCost: 145000000, fundingSource: 'NABARD RIDF-XXV',
    warrantyExpiryDate: '2025-03-20', lastRenovationDate: null, bookValue: 125000000,
    details: { classification: 'Major District Road', startPoint: 'Gandhinagar Sector 1', endPoint: 'Mehsana Bypass', lengthKm: 64, roadWidthM: 10, laneCount: 2, surfaceType: 'Concrete', constructionYear: 2020 },
  },
  {
    id: 'RD-0004', category: 'Road', type: 'City Road',
    name: 'Surat Ring Road (South)', district: 'Surat',
    address: 'Southern Ring Road, Surat Municipal limit', divisionId: 2,
    condition: 'Poor', status: 'Under Maintenance',
    constructionDate: '2012-11-20', commissioningDate: '2013-12-15',
    constructionCost: 180000000, fundingSource: 'State Urban Infrastructure Fund',
    warrantyExpiryDate: '2018-12-15', lastRenovationDate: '2021-08-20', bookValue: 98000000,
    details: { classification: 'City Road', startPoint: 'Dumas Road Junction', endPoint: 'Kamrej Crossing', lengthKm: 22.5, roadWidthM: 18, laneCount: 4, surfaceType: 'Asphalt', constructionYear: 2013 },
  },
  {
    id: 'RD-0005', category: 'Road', type: 'City Road',
    name: 'Bhavnagar City Road Section-12', district: 'Bhavnagar',
    address: 'Waghawadi Road to Ghogha Circle', divisionId: 1,
    condition: 'Critical', status: 'Under Maintenance',
    constructionDate: '2011-04-12', commissioningDate: '2012-05-18',
    constructionCost: 65000000, fundingSource: 'Municipal Development Grant',
    warrantyExpiryDate: '2017-05-18', lastRenovationDate: '2020-02-14', bookValue: 28000000,
    details: { classification: 'City Road', startPoint: 'Waghawadi Road', endPoint: 'Ghogha Circle', lengthKm: 4.8, roadWidthM: 12, laneCount: 2, surfaceType: 'Asphalt', constructionYear: 2012 },
  },
  {
    id: 'RD-0006', category: 'Road', type: 'Major District Road',
    name: 'Junagadh-Veraval MDR', district: 'Junagadh',
    address: 'MDR connecting Junagadh to Veraval coast', divisionId: 3,
    condition: 'Fair', status: 'Active',
    constructionDate: '2015-09-01', commissioningDate: '2016-10-30',
    constructionCost: 195000000, fundingSource: 'Coastal Highway Development Fund',
    warrantyExpiryDate: '2021-10-30', lastRenovationDate: '2024-02-18', bookValue: 142000000,
    details: { classification: 'Major District Road', startPoint: 'Junagadh Talav Gate', endPoint: 'Veraval Port Area', lengthKm: 85, roadWidthM: 10, laneCount: 2, surfaceType: 'Asphalt', constructionYear: 2016 },
  },

  // Bridges (BR-0001 to BR-0005)
  {
    id: 'BR-0001', category: 'Bridge', type: 'Road Bridge',
    name: 'Sabarmati River Bridge (NH-48)', district: 'Ahmedabad',
    address: 'NH-48 crossing over Sabarmati River', divisionId: 1,
    condition: 'Good', status: 'Active',
    constructionDate: '2010-06-15', commissioningDate: '2012-08-15',
    constructionCost: 320000000, fundingSource: 'Central Road and Infrastructure Fund',
    warrantyExpiryDate: '2022-08-15', lastRenovationDate: '2023-04-10', bookValue: 245000000,
    details: { structureType: 'RCC', crossingType: 'River', lengthM: 380, widthM: 16, spanCount: 12, loadCapacityTons: 70, constructionYear: 2012 },
  },
  {
    id: 'BR-0002', category: 'Bridge', type: 'Road Bridge',
    name: 'Tapi Bridge (Surat)', district: 'Surat',
    address: 'Ring Road bridge over Tapi River', divisionId: 2,
    condition: 'Fair', status: 'Active',
    constructionDate: '2008-01-10', commissioningDate: '2010-03-25',
    constructionCost: 285000000, fundingSource: 'State Bridge Scheme',
    warrantyExpiryDate: '2020-03-25', lastRenovationDate: '2022-11-20', bookValue: 195000000,
    details: { structureType: 'Steel', crossingType: 'River', lengthM: 520, widthM: 14, spanCount: 16, loadCapacityTons: 60, constructionYear: 2010 },
  },
  {
    id: 'BR-0003', category: 'Bridge', type: 'Flyover',
    name: 'Narmada Flyover (Bharuch)', district: 'Bharuch',
    address: 'Golden Bridge approach, Bharuch', divisionId: 2,
    condition: 'Poor', status: 'Under Maintenance',
    constructionDate: '2013-05-18', commissioningDate: '2015-06-30',
    constructionCost: 190000000, fundingSource: 'National Highway Authority Grant',
    warrantyExpiryDate: '2025-06-30', lastRenovationDate: null, bookValue: 135000000,
    details: { structureType: 'RCC', crossingType: 'Road', lengthM: 210, widthM: 12, spanCount: 7, loadCapacityTons: 50, constructionYear: 2015 },
  },
  {
    id: 'BR-0004', category: 'Bridge', type: 'Culvert',
    name: 'Aji River Culvert (Rajkot)', district: 'Rajkot',
    address: 'Aji Dam Road, Rajkot outskirts', divisionId: 3,
    condition: 'Good', status: 'Active',
    constructionDate: '2017-10-01', commissioningDate: '2018-04-15',
    constructionCost: 35000000, fundingSource: 'District Panchayat Fund',
    warrantyExpiryDate: '2028-04-15', lastRenovationDate: null, bookValue: 29000000,
    details: { structureType: 'Stone Masonry', crossingType: 'River', lengthM: 45, widthM: 9, spanCount: 3, loadCapacityTons: 40, constructionYear: 2018 },
  },
  {
    id: 'BR-0005', category: 'Bridge', type: 'Road Bridge',
    name: 'Banas Bridge (Palanpur)', district: 'Banaskantha',
    address: 'NH-14 crossing over Banas River near Palanpur', divisionId: 3,
    condition: 'Critical', status: 'Under Maintenance',
    constructionDate: '2005-02-14', commissioningDate: '2007-01-26',
    constructionCost: 210000000, fundingSource: 'Interstate Connectivity Scheme',
    warrantyExpiryDate: '2017-01-26', lastRenovationDate: '2019-12-05', bookValue: 110000000,
    details: { structureType: 'Composite', crossingType: 'River', lengthM: 290, widthM: 12, spanCount: 9, loadCapacityTons: 50, constructionYear: 2007 },
  },

  // Buildings (BLD-0001 to BLD-0007)
  {
    id: 'BLD-0001', category: 'Building', type: 'Government Office',
    name: 'Sachivalay (State Secretariat Block 1-4)', district: 'Gandhinagar',
    address: 'Sector 10, Gandhinagar', divisionId: 4,
    condition: 'Good', status: 'Active',
    constructionDate: '1985-05-01', commissioningDate: '1988-05-01',
    constructionCost: 850000000, fundingSource: 'Capital Project Administration (CPA)',
    warrantyExpiryDate: '1998-05-01', lastRenovationDate: '2023-01-15', bookValue: 620000000,
    details: { buildingUse: 'Government Office', numberOfFloors: 8, areaSqM: 45000, constructionYear: 1988 },
  },
  {
    id: 'BLD-0002', category: 'Building', type: 'Government Office',
    name: 'District Collectorate Office', district: 'Ahmedabad',
    address: 'Lal Darwaja, Old City', divisionId: 1,
    condition: 'Fair', status: 'Active',
    constructionDate: '1972-10-15', commissioningDate: '1975-08-15',
    constructionCost: 120000000, fundingSource: 'Revenue Department Capital Fund',
    warrantyExpiryDate: '1985-08-15', lastRenovationDate: '2021-09-30', bookValue: 75000000,
    details: { buildingUse: 'Government Office', numberOfFloors: 4, areaSqM: 8500, constructionYear: 1975 },
  },
  {
    id: 'BLD-0003', category: 'Building', type: 'Government Office',
    name: 'R&B Circle Office Complex', district: 'Surat',
    address: 'Ring Road, Athwa Gate', divisionId: 2,
    condition: 'Good', status: 'Active',
    constructionDate: '2016-04-10', commissioningDate: '2017-09-01',
    constructionCost: 95000000, fundingSource: 'R&B Departmental Infrastructure',
    warrantyExpiryDate: '2027-09-01', lastRenovationDate: null, bookValue: 82000000,
    details: { buildingUse: 'Government Office', numberOfFloors: 3, areaSqM: 2400, constructionYear: 2017 },
  },
  {
    id: 'BLD-0004', category: 'Building', type: 'School',
    name: 'Government Model Higher Secondary School', district: 'Vadodara',
    address: 'Manjalpur, Vadodara', divisionId: 5,
    condition: 'Poor', status: 'Active',
    constructionDate: '2002-07-01', commissioningDate: '2003-08-15',
    constructionCost: 45000000, fundingSource: 'Samagra Shiksha Abhiyan',
    warrantyExpiryDate: '2013-08-15', lastRenovationDate: '2018-06-10', bookValue: 26000000,
    details: { buildingUse: 'School', numberOfFloors: 2, areaSqM: 1200, constructionYear: 2003 },
  },
  {
    id: 'BLD-0005', category: 'Building', type: 'Healthcare Facility',
    name: 'Community Health Centre', district: 'Mehsana',
    address: 'Visnagar Road, Mehsana', divisionId: 4,
    condition: 'Fair', status: 'Active',
    constructionDate: '2011-02-18', commissioningDate: '2012-10-02',
    constructionCost: 78000000, fundingSource: 'National Health Mission (NHM)',
    warrantyExpiryDate: '2022-10-02', lastRenovationDate: '2024-01-20', bookValue: 56000000,
    details: { buildingUse: 'Healthcare Facility', numberOfFloors: 2, areaSqM: 3200, constructionYear: 2012 },
  },
  {
    id: 'BLD-0006', category: 'Building', type: 'Residential Building',
    name: 'Government PWD Circuit House', district: 'Kutch',
    address: 'Bhuj-Mandvi Road, Bhuj', divisionId: 3,
    condition: 'Poor', status: 'Active',
    constructionDate: '2004-03-20', commissioningDate: '2005-05-15',
    constructionCost: 32000000, fundingSource: 'State Hospitality Scheme',
    warrantyExpiryDate: '2015-05-15', lastRenovationDate: '2019-07-10', bookValue: 18000000,
    details: { buildingUse: 'Residential', numberOfFloors: 1, areaSqM: 600, constructionYear: 2005 },
  },
  {
    id: 'BLD-0007', category: 'Building', type: 'Government Office',
    name: 'District Panchayat Bhawan', district: 'Rajkot',
    address: 'Dhebar Road, Rajkot', divisionId: 3,
    condition: 'Good', status: 'Active',
    constructionDate: '2018-06-01', commissioningDate: '2019-12-25',
    constructionCost: 115000000, fundingSource: 'Panchayat Infrastructure Scheme',
    warrantyExpiryDate: '2029-12-25', lastRenovationDate: null, bookValue: 104000000,
    details: { buildingUse: 'Government Office', numberOfFloors: 3, areaSqM: 4100, constructionYear: 2019 },
  },
];

// ─── 12 Periodic Inspections across Roads, Bridges, Buildings ────────────────
export const SEED_INSPECTIONS = [
  {
    id: 'INSP-0001',
    assetId: 'RD-0001',
    inspectionDate: '2026-08-10T10:00:00Z',
    inspectorId: 'usr_road_ahd',
    inspectorName: 'Bhavesh Solanki',
    inspectionType: 'Routine',
    conditionAssessment: 'Good',
    observations: 'Pavement surface smooth across all 6 lanes. Minor crack sealing required near KM 42.',
    defectsIdentified: 'Isolated longitudinal hairline cracks between KM 42 and 43.',
    recommendedActions: 'Routine bitumen emulsion crack sealing during regular quarterly maintenance.',
    nextDueDate: '2027-02-10T00:00:00Z',
    checklist: {
      surface_condition: 'Good',
      potholes_cracks: 'Minor Cracking',
      drainage_condition: 'Clear & Functional',
      road_markings: 'Clearly Visible',
      shoulder_condition: 'Stable & Flush',
    },
  },
  {
    id: 'INSP-0002',
    assetId: 'BR-0005',
    inspectionDate: '2026-08-25T11:30:00Z',
    inspectorId: 'usr_bridge_vad',
    inspectorName: 'Dhruv Mehta',
    inspectionType: 'Detailed',
    conditionAssessment: 'Critical',
    observations: 'Severe deterioration of elastomeric bearings on pier 3. Longitudinal cracks visible along pier cap with concrete spalling.',
    defectsIdentified: 'Bearing displacement of 35mm on Pier 3, exposed rusted rebar on underside of girder 2.',
    recommendedActions: 'Immediate structural shoring and jack-up bearing replacement. Heavy vehicle speed limit reduction to 20 km/h.',
    nextDueDate: '2026-09-25T00:00:00Z', // Overdue
    checklist: {
      structural_condition: 'Structural Distress',
      visible_cracks: 'Active Widening Cracks',
      corrosion: 'Severe Section Loss',
      drainage_condition: 'Partially Clogged',
      expansion_joints: 'Bearing Failure / Jammed',
      safety_barriers: 'Intact & Firm',
    },
  },
  {
    id: 'INSP-0003',
    assetId: 'BLD-0004',
    inspectionDate: '2026-08-15T14:00:00Z',
    inspectorId: 'usr_building_sur',
    inspectorName: 'Riya Parekh',
    inspectionType: 'Routine',
    conditionAssessment: 'Poor',
    observations: 'Extensive monsoon water seepage in 1st floor classrooms 3 & 4. Ceiling plaster peeling.',
    defectsIdentified: 'Terrace waterproofing failure, cracked stormwater downpipes.',
    recommendedActions: 'Apply polymer modified bitumen waterproofing membrane and replace PVC downpipes.',
    nextDueDate: '2026-10-15T00:00:00Z',
    checklist: {
      structural_condition: 'Minor Hairline Cracks',
      electrical_condition: 'Exposed Cables / Tripping',
      plumbing_condition: 'Active Seepage / Leakage',
      roof_condition: 'Active Seepage',
      fire_safety: 'Extinguishers Valid & Clear',
    },
  },
  {
    id: 'INSP-0004',
    assetId: 'RD-0004',
    inspectionDate: '2026-09-02T09:30:00Z',
    inspectorId: 'usr_road_sur',
    inspectorName: 'Kiran Desai',
    inspectionType: 'Detailed',
    conditionAssessment: 'Poor',
    observations: 'Multiple alligator cracks and pothole cluster spanning 350 meters near Dumas junction.',
    defectsIdentified: 'Sub-base moisture entrapment resulting in recurrent surface deformation.',
    recommendedActions: 'Milling of damaged bituminous top layer (50mm), geosynthetic reinforcement, and fresh DBM overlay.',
    nextDueDate: '2026-10-02T00:00:00Z',
    checklist: {
      surface_condition: 'Poor',
      potholes_cracks: 'Severe Distress',
      drainage_condition: 'Partially Blocked',
      road_markings: 'Faded Markings',
      shoulder_condition: 'Minor Erosion',
    },
  },
  {
    id: 'INSP-0005',
    assetId: 'BR-0001',
    inspectionDate: '2026-07-20T10:15:00Z',
    inspectorId: 'usr_bridge_ahd',
    inspectorName: 'Nisha Vaghela',
    inspectionType: 'Routine',
    conditionAssessment: 'Good',
    observations: 'Sabarmati Bridge deck and substructure in sound condition. Expansion joints operating within thermal tolerance.',
    defectsIdentified: 'East side pedestrian railing had impact damage from vehicular sideswipe.',
    recommendedActions: 'Railing replacement completed under maintenance order.',
    nextDueDate: '2027-01-20T00:00:00Z',
    checklist: {
      structural_condition: 'Sound & Intact',
      visible_cracks: 'None Observed',
      corrosion: 'None',
      drainage_condition: 'Clear',
      expansion_joints: 'Smooth & Aligned',
      safety_barriers: 'Dented / Scratched',
    },
  },
  {
    id: 'INSP-0006',
    assetId: 'BLD-0001',
    inspectionDate: '2026-08-01T15:00:00Z',
    inspectorId: 'usr_building_ahd',
    inspectorName: 'Pooja Desai',
    inspectionType: 'Routine',
    conditionAssessment: 'Good',
    observations: 'Sachivalay Block structural columns and fire safety equipment fully compliant with state norms.',
    defectsIdentified: 'Fifth floor HVAC compressor chiller loop tripping under peak heat load.',
    recommendedActions: 'Compressor overhaul and refrigerant recharge.',
    nextDueDate: '2027-02-01T00:00:00Z',
    checklist: {
      structural_condition: 'No Signs of Distress',
      electrical_condition: 'Safe & Inspected',
      plumbing_condition: 'Normal Flow, No Leaks',
      roof_condition: 'Dry & Clean',
      fire_safety: 'Extinguishers Valid & Clear',
    },
  },
];

// ─── 14 Seed Issues across Complete Lifecycle ────────────────────────────────
export const SEED_ISSUES = [
  // 1. Open (Newly reported, awaiting officer inspection & estimation)
  {
    id: 'ISS-0001', assetId: 'RD-0004', issueCategory: 'Potholes',
    description: 'Multiple large potholes on the southbound lane near Kamrej junction, causing severe traffic slowdowns.',
    priority: 'High', reportedBy: 'Vikram Trivedi (Administrator)',
    assignedTo: 'usr_road_sur', assignedOfficerName: 'Kiran Desai',
    status: 'Open', approvalStatus: 'None', approvedAmount: null,
    currentEstimateId: null, actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: 'INSP-0004', verificationStatus: null,
    reportedDate: '2026-09-15T09:30:00Z', resolutionNotes: null, completedDate: null,
  },

  // 2. Pending Approval (Officer submitted Estimate V1 with line items, awaiting Admin action)
  {
    id: 'ISS-0002', assetId: 'BR-0005', issueCategory: 'Structural Cracks',
    description: 'Visible longitudinal cracks on pier 3 and 4, approximately 2-3mm wide. Requires urgent structural bearing replacement.',
    priority: 'Critical', reportedBy: 'Dhruv Mehta',
    assignedTo: 'usr_bridge_vad', assignedOfficerName: 'Dhruv Mehta',
    status: 'Pending Approval', approvalStatus: 'Pending Review', approvedAmount: null,
    currentEstimateId: 'EST-0001', actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: 'INSP-0002', verificationStatus: null,
    reportedDate: '2026-09-10T14:15:00Z', resolutionNotes: null, completedDate: null,
  },

  // 3. Open (Estimate V1 was returned with 'Revision Requested' by Admin, officer can submit V2)
  {
    id: 'ISS-0003', assetId: 'BLD-0004', issueCategory: 'Roof Leakage',
    description: 'Severe roof leakage in classrooms 3 and 4 during monsoon. Ceiling plaster falling in patches.',
    priority: 'High', reportedBy: 'Riya Parekh',
    assignedTo: 'usr_building_sur', assignedOfficerName: 'Riya Parekh',
    status: 'Open', approvalStatus: 'Revision Requested', approvedAmount: null,
    currentEstimateId: 'EST-0002', actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: 'INSP-0003', verificationStatus: null,
    reportedDate: '2026-09-12T11:00:00Z', resolutionNotes: null, completedDate: null,
  },

  // 4. In Progress (Estimate Approved by Admin, work underway with progress logged)
  {
    id: 'ISS-0004', assetId: 'RD-0005', issueCategory: 'Road Surface Damage',
    description: 'Complete surface deterioration over 1.2 km stretch between Waghawadi and Kalanala. Exposed base layer.',
    priority: 'Critical', reportedBy: 'Bhavesh Solanki',
    assignedTo: 'usr_road_ahd', assignedOfficerName: 'Bhavesh Solanki',
    status: 'In Progress', approvalStatus: 'Approved', approvedAmount: 1280000,
    currentEstimateId: 'EST-0003', actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: null, verificationStatus: null,
    reportedDate: '2026-09-01T08:45:00Z', resolutionNotes: null, completedDate: null,
  },

  // 5. Awaiting Verification (Work completed by officer, submitted actual spend with variance note, awaiting admin verification)
  {
    id: 'ISS-0005', assetId: 'BLD-0006', issueCategory: 'Plumbing / Water Supply',
    description: 'Water supply pipeline burst near the main entrance. Intermittent supply affecting all guest suites.',
    priority: 'Medium', reportedBy: 'Jatin Makwana',
    assignedTo: 'usr_building_raj', assignedOfficerName: 'Jatin Makwana',
    status: 'Awaiting Verification', approvalStatus: 'Approved', approvedAmount: 185000,
    currentEstimateId: 'EST-0004', actualCost: 192000, costVariance: 7000,
    varianceReason: 'Additional 15 meters of corroded GI pipeline discovered underground requiring high-pressure CPVC bypass.',
    originatingInspectionId: null, verificationStatus: 'Pending Verification',
    reportedDate: '2026-09-05T16:30:00Z',
    resolutionNotes: 'Replaced 45m main inlet line with heavy-duty CPVC pipes. Replaced 2 gate valves and pressure tested to 6 kg/sq cm.',
    completedDate: '2026-09-24T18:00:00Z',
  },

  // 6. In Progress (Bridge expansion joint replacement)
  {
    id: 'ISS-0006', assetId: 'BR-0003', issueCategory: 'Expansion Joint Damage',
    description: 'Expansion joints at both ends of the flyover are damaged. Metal plates exposed and creating noise.',
    priority: 'High', reportedBy: 'Harshil Trivedi',
    assignedTo: 'usr_bridge_sur', assignedOfficerName: 'Harshil Trivedi',
    status: 'In Progress', approvalStatus: 'Approved', approvedAmount: 420000,
    currentEstimateId: 'EST-0005', actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: null, verificationStatus: null,
    reportedDate: '2026-09-04T13:20:00Z', resolutionNotes: null, completedDate: null,
  },

  // 7. In Progress (Collectorate electrical rewiring)
  {
    id: 'ISS-0007', assetId: 'BLD-0002', issueCategory: 'Electrical Problem',
    description: 'Frequent power tripping on the 2nd floor. Wiring inspection needed. Backup generator also failing.',
    priority: 'High', reportedBy: 'Pooja Desai',
    assignedTo: 'usr_building_ahd', assignedOfficerName: 'Pooja Desai',
    status: 'In Progress', approvalStatus: 'Approved', approvedAmount: 310000,
    currentEstimateId: 'EST-0006', actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: null, verificationStatus: null,
    reportedDate: '2026-09-06T09:00:00Z', resolutionNotes: null, completedDate: null,
  },

  // 8. Open (Unassigned Road drainage problem)
  {
    id: 'ISS-0008', assetId: 'RD-0004', issueCategory: 'Waterlogging / Drainage',
    description: 'Blocked storm drains near Dumas junction causing waterlogging during rains. 200m stretch affected.',
    priority: 'Medium', reportedBy: 'Vikram Trivedi (Administrator)',
    assignedTo: null, assignedOfficerName: null,
    status: 'Open', approvalStatus: 'None', approvedAmount: null,
    currentEstimateId: null, actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: null, verificationStatus: null,
    reportedDate: '2026-09-18T10:00:00Z', resolutionNotes: null, completedDate: null,
  },

  // 9. Open (Bridge pier corrosion)
  {
    id: 'ISS-0009', assetId: 'BR-0005', issueCategory: 'Corrosion',
    description: 'Heavy corrosion on steel reinforcement bars visible on the underside of deck slab near pier 2.',
    priority: 'Critical', reportedBy: 'Dhruv Mehta',
    assignedTo: 'usr_bridge_vad', assignedOfficerName: 'Dhruv Mehta',
    status: 'Open', approvalStatus: 'None', approvedAmount: null,
    currentEstimateId: null, actualCost: null, costVariance: null, varianceReason: null,
    originatingInspectionId: 'INSP-0002', verificationStatus: null,
    reportedDate: '2026-09-14T11:30:00Z', resolutionNotes: null, completedDate: null,
  },

  // 10. Completed (Verified by Admin — Road marking repaint)
  {
    id: 'ISS-0010', assetId: 'RD-0002', issueCategory: 'Road Marking Damage',
    description: 'Faded lane markings over 5 km stretch near Paddhari. Centre line and edge markings not visible at night.',
    priority: 'Low', reportedBy: 'Mehul Parmar',
    assignedTo: 'usr_road_raj', assignedOfficerName: 'Mehul Parmar',
    status: 'Completed', approvalStatus: 'Approved', approvedAmount: 85000,
    currentEstimateId: 'EST-0007', actualCost: 82500, costVariance: -2500, varianceReason: 'Slightly lower material consumption than estimated.',
    originatingInspectionId: null, verificationStatus: 'Verified',
    verifiedBy: 'Vikram Trivedi (Administrator)', verifiedAt: '2026-09-03T11:00:00Z',
    verificationRemarks: 'Work inspected on-site by Executive Engineer. High visibility retroreflective markings verified.',
    reportedDate: '2026-08-15T10:00:00Z',
    resolutionNotes: 'Lane markings repainted using thermoplastic paint with retroreflective glass beads. 5.2 km stretch completed.',
    completedDate: '2026-09-02T16:00:00Z',
  },

  // 11. Completed (Verified by Admin — HVAC chiller compressor)
  {
    id: 'ISS-0011', assetId: 'BLD-0001', issueCategory: 'HVAC / Ventilation',
    description: 'Central AC system on 5th floor not cooling. Compressor making loud grinding noise.',
    priority: 'Medium', reportedBy: 'Pooja Desai',
    assignedTo: 'usr_building_ahd', assignedOfficerName: 'Pooja Desai',
    status: 'Completed', approvalStatus: 'Approved', approvedAmount: 240000,
    currentEstimateId: 'EST-0008', actualCost: 238000, costVariance: -2000, varianceReason: null,
    originatingInspectionId: 'INSP-0006', verificationStatus: 'Verified',
    verifiedBy: 'Vikram Trivedi (Administrator)', verifiedAt: '2026-09-06T14:30:00Z',
    verificationRemarks: 'Temperature differential and power consumption within specification.',
    reportedDate: '2026-08-20T14:30:00Z',
    resolutionNotes: 'Compressor replaced with OEM 15-ton scroll compressor. R-410A refrigerant recharged. 48-hour continuous test passed.',
    completedDate: '2026-09-05T11:00:00Z',
  },

  // 12. Completed (Verified by Admin — Sabarmati Bridge railing)
  {
    id: 'ISS-0012', assetId: 'BR-0001', issueCategory: 'Railing / Parapet Damage',
    description: 'Vehicle impact damage to railing on east side, approximately 8m section bent and separated from deck.',
    priority: 'Medium', reportedBy: 'Nisha Vaghela',
    assignedTo: 'usr_bridge_ahd', assignedOfficerName: 'Nisha Vaghela',
    status: 'Completed', approvalStatus: 'Approved', approvedAmount: 110000,
    currentEstimateId: 'EST-0009', actualCost: 115000, costVariance: 5000,
    varianceReason: 'Additional anchorage brackets required due to localized spalling on concrete kerb.',
    originatingInspectionId: 'INSP-0005', verificationStatus: 'Verified',
    verifiedBy: 'Vikram Trivedi (Administrator)', verifiedAt: '2026-08-29T10:00:00Z',
    verificationRemarks: 'Anchor bolts pull-out test verified. Anti-corrosive primer and yellow/black PU paint applied properly.',
    reportedDate: '2026-08-10T08:00:00Z',
    resolutionNotes: 'Damaged 8m railing section dismantled. Fabricated galvanized tubular steel railing anchored with chemical fasteners.',
    completedDate: '2026-08-28T15:30:00Z',
  },

  // 13. Completed (Verified by Admin — Health Centre toughened glass windows)
  {
    id: 'ISS-0013', assetId: 'BLD-0005', issueCategory: 'Doors / Windows',
    description: 'Multiple window panes broken in outpatient ward. Security and weather protection compromised.',
    priority: 'Medium', reportedBy: 'Pooja Desai',
    assignedTo: 'usr_building_ahd', assignedOfficerName: 'Pooja Desai',
    status: 'Completed', approvalStatus: 'Approved', approvedAmount: 62000,
    currentEstimateId: 'EST-0010', actualCost: 59000, costVariance: -3000, varianceReason: null,
    originatingInspectionId: null, verificationStatus: 'Verified',
    verifiedBy: 'Vikram Trivedi (Administrator)', verifiedAt: '2026-08-23T16:00:00Z',
    verificationRemarks: 'Quality of toughened glass (5mm) and silicon sealing verified.',
    reportedDate: '2026-08-05T09:00:00Z',
    resolutionNotes: '14 window panes replaced with 5mm toughened safety glass. Aluminium beadings and weatherproof silicon seal applied.',
    completedDate: '2026-08-22T14:00:00Z',
  },

  // 14. Completed (Verified by Admin — Road shoulder erosion rebuild)
  {
    id: 'ISS-0014', assetId: 'RD-0006', issueCategory: 'Shoulder / Edge Damage',
    description: 'Road shoulder erosion near Keshod village. 500m stretch with dangerous drop-offs up to 25cm.',
    priority: 'High', reportedBy: 'Mehul Parmar',
    assignedTo: 'usr_road_raj', assignedOfficerName: 'Mehul Parmar',
    status: 'Completed', approvalStatus: 'Approved', approvedAmount: 320000,
    currentEstimateId: 'EST-0011', actualCost: 318000, costVariance: -2000, varianceReason: null,
    originatingInspectionId: null, verificationStatus: 'Verified',
    verifiedBy: 'Vikram Trivedi (Administrator)', verifiedAt: '2026-09-11T12:00:00Z',
    verificationRemarks: 'Compaction density verified. Retroreflective delineators installed at 20m intervals.',
    reportedDate: '2026-08-12T11:00:00Z',
    resolutionNotes: 'Shoulder excavated, filled with graded Granular Sub-base (GSB) compacted in 150mm layers. 25 solar road studs installed.',
    completedDate: '2026-09-10T10:30:00Z',
  },
];

// ─── Component-Wise Estimates Data ───────────────────────────────────────────
export const SEED_ESTIMATES = [
  // EST-0001: Submitted on ISS-0002 (Banas Bridge) — Status: Pending Review
  {
    id: 'EST-0001', issueId: 'ISS-0002', version: 1,
    inspectionDate: '2026-09-11T10:00:00Z',
    observedProblem: 'Elastomeric bearing displacement and pier cap cracking.',
    probableCause: 'Cyclic thermal loading, heavy overload axles, and age-related degradation of rubber pads.',
    repairMethod: 'Hydraulic jacking of girder, removal of damaged bearing, installation of new pot-PTFE bearing, epoxy injection for cracks.',
    estimatedDurationDays: 14,
    subtotal: 280000, contingencyPercent: 5, taxPercent: 18, totalEstimatedCost: 347200,
    status: 'Pending Review',
    submittedBy: 'usr_bridge_vad', submittedByName: 'Dhruv Mehta', submittedAt: '2026-09-12T15:30:00Z',
    reviewedBy: null, reviewedByName: null, reviewedAt: null, reviewRemarks: null, approvedAmount: null,
    items: [
      { itemName: 'Heavy Duty Hydraulic Jacking Rental (200T)', description: '4-point synchronized hydraulic jack system with manifold', quantity: 1, unit: 'Job', unitCost: 65000, proposedVendor: 'Gujarat Lifting & Hydraulic Tools, Vadodara', vendorContact: '98250-11223', quotationRef: 'GLH/2026/089' },
      { itemName: 'Pot-PTFE Bearing Assembly (500T Capacity)', description: 'IRC:83 Part-III compliant structural pot bearing with stainless steel sliding plate', quantity: 2, unit: 'Nos', unitCost: 75000, proposedVendor: 'Sanfield India Ltd.', vendorContact: '0265-2456789', quotationRef: 'SIL/Q/2026/441' },
      { itemName: 'Low Viscosity Epoxy Injection Resin', description: 'ASTM C881 Type I Grade 1 high modulus injection grout for pier cracks', quantity: 25, unit: 'kg', unitCost: 1200, proposedVendor: 'Fosroc Chemicals India', vendorContact: '98980-33445', quotationRef: 'FOS/26/892' },
      { itemName: 'Specialist Structural Labor & Safety Rigging', description: 'Certified bridge mechanics and safety riggers for 7 days', quantity: 7, unit: 'Days', unitCost: 6000, proposedVendor: 'R&B Approved Skilled Gang', vendorContact: 'N/A', quotationRef: 'SOR-2026-L1' },
    ],
  },

  // EST-0002: Submitted on ISS-0003 (Vadodara School Roof) — Status: Revision Requested
  {
    id: 'EST-0002', issueId: 'ISS-0003', version: 1,
    inspectionDate: '2026-09-13T11:00:00Z',
    observedProblem: 'Roof water ponding, hairline shrinkage cracks, damaged rainwater downpipes.',
    probableCause: 'Lack of slope towards rainwater gullies and weathered brick-coba waterproofing.',
    repairMethod: 'Dismantle existing loose coba, provide grading plaster, 4mm APP membrane, replace pipes.',
    estimatedDurationDays: 10,
    subtotal: 180000, contingencyPercent: 5, taxPercent: 18, totalEstimatedCost: 223200,
    status: 'Revision Requested',
    submittedBy: 'usr_building_sur', submittedByName: 'Riya Parekh', submittedAt: '2026-09-14T10:00:00Z',
    reviewedBy: 'usr_admin', reviewedByName: 'Vikram Trivedi', reviewedAt: '2026-09-15T16:00:00Z',
    reviewRemarks: 'The proposed APP membrane specification requires two quotes. Please include slope grading plaster measurement and clarify if warranty includes 5 years free maintenance.',
    approvedAmount: null,
    items: [
      { itemName: 'APP Modified Bituminous Waterproofing Membrane (4mm)', description: 'Torch-applied polyester reinforced waterproofing sheet', quantity: 450, unit: 'sq m', unitCost: 280, proposedVendor: 'Shreeji Waterproofing Contractors, Surat', vendorContact: '98241-77889', quotationRef: 'SWC/26/102' },
      { itemName: 'Polymer Cement Mortar for Crack Treatment', description: 'SBR latex bonding agent with polymer repair mortar', quantity: 20, unit: 'Bags', unitCost: 950, proposedVendor: 'Dr. Fixit Pidilite Depot', vendorContact: '0261-2678901', quotationRef: 'DF/RT/551' },
      { itemName: 'Heavy Duty PVC Rainwater Downpipes (110mm)', description: 'UV resistant Class-3 drainage pipes with clamps and elbows', quantity: 30, unit: 'Meters', unitCost: 450, proposedVendor: 'Supreme Pipes Distributor', vendorContact: '98251-44556', quotationRef: 'SPD/2026/08' },
      { itemName: 'Surface Preparation and Debris Disposal', description: 'Chipping old loose coba and carting away debris', quantity: 1, unit: 'Lump Sum', unitCost: 21500, proposedVendor: 'Local Labor Syndicate', vendorContact: 'N/A', quotationRef: 'SOR-2026' },
    ],
  },

  // EST-0003: Submitted on ISS-0004 (Bhavnagar Road) — Status: Approved
  {
    id: 'EST-0003', issueId: 'ISS-0004', version: 1,
    inspectionDate: '2026-09-02T10:00:00Z',
    observedProblem: 'Total surface breakup, base course exposed with 15-20cm ruts.',
    probableCause: 'Inadequate drainage combined with heavy port logistics truck traffic.',
    repairMethod: 'Cold milling 50mm, 75mm Dense Bituminous Macadam (DBM) + 40mm Bituminous Concrete (BC).',
    estimatedDurationDays: 20,
    subtotal: 1040000, contingencyPercent: 5, taxPercent: 18, totalEstimatedCost: 1289600,
    status: 'Approved',
    submittedBy: 'usr_road_ahd', submittedByName: 'Bhavesh Solanki', submittedAt: '2026-09-03T11:00:00Z',
    reviewedBy: 'usr_admin', reviewedByName: 'Vikram Trivedi', reviewedAt: '2026-09-04T12:00:00Z',
    reviewRemarks: 'Approved as per R&B Schedule of Rates (SOR 2026). Ensure traffic diversion is posted in local newspapers.',
    approvedAmount: 1280000,
    items: [
      { itemName: 'Cold Milling of Asphalt Pavement (50mm depth)', description: 'Milling machine with sensor control, disposal of milled RAP', quantity: 8400, unit: 'sq m', unitCost: 35, proposedVendor: 'Gujarat Road Infrastructure Equipment Ltd.', vendorContact: '98795-00112', quotationRef: 'GRIE/26/304' },
      { itemName: 'Dense Bituminous Macadam (DBM) with VG-30 Bitumen', description: 'Batch plant mixed hot mix asphalt laid with hydrostatic sensor paver', quantity: 650, unit: 'Tons', unitCost: 850, proposedVendor: 'Adani Bitumen Plant, Mundra', vendorContact: '02838-255000', quotationRef: 'ABP/SOR/88' },
      { itemName: 'Bituminous Concrete (BC) Wearing Course (40mm)', description: 'Polymer modified bitumen wearing surface', quantity: 380, unit: 'Tons', unitCost: 950, proposedVendor: 'Adani Bitumen Plant, Mundra', vendorContact: '02838-255000', quotationRef: 'ABP/SOR/89' },
      { itemName: 'Bitumen Tack Coat & Prime Coat Application', description: 'Slow-setting emulsion spray @ 0.25 kg/sq m', quantity: 8400, unit: 'sq m', unitCost: 10, proposedVendor: 'Hindustan Colas Ltd.', vendorContact: '98250-99887', quotationRef: 'HIN/2026/02' },
    ],
  },

  // EST-0004: Submitted on ISS-0005 (Kutch Circuit House) — Status: Approved
  {
    id: 'EST-0004', issueId: 'ISS-0005', version: 1,
    inspectionDate: '2026-09-06T10:00:00Z',
    observedProblem: 'Sub-surface main burst with water hammer shocks.',
    probableCause: 'Galvanized iron pipe corroded through after 20 years of saline groundwater contact.',
    repairMethod: 'Excavate service trench, lay SDR-11 CPVC high pressure main with isolating sluice valves.',
    estimatedDurationDays: 5,
    subtotal: 150000, contingencyPercent: 5, taxPercent: 18, totalEstimatedCost: 186000,
    status: 'Approved',
    submittedBy: 'usr_building_raj', submittedByName: 'Jatin Makwana', submittedAt: '2026-09-07T12:00:00Z',
    reviewedBy: 'usr_admin', reviewedByName: 'Vikram Trivedi', reviewedAt: '2026-09-08T15:00:00Z',
    reviewRemarks: 'Approved under Emergency Maintenance Works. Expedite to prevent water loss.',
    approvedAmount: 185000,
    items: [
      { itemName: 'Heavy Duty CPVC Water Pipes (63mm OD SDR-11)', description: 'Chlorinated polyvinyl chloride pressure pipes with fittings', quantity: 60, unit: 'Meters', unitCost: 1100, proposedVendor: 'Astral Pipes Depot, Bhuj', vendorContact: '98252-77112', quotationRef: 'AST/BH/26/19' },
      { itemName: 'Cast Iron Resilient Sluice Valves (65mm)', description: 'Flanged PN-16 isolation valves with handwheel', quantity: 3, unit: 'Nos', unitCost: 12000, proposedVendor: 'Kirloskar Valve Agency, Rajkot', vendorContact: '0281-2244556', quotationRef: 'KVA/2026/41' },
      { itemName: 'Trench Excavation, Bedding & Masonry Valve Chambers', description: 'Manual trenching in hard murrum and brick masonry chambers', quantity: 1, unit: 'Job', unitCost: 48000, proposedVendor: 'Jay Ambe Construction, Bhuj', vendorContact: '94260-88990', quotationRef: 'JAC/26/04' },
    ],
  },
];

// ─── Progress Updates Seed Data ──────────────────────────────────────────────
export const SEED_PROGRESS = [
  // For ISS-0004 (Bhavnagar Road — In Progress)
  {
    issueId: 'ISS-0004',
    officerId: 'usr_road_ahd', officerName: 'Bhavesh Solanki',
    progressPercent: 20,
    workStartDate: '2026-09-08T09:00:00Z',
    expectedCompletionDate: '2026-09-28T00:00:00Z',
    notes: 'Cold milling machine deployed. 1.2 km of degraded surface milled and base course cleared. Traffic diverted via bypass.',
    createdAt: '2026-09-12T16:00:00Z',
  },
  {
    issueId: 'ISS-0004',
    officerId: 'usr_road_ahd', officerName: 'Bhavesh Solanki',
    progressPercent: 45,
    workStartDate: '2026-09-08T09:00:00Z',
    expectedCompletionDate: '2026-09-28T00:00:00Z',
    notes: 'Dense Bituminous Macadam (DBM) base layer laid over 800m. Compaction test achieved 98.5%. Wearing course work starts tomorrow.',
    createdAt: '2026-09-20T17:30:00Z',
  },

  // For ISS-0005 (Kutch Circuit House — Awaiting Verification)
  {
    issueId: 'ISS-0005',
    officerId: 'usr_building_raj', officerName: 'Jatin Makwana',
    progressPercent: 50,
    workStartDate: '2026-09-10T08:00:00Z',
    expectedCompletionDate: '2026-09-22T00:00:00Z',
    notes: 'Trench excavated along main corridor. Old corroded GI lines dismantled and removed.',
    createdAt: '2026-09-14T11:00:00Z',
  },
  {
    issueId: 'ISS-0005',
    officerId: 'usr_building_raj', officerName: 'Jatin Makwana',
    progressPercent: 100,
    workStartDate: '2026-09-10T08:00:00Z',
    expectedCompletionDate: '2026-09-24T00:00:00Z',
    notes: 'New CPVC main pipe network installed and hydrostatically tested for 4 hours. No pressure drops. Masonry inspection chambers completed.',
    createdAt: '2026-09-24T17:00:00Z',
  },
];

// ─── Actual Expenditure Items for Completed & Awaiting Verification ──────────
export const SEED_ACTUAL_ITEMS = [
  // For ISS-0005 (Kutch Circuit House)
  { issueId: 'ISS-0005', itemName: 'Heavy Duty CPVC Water Pipes (63mm OD SDR-11)', actualQuantity: 75, actualUnitCost: 1100, actualTotal: 82500, actualVendor: 'Astral Pipes Depot, Bhuj' },
  { issueId: 'ISS-0005', itemName: 'Cast Iron Resilient Sluice Valves (65mm)', actualQuantity: 3, actualUnitCost: 12000, actualTotal: 36000, actualVendor: 'Kirloskar Valve Agency, Rajkot' },
  { issueId: 'ISS-0005', itemName: 'Trench Excavation, Bedding & Masonry Chambers', actualQuantity: 1, actualUnitCost: 52000, actualTotal: 52000, actualVendor: 'Jay Ambe Construction, Bhuj' },
  { issueId: 'ISS-0005', itemName: 'Applicable GST & Contingencies', actualQuantity: 1, actualUnitCost: 21500, actualTotal: 21500, actualVendor: 'State Treasury GST' },

  // For ISS-0010 (Road marking completed)
  { issueId: 'ISS-0010', itemName: 'Thermoplastic Road Marking Paint (White & Yellow)', actualQuantity: 42, actualUnitCost: 1400, actualTotal: 58800, actualVendor: 'Automark Technologies India Ltd.' },
  { issueId: 'ISS-0010', itemName: 'Retroreflective Glass Beads (Type-II)', actualQuantity: 8, actualUnitCost: 1200, actualTotal: 9600, actualVendor: 'Potters India Ltd.' },
  { issueId: 'ISS-0010', itemName: 'Mechanical Road Marking Machine & Operator', actualQuantity: 1, actualUnitCost: 14100, actualTotal: 14100, actualVendor: 'Rajkot Traffic Equipment Syndicate' },

  // For ISS-0011 (HVAC completed)
  { issueId: 'ISS-0011', itemName: 'OEM Scroll Chiller Compressor (15 Ton Capacity)', actualQuantity: 1, actualUnitCost: 185000, actualTotal: 185000, actualVendor: 'Blue Star India Ltd., Ahmedabad' },
  { issueId: 'ISS-0011', itemName: 'R-410A Refrigerant Gas & Dryer Filters', actualQuantity: 3, actualUnitCost: 6500, actualTotal: 19500, actualVendor: 'Cooling Chemical Depot' },
  { issueId: 'ISS-0011', itemName: 'Authorized HVAC Certified Labor & Commissioning', actualQuantity: 1, actualUnitCost: 33500, actualTotal: 33500, actualVendor: 'HVAC Services, Gandhinagar' },
];

// ─── Check if Seed Data is Present ───────────────────────────────────────────
async function isSeedDataPresent() {
  try {
    const rows = await query('SELECT COUNT(*) AS count FROM users');
    return parseInt(rows[0].count, 10) > 0;
  } catch (e) {
    return false;
  }
}

// ─── Seed Users ──────────────────────────────────────────────────────────────
async function seedUsers() {
  for (const u of SEEDED_USERS) {
    await query(
      `INSERT INTO users (id, name, role, designation, category, division_name, division_id, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         designation = EXCLUDED.designation,
         category = EXCLUDED.category,
         division_name = EXCLUDED.division_name,
         division_id = EXCLUDED.division_id,
         avatar = EXCLUDED.avatar`,
      [u.id, u.name, u.role, u.designation, u.category, u.divisionName, u.divisionId, u.avatar]
    );
  }
}

// ─── Seed Assets ─────────────────────────────────────────────────────────────
async function seedAssets() {
  for (let i = 0; i < SEED_ASSETS.length; i++) {
    const a = SEED_ASSETS[i];
    const daysAgo = 30 + (SEED_ASSETS.length - i) * 3;

    await query(
      `INSERT INTO assets (
         id, category, type, name, district, address, division_id, condition, status,
         construction_date, commissioning_date, construction_cost, funding_source,
         warranty_expiry_date, last_renovation_date, book_value, details,
         created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
               NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '${daysAgo} days')
       ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category,
         type = EXCLUDED.type,
         name = EXCLUDED.name,
         district = EXCLUDED.district,
         address = EXCLUDED.address,
         division_id = EXCLUDED.division_id,
         condition = EXCLUDED.condition,
         status = EXCLUDED.status,
         construction_date = EXCLUDED.construction_date,
         commissioning_date = EXCLUDED.commissioning_date,
         construction_cost = EXCLUDED.construction_cost,
         funding_source = EXCLUDED.funding_source,
         warranty_expiry_date = EXCLUDED.warranty_expiry_date,
         last_renovation_date = EXCLUDED.last_renovation_date,
         book_value = EXCLUDED.book_value,
         details = EXCLUDED.details`,
      [
        a.id, a.category, a.type, a.name, a.district, a.address || null, a.divisionId, a.condition, a.status,
        a.constructionDate, a.commissioningDate, a.constructionCost, a.fundingSource,
        a.warrantyExpiryDate, a.lastRenovationDate, a.bookValue, JSON.stringify(a.details),
      ]
    );
  }
}

// ─── Seed Inspections ────────────────────────────────────────────────────────
async function seedInspections() {
  for (const insp of SEED_INSPECTIONS) {
    await query(
      `INSERT INTO inspections (
         id, asset_id, inspection_date, inspector_id, inspector_name,
         inspection_type, condition_assessment, observations, defects_identified,
         recommended_actions, next_due_date, checklist, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $3)
       ON CONFLICT (id) DO NOTHING`,
      [
        insp.id, insp.assetId, insp.inspectionDate, insp.inspectorId, insp.inspectorName,
        insp.inspectionType, insp.conditionAssessment, insp.observations,
        insp.defectsIdentified, insp.recommendedActions, insp.nextDueDate,
        JSON.stringify(insp.checklist),
      ]
    );
  }
}

// ─── Seed Issues ─────────────────────────────────────────────────────────────
async function seedIssues() {
  for (const issue of SEED_ISSUES) {
    await query(
      `INSERT INTO issues (
         id, asset_id, issue_category, description, priority, reported_by,
         assigned_to, assigned_officer_name, status, approval_status, approved_amount,
         current_estimate_id, actual_cost, cost_variance, variance_reason,
         originating_inspection_id, verification_status, verified_by, verified_at,
         verification_remarks, reported_date, resolution_notes, completed_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       ON CONFLICT (id) DO UPDATE SET
         assigned_to = EXCLUDED.assigned_to,
         assigned_officer_name = EXCLUDED.assigned_officer_name,
         status = EXCLUDED.status,
         approval_status = EXCLUDED.approval_status,
         approved_amount = EXCLUDED.approved_amount,
         current_estimate_id = EXCLUDED.current_estimate_id,
         actual_cost = EXCLUDED.actual_cost,
         cost_variance = EXCLUDED.cost_variance,
         variance_reason = EXCLUDED.variance_reason,
         originating_inspection_id = EXCLUDED.originating_inspection_id,
         verification_status = EXCLUDED.verification_status,
         verified_by = EXCLUDED.verified_by,
         verified_at = EXCLUDED.verified_at,
         verification_remarks = EXCLUDED.verification_remarks,
         resolution_notes = EXCLUDED.resolution_notes,
         completed_date = EXCLUDED.completed_date`,
      [
        issue.id, issue.assetId, issue.issueCategory, issue.description,
        issue.priority, issue.reportedBy, issue.assignedTo, issue.assignedOfficerName,
        issue.status, issue.approvalStatus, issue.approvedAmount, issue.currentEstimateId,
        issue.actualCost, issue.costVariance, issue.varianceReason,
        issue.originatingInspectionId, issue.verificationStatus, issue.verifiedBy || null,
        issue.verifiedAt || null, issue.verificationRemarks || null,
        issue.reportedDate, issue.resolutionNotes, issue.completedDate,
      ]
    );
  }
}

// ─── Seed Estimates & Line Items ─────────────────────────────────────────────
async function seedEstimates() {
  for (const est of SEED_ESTIMATES) {
    await query(
      `INSERT INTO estimates (
         id, issue_id, version, inspection_date, observed_problem, probable_cause,
         repair_method, estimated_duration_days, subtotal, contingency_percent,
         tax_percent, total_estimated_cost, status, submitted_by, submitted_by_name,
         submitted_at, reviewed_by, reviewed_by_name, reviewed_at, review_remarks,
         approved_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       ON CONFLICT (id) DO NOTHING`,
      [
        est.id, est.issueId, est.version, est.inspectionDate, est.observedProblem,
        est.probableCause, est.repairMethod, est.estimatedDurationDays, est.subtotal,
        est.contingencyPercent, est.taxPercent, est.totalEstimatedCost, est.status,
        est.submittedBy, est.submittedByName, est.submittedAt, est.reviewedBy,
        est.reviewedByName, est.reviewedAt, est.reviewRemarks, est.approvedAmount,
      ]
    );

    if (est.items && est.items.length > 0) {
      for (const item of est.items) {
        await query(
          `INSERT INTO estimate_items (
             estimate_id, item_name, description, quantity, unit, unit_cost, total_cost,
             proposed_vendor, vendor_contact, quotation_ref
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            est.id, item.itemName, item.description, item.quantity, item.unit,
            item.unitCost, item.quantity * item.unitCost, item.proposedVendor,
            item.vendorContact || null, item.quotationRef || null,
          ]
        );
      }
    }
  }
}

// ─── Seed Progress Updates ───────────────────────────────────────────────────
async function seedProgress() {
  for (const p of SEED_PROGRESS) {
    await query(
      `INSERT INTO issue_progress (
         issue_id, officer_id, officer_name, progress_percent,
         work_start_date, expected_completion_date, notes, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        p.issueId, p.officerId, p.officerName, p.progressPercent,
        p.workStartDate, p.expectedCompletionDate, p.notes, p.createdAt,
      ]
    );
  }
}

// ─── Seed Actual Items ───────────────────────────────────────────────────────
async function seedActualItems() {
  for (const it of SEED_ACTUAL_ITEMS) {
    await query(
      `INSERT INTO issue_actual_items (
         issue_id, item_name, actual_quantity, actual_unit_cost, actual_total, actual_vendor
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        it.issueId, it.itemName, it.actualQuantity, it.actualUnitCost, it.actualTotal, it.actualVendor,
      ]
    );
  }
}

// ─── Seed Activity Log ───────────────────────────────────────────────────────
async function seedActivityLog() {
  // Asset registration and commissioning events
  for (const asset of SEED_ASSETS) {
    await query(
      `INSERT INTO activity_log (asset_id, action, actor, timestamp, summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        asset.id,
        ACTIVITY_ACTIONS.ASSET_REGISTERED,
        'Vikram Trivedi (Administrator)',
        `${asset.commissioningDate}T09:00:00Z`,
        `${asset.category} "${asset.name}" commissioned into public service with original capital cost ₹${Number(asset.constructionCost).toLocaleString('en-IN')}.`,
      ]
    );
  }

  // Inspection events
  for (const insp of SEED_INSPECTIONS) {
    await query(
      `INSERT INTO activity_log (asset_id, action, actor, timestamp, summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        insp.assetId,
        ACTIVITY_ACTIONS.INSPECTION_RECORDED,
        insp.inspectorName,
        insp.inspectionDate,
        `${insp.inspectionType} inspection completed. Overall condition assessed as ${insp.conditionAssessment}. Next due: ${new Date(insp.nextDueDate).toLocaleDateString('en-IN')}.`,
      ]
    );
  }

  // Issue reported events
  for (const issue of SEED_ISSUES) {
    await query(
      `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        issue.assetId,
        issue.id,
        ACTIVITY_ACTIONS.ISSUE_REPORTED,
        issue.reportedBy,
        issue.reportedDate,
        `Issue ${issue.id} reported: ${issue.issueCategory} (${issue.priority} priority).`,
      ]
    );

    // Assignment
    if (issue.assignedTo && issue.assignedOfficerName) {
      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.ISSUE_ASSIGNED,
          'Vikram Trivedi (Administrator)',
          new Date(new Date(issue.reportedDate).getTime() + 1800000).toISOString(),
          `Issue ${issue.id} assigned to ${issue.assignedOfficerName}.`,
        ]
      );
    }

    // Estimate submission
    if (issue.approvalStatus && issue.approvalStatus !== 'None') {
      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.ESTIMATE_SUBMITTED,
          issue.assignedOfficerName || 'Maintenance Officer',
          new Date(new Date(issue.reportedDate).getTime() + 86400000).toISOString(),
          `Component-wise estimate submitted for ${issue.id}. Total estimate: ₹${Number(issue.approvedAmount || 347200).toLocaleString('en-IN')}.`,
        ]
      );
    }

    // Approval / Revision
    if (issue.approvalStatus === 'Approved') {
      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.ESTIMATE_APPROVED,
          'Vikram Trivedi (Administrator)',
          new Date(new Date(issue.reportedDate).getTime() + 172800000).toISOString(),
          `Estimate for ${issue.id} approved by Department Administrator for ₹${Number(issue.approvedAmount).toLocaleString('en-IN')}.`,
        ]
      );
    } else if (issue.approvalStatus === 'Revision Requested') {
      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.ESTIMATE_REVISION_REQUESTED,
          'Vikram Trivedi (Administrator)',
          new Date(new Date(issue.reportedDate).getTime() + 172800000).toISOString(),
          `Estimate revision requested for ${issue.id}: Alternative vendor quotes and warranty clarification required.`,
        ]
      );
    }

    // Completion & Verification
    if (issue.status === 'Completed') {
      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.COMPLETION_SUBMITTED,
          issue.assignedOfficerName || 'Officer',
          issue.completedDate,
          `Work completed on ${issue.id}. Actual expenditure: ₹${Number(issue.actualCost).toLocaleString('en-IN')}.`,
        ]
      );

      await query(
        `INSERT INTO activity_log (asset_id, issue_id, action, actor, timestamp, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          issue.assetId,
          issue.id,
          ACTIVITY_ACTIONS.COMPLETION_VERIFIED,
          issue.verifiedBy || 'Vikram Trivedi (Administrator)',
          issue.verifiedAt || issue.completedDate,
          `Maintenance work verified by Department Administrator. Issue ${issue.id} marked Completed.`,
        ]
      );
    }
  }
}

// ─── Set ID Counters to Safe Next Values ─────────────────────────────────────
async function updateCounters() {
  await query(`UPDATE id_counters SET next_val = 7 WHERE prefix = 'RD'`);
  await query(`UPDATE id_counters SET next_val = 6 WHERE prefix = 'BR'`);
  await query(`UPDATE id_counters SET next_val = 8 WHERE prefix = 'BLD'`);
  await query(`UPDATE id_counters SET next_val = 15 WHERE prefix = 'ISS'`);
  await query(`UPDATE id_counters SET next_val = 7 WHERE prefix = 'INSP'`);
  await query(`UPDATE id_counters SET next_val = 12 WHERE prefix = 'EST'`);
}

// ─── Main Seed Runner ────────────────────────────────────────────────────────
export async function runSeed(forceReset = false) {
  if (forceReset) {
    console.log('Resetting schema and re-seeding full database...');
    await resetSchema();
  } else {
    await ensureSchema();
    const alreadySeeded = await isSeedDataPresent();
    if (alreadySeeded) {
      console.log('Seed data already present. Skipping.');
      return { message: 'Database already initialized.', seeded: false };
    }
  }

  console.log('Seeding demo users...');
  await seedUsers();

  console.log('Seeding assets...');
  await seedAssets();

  console.log('Seeding inspections...');
  await seedInspections();

  console.log('Seeding issues...');
  await seedIssues();

  console.log('Seeding estimates & line items...');
  await seedEstimates();

  console.log('Seeding progress updates...');
  await seedProgress();

  console.log('Seeding actual expenditure items...');
  await seedActualItems();

  console.log('Seeding activity logs...');
  await seedActivityLog();

  console.log('Updating ID counters...');
  await updateCounters();

  console.log('Seeding completed successfully!');
  return {
    message: 'Database seeded successfully with advanced enterprise features.',
    users: SEEDED_USERS.length,
    assets: SEED_ASSETS.length,
    inspections: SEED_INSPECTIONS.length,
    issues: SEED_ISSUES.length,
    estimates: SEED_ESTIMATES.length,
    seeded: true,
  };
}
