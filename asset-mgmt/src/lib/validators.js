/**
 * Server-side Validators
 * 
 * Validates asset details (per category), issue creation, and issue transitions.
 * All validation functions return { valid: boolean, errors: string[] }.
 */

import {
  ASSET_CATEGORIES,
  ASSET_TYPES,
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  ASSET_DETAIL_FIELDS,
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TRANSITIONS,
  DISTRICTS,
} from './constants.js';

/**
 * Validate core asset fields (common to all categories).
 */
export function validateAssetCore(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Asset name is required.');
  }
  if (!ASSET_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category: ${data.category}. Must be one of: ${ASSET_CATEGORIES.join(', ')}.`);
  }
  if (data.category && !ASSET_TYPES[data.category]?.includes(data.type)) {
    errors.push(`Invalid type "${data.type}" for category "${data.category}". Must be one of: ${(ASSET_TYPES[data.category] || []).join(', ')}.`);
  }
  if (!DISTRICTS.includes(data.district)) {
    errors.push(`Invalid district: ${data.district}.`);
  }
  if (!data.divisionId && data.divisionId !== 0) {
    errors.push('Responsible Division is required.');
  }
  if (data.condition && !ASSET_CONDITIONS.includes(data.condition)) {
    errors.push(`Invalid condition: ${data.condition}. Must be one of: ${ASSET_CONDITIONS.join(', ')}.`);
  }
  if (data.status && !ASSET_STATUSES.includes(data.status)) {
    errors.push(`Invalid status: ${data.status}. Must be one of: ${ASSET_STATUSES.join(', ')}.`);
  }
  if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90.');
    }
  }
  if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
    const lng = Number(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate category-specific detail fields.
 */
export function validateAssetDetails(category, details) {
  const errors = [];
  const fields = ASSET_DETAIL_FIELDS[category];

  if (!fields) {
    errors.push(`No detail fields defined for category: ${category}.`);
    return { valid: false, errors };
  }

  if (!details || typeof details !== 'object') {
    errors.push('Category-specific details are required.');
    return { valid: false, errors };
  }

  for (const field of fields) {
    const value = details[field.key];

    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`${field.label} is required.`);
        continue;
      }
    } else {
      // Optional field — skip validation if not provided
      if (value === undefined || value === null || value === '') continue;
    }

    if (field.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field.label} must be a number.`);
      } else if (field.min !== undefined && num < field.min) {
        errors.push(`${field.label} must be at least ${field.min}.`);
      }
    }

    if (field.type === 'select' && field.options) {
      if (!field.options.includes(value)) {
        errors.push(`${field.label} must be one of: ${field.options.join(', ')}.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate full asset data (core + details).
 */
export function validateAsset(data) {
  const coreResult = validateAssetCore(data);
  const detailsResult = validateAssetDetails(data.category, data.details);

  const errors = [...coreResult.errors, ...detailsResult.errors];
  return { valid: errors.length === 0, errors };
}

/**
 * Validate issue creation data.
 */
export function validateIssueCreation(data, assetCategory) {
  const errors = [];

  // Check issue category belongs to the asset's category
  const validCategories = ISSUE_CATEGORIES[assetCategory];
  if (!validCategories) {
    errors.push(`Unknown asset category: ${assetCategory}.`);
  } else if (!validCategories.includes(data.issueCategory)) {
    errors.push(`Invalid issue category "${data.issueCategory}" for ${assetCategory} assets.`);
  }

  // Description always required
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required.');
  }

  // "Other" categories require ≥ 20 character description
  if (data.issueCategory && data.issueCategory.startsWith('Other')) {
    if (!data.description || data.description.trim().length < 20) {
      errors.push('When selecting an "Other" category, description must be at least 20 characters.');
    }
  }

  // Priority validation
  if (data.priority && !ISSUE_PRIORITIES.includes(data.priority)) {
    errors.push(`Invalid priority: ${data.priority}. Must be one of: ${ISSUE_PRIORITIES.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an issue status transition.
 */
export function validateIssueTransition(currentStatus, newStatus, data = {}) {
  const errors = [];

  const validTransitions = ISSUE_TRANSITIONS[currentStatus];
  if (!validTransitions || !validTransitions.includes(newStatus)) {
    errors.push(`Cannot transition from "${currentStatus}" to "${newStatus}".`);
    return { valid: false, errors };
  }

  // In Progress requires assignment
  if (newStatus === 'In Progress' && !data.assignedTo) {
    errors.push('An officer must be assigned before moving to In Progress.');
  }

  // Completed requires resolution notes
  if (newStatus === 'Completed') {
    if (!data.resolutionNotes || data.resolutionNotes.trim().length === 0) {
      errors.push('Resolution notes are required to complete an issue.');
    }
  }

  return { valid: errors.length === 0, errors };
}
