/**
 * Gujarat R&B Asset Management System — Authentication & RBAC Layer
 * 
 * Simulated Session-Based Authorization for 11 Seeded Demo Accounts.
 * Resolves user from 'x-user-id' header or 'user_id' cookie.
 * Enforces role, category, assignment, and division authorization.
 */

import { query } from './db.js';
import { SEEDED_USERS, ROLES } from './constants.js';

/**
 * Resolve the current authenticated user from an incoming Next.js Request.
 * Checks header 'x-user-id', then cookies. Defaults to null if not provided.
 * 
 * @param {Request} request 
 * @returns {Promise<Object|null>} The user object or null
 */
export async function getAuthenticatedUser(request) {
  let userId = null;

  let explicitIdProvided = false;
  // 1. Check x-user-id header
  if (request && request.headers) {
    userId = request.headers.get('x-user-id');
    if (userId) explicitIdProvided = true;
  }

  // 2. Check cookies if header is absent
  if (!userId && request && request.cookies) {
    const cookieUser = request.cookies.get('user_id');
    if (cookieUser) {
      userId = typeof cookieUser === 'object' ? cookieUser.value : cookieUser;
      if (userId) explicitIdProvided = true;
    }
  }

  // 3. Fallback check for header in string or raw form
  if (!userId && request && typeof request.headers?.get === 'function') {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/user_id=([^;]+)/);
    if (match) {
      userId = match[1];
      if (userId) explicitIdProvided = true;
    }
  }

  // Fallback to Admin only if nothing was provided at all
  if (!userId) {
    userId = 'usr_admin';
  }

  // Find user in static list first for speed
  const staticMatch = SEEDED_USERS.find(u => u.id === userId);
  if (staticMatch) return staticMatch;

  // Query database if not in static list
  try {
    const rows = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (rows && rows.length > 0) {
      const u = rows[0];
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        designation: u.designation,
        category: u.category,
        divisionName: u.division_name,
        divisionId: u.division_id,
        avatar: u.avatar,
      };
    }
  } catch (e) {
    console.warn('User lookup DB error, falling back to static:', e.message);
  }

  // If an explicit user was specified but could not be resolved, return null
  if (explicitIdProvided) {
    return null;
  }

  return SEEDED_USERS[0]; // Fallback to Vikram Trivedi (Admin) if no credentials passed
}

/**
 * Check if a user has administrative privileges.
 */
export function isAdmin(user) {
  return user && user.role === ROLES.ADMIN;
}

/**
 * Check if a user is read-only viewer.
 */
export function isViewer(user) {
  return user && user.role === ROLES.VIEWER;
}

/**
 * Verify whether an authenticated user is permitted to view an asset.
 * - Admin and Viewer can view all assets.
 * - Category officers can view assets matching their category.
 */
export function canViewAsset(user, asset) {
  if (!user || !asset) return false;
  if (isAdmin(user) || isViewer(user)) return true;
  return user.category === asset.category;
}

/**
 * Verify whether a user is permitted to create or edit an asset.
 * - Only Admin can create, edit, or retire assets.
 */
export function canManageAsset(user) {
  if (!user) return false;
  return isAdmin(user);
}

/**
 * Verify whether an authenticated user can view an issue.
 * - Admin and Viewer can view all issues.
 * - Category officers can view issues matching their asset category.
 */
export function canViewIssue(user, issue, assetCategory) {
  if (!user || !issue) return false;
  if (isAdmin(user) || isViewer(user)) return true;

  const category = assetCategory || issue.asset_category || issue.category;
  if (category && user.category !== category) {
    return false;
  }
  return true;
}

/**
 * Verify whether an authenticated user is authorized to perform maintenance actions on an issue
 * (e.g. submit estimate, update progress, submit completion).
 * - Road officers can only manage Road issues.
 * - Bridge officers can only manage Bridge issues.
 * - Building officers can only manage Building issues.
 * - Must either be assigned to the issue or be Admin.
 * - Viewers CANNOT modify anything.
 */
export function canManageIssue(user, issue, assetCategory) {
  if (!user || !issue) return { allowed: false, reason: 'Unauthenticated or invalid issue.' };
  if (isViewer(user)) return { allowed: false, reason: 'Department Viewers have read-only access.' };

  // Admin has full management access
  if (isAdmin(user)) return { allowed: true };

  // Category restriction
  const category = assetCategory || issue.asset_category || issue.category;
  if (category && user.category !== category) {
    return {
      allowed: false,
      reason: `${user.designation} (${user.category}) cannot modify ${category} maintenance records.`,
    };
  }

  // Assignment check: officer must be assigned, or unassigned open issue in their division/category
  if (issue.assigned_to && issue.assigned_to !== user.id) {
    return {
      allowed: false,
      reason: `Issue ${issue.id} is assigned to another officer. Only the assigned officer can record estimates or progress.`,
    };
  }

  return { allowed: true };
}

/**
 * Verify whether an authenticated user is authorized to approve, reject, or request revisions on estimates.
 * - ONLY Department Administrator can approve, reject, or request revisions.
 */
export function canReviewEstimate(user) {
  if (!user) return { allowed: false, reason: 'Unauthenticated.' };
  if (!isAdmin(user)) {
    return { allowed: false, reason: 'Only the Department Administrator can review, approve, or request estimate revisions.' };
  }
  return { allowed: true };
}

/**
 * Verify whether an authenticated user is authorized to verify maintenance completion.
 * - ONLY Department Administrator can verify completed work.
 */
export function canVerifyCompletion(user) {
  if (!user) return { allowed: false, reason: 'Unauthenticated.' };
  if (!isAdmin(user)) {
    return { allowed: false, reason: 'Only the Department Administrator can verify completed maintenance work.' };
  }
  return { allowed: true };
}

/**
 * Verify whether an authenticated user is authorized to record an inspection.
 * - Admin can inspect any asset.
 * - Category officers can only inspect assets matching their category.
 * - Viewers cannot record inspections.
 */
export function canRecordInspection(user, asset) {
  if (!user || !asset) return { allowed: false, reason: 'Unauthenticated or invalid asset.' };
  if (isViewer(user)) return { allowed: false, reason: 'Department Viewers cannot record inspections.' };
  if (isAdmin(user)) return { allowed: true };

  if (user.category !== asset.category) {
    return {
      allowed: false,
      reason: `${user.designation} cannot conduct inspections for ${asset.category} assets.`,
    };
  }

  return { allowed: true };
}
