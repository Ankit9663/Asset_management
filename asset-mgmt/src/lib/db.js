/**
 * Database Connection & Schema Initialization for Neon Serverless Postgres
 * 
 * Uses @neondatabase/serverless which connects via HTTP.
 * Reads DATABASE_URL from environment.
 * Schema initialization is idempotent — safe to call on every cold start.
 * 
 * IMPORTANT: Neon's `neon()` returns a tagged-template function for parameterized queries:
 *   sql`SELECT * FROM t WHERE id = ${val}`
 * For raw SQL strings without parameters, use:
 *   sql`...raw SQL...`    (template literal, no interpolation)
 * For conventional parameterized calls, use:
 *   sql.query('SELECT * FROM t WHERE id = $1', [val])
 */

import { neon } from '@neondatabase/serverless';

let schemaInitialized = false;
let _sql = null;

/**
 * Get the sql tagged-template query function (Neon HTTP driver).
 */
export function getSQL() {
  if (_sql) return _sql;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Create a Neon project at https://neon.tech and add the connection string to .env.local'
    );
  }
  _sql = neon(databaseUrl);
  return _sql;
}

/**
 * Execute a raw SQL string (no parameters).
 * Uses the .query() method which accepts conventional function-call syntax.
 */
async function execRaw(sqlStr) {
  const sql = getSQL();
  return sql.query(sqlStr);
}

/**
 * Execute a parameterized query with $1, $2 placeholders.
 * Uses the .query() method for conventional function-call syntax.
 */
export async function query(text, params = []) {
  const sql = getSQL();
  return sql.query(text, params);
}

/**
 * SQL statements to create all tables and seed reference data.
 */
const SCHEMA_STATEMENTS = [
  // ─── ID Counters ──────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS id_counters (
    prefix   TEXT PRIMARY KEY,
    next_val INTEGER NOT NULL DEFAULT 1
  )`,
  `INSERT INTO id_counters (prefix, next_val) VALUES ('RD', 1) ON CONFLICT (prefix) DO NOTHING`,
  `INSERT INTO id_counters (prefix, next_val) VALUES ('BR', 1) ON CONFLICT (prefix) DO NOTHING`,
  `INSERT INTO id_counters (prefix, next_val) VALUES ('BLD', 1) ON CONFLICT (prefix) DO NOTHING`,
  `INSERT INTO id_counters (prefix, next_val) VALUES ('ISS', 1) ON CONFLICT (prefix) DO NOTHING`,

  // ─── Divisions ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS divisions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`,
  `INSERT INTO divisions (id, name) VALUES (1, 'Roads Division, Ahmedabad') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (2, 'Roads Division, Surat') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (3, 'Roads Division, Rajkot') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (4, 'Buildings Division, Gandhinagar') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (5, 'Buildings Division, Vadodara') ON CONFLICT (id) DO NOTHING`,

  // ─── Officers ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS officers (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    division_id INTEGER NOT NULL REFERENCES divisions(id)
  )`,
  `INSERT INTO officers (id, name, division_id) VALUES (1, 'Shri A.K. Patel', 1) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (2, 'Shri R.M. Shah', 1) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (3, 'Smt. P.D. Mehta', 2) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (4, 'Shri V.J. Desai', 2) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (5, 'Shri K.N. Trivedi', 3) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (6, 'Smt. S.R. Joshi', 4) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (7, 'Shri H.B. Raval', 4) ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO officers (id, name, division_id) VALUES (8, 'Shri M.T. Bhatt', 5) ON CONFLICT (id) DO NOTHING`,

  // ─── Assets ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS assets (
    id          TEXT PRIMARY KEY,
    category    TEXT NOT NULL,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    district    TEXT NOT NULL,
    address     TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    division_id INTEGER NOT NULL REFERENCES divisions(id),
    condition   TEXT NOT NULL DEFAULT 'Good',
    status      TEXT NOT NULL DEFAULT 'Active',
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ─── Issues ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS issues (
    id               TEXT PRIMARY KEY,
    asset_id         TEXT NOT NULL REFERENCES assets(id),
    issue_category   TEXT NOT NULL,
    description      TEXT NOT NULL,
    priority         TEXT NOT NULL DEFAULT 'Medium',
    reported_by      TEXT NOT NULL,
    assigned_to      INTEGER REFERENCES officers(id),
    status           TEXT NOT NULL DEFAULT 'Open',
    reported_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolution_notes TEXT,
    completed_date   TIMESTAMPTZ
  )`,

  // ─── Activity Log ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS activity_log (
    id        SERIAL PRIMARY KEY,
    asset_id  TEXT NOT NULL REFERENCES assets(id),
    issue_id  TEXT REFERENCES issues(id),
    action    TEXT NOT NULL,
    actor     TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary   TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT
  )`,

  // ─── Indexes ──────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_assets_category   ON assets(category)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_district    ON assets(district)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_status      ON assets(status)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_condition   ON assets(condition)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_division    ON assets(division_id)`,
  `CREATE INDEX IF NOT EXISTS idx_issues_asset_id    ON issues(asset_id)`,
  `CREATE INDEX IF NOT EXISTS idx_issues_status      ON issues(status)`,
  `CREATE INDEX IF NOT EXISTS idx_issues_priority    ON issues(priority)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_asset_id  ON activity_log(asset_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC)`,
];

/**
 * Ensure schema is initialized (idempotent, runs once per cold start).
 */
export async function ensureSchema() {
  if (schemaInitialized) return;

  for (const statement of SCHEMA_STATEMENTS) {
    await execRaw(statement);
  }
  schemaInitialized = true;
}

/**
 * Drop all tables and reinitialize schema (for seed reset).
 */
export async function resetSchema() {
  await execRaw('DROP TABLE IF EXISTS activity_log CASCADE');
  await execRaw('DROP TABLE IF EXISTS issues CASCADE');
  await execRaw('DROP TABLE IF EXISTS assets CASCADE');
  await execRaw('DROP TABLE IF EXISTS officers CASCADE');
  await execRaw('DROP TABLE IF EXISTS divisions CASCADE');
  await execRaw('DROP TABLE IF EXISTS id_counters CASCADE');

  // Reinitialize
  for (const statement of SCHEMA_STATEMENTS) {
    await execRaw(statement);
  }

  schemaInitialized = true;
}
