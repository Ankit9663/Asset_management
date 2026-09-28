/**
 * Atomic Readable ID Generator (Neon Postgres)
 * 
 * Uses UPDATE ... RETURNING for single-statement atomic increment.
 * No transaction needed — one atomic SQL statement.
 */

import { query } from './db.js';
import { ID_PREFIXES } from './constants.js';

/**
 * Generate the next ID for a given category or entity type.
 * 
 * @param {string} categoryOrType - 'Road', 'Bridge', 'Building', or 'Issue'
 * @returns {Promise<string>} The generated ID (e.g., 'RD-0001', 'ISS-0012')
 */
export async function generateId(categoryOrType) {
  const prefix = ID_PREFIXES[categoryOrType];
  if (!prefix) {
    throw new Error(`Unknown category/type for ID generation: ${categoryOrType}`);
  }

  // Atomic increment + return in a single statement
  const rows = await query(
    `UPDATE id_counters 
     SET next_val = next_val + 1 
     WHERE prefix = $1
     RETURNING next_val - 1 AS current_val`,
    [prefix]
  );

  if (!rows || rows.length === 0) {
    throw new Error(`No counter row found for prefix: ${prefix}`);
  }

  const padded = String(rows[0].current_val).padStart(4, '0');
  return `${prefix}-${padded}`;
}
