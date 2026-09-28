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
  `INSERT INTO id_counters (prefix, next_val) VALUES ('INSP', 1) ON CONFLICT (prefix) DO NOTHING`,
  `INSERT INTO id_counters (prefix, next_val) VALUES ('EST', 1) ON CONFLICT (prefix) DO NOTHING`,

  // ─── Divisions ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS divisions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`,
  `INSERT INTO divisions (id, name) VALUES (1, 'Roads & Buildings Division, Ahmedabad') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (2, 'Roads & Buildings Division, Surat') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (3, 'Roads & Buildings Division, Rajkot') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (4, 'Roads & Buildings Division, Gandhinagar') ON CONFLICT (id) DO NOTHING`,
  `INSERT INTO divisions (id, name) VALUES (5, 'Roads & Buildings Division, Vadodara') ON CONFLICT (id) DO NOTHING`,

  // ─── Users & Roles (Seeded RBAC) ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL,
    designation   TEXT NOT NULL,
    category      TEXT NOT NULL,
    division_name TEXT NOT NULL,
    division_id   INTEGER,
    avatar        TEXT NOT NULL
  )`,

  // ─── Officers (Backwards Compatibility) ────────────────────────────────
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

  // ─── Assets (with Financial & Lifecycle Data) ──────────────────────────
  `CREATE TABLE IF NOT EXISTS assets (
    id                    TEXT PRIMARY KEY,
    category              TEXT NOT NULL,
    type                  TEXT NOT NULL,
    name                  TEXT NOT NULL,
    district              TEXT NOT NULL,
    address               TEXT,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    division_id           INTEGER NOT NULL REFERENCES divisions(id),
    condition             TEXT NOT NULL DEFAULT 'Good',
    status                TEXT NOT NULL DEFAULT 'Active',
    construction_date     TEXT,
    commissioning_date    TEXT,
    construction_cost     NUMERIC NOT NULL DEFAULT 0,
    funding_source        TEXT,
    warranty_expiry_date  TEXT,
    last_renovation_date  TEXT,
    book_value            NUMERIC,
    details               JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Migrations for existing assets table:
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS construction_date TEXT`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS commissioning_date TEXT`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS construction_cost NUMERIC NOT NULL DEFAULT 0`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS funding_source TEXT`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_expiry_date TEXT`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_renovation_date TEXT`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS book_value NUMERIC`,

  // ─── Periodic Inspections ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS inspections (
    id                    TEXT PRIMARY KEY,
    asset_id              TEXT NOT NULL REFERENCES assets(id),
    inspection_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inspector_id          TEXT NOT NULL,
    inspector_name        TEXT NOT NULL,
    inspection_type       TEXT NOT NULL DEFAULT 'Routine',
    condition_assessment  TEXT NOT NULL DEFAULT 'Good',
    observations          TEXT NOT NULL,
    defects_identified    TEXT,
    recommended_actions   TEXT,
    next_due_date         TIMESTAMPTZ,
    checklist             JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ─── Issues (Enhanced Maintenance Workflow) ───────────────────────────
  `CREATE TABLE IF NOT EXISTS issues (
    id                        TEXT PRIMARY KEY,
    asset_id                  TEXT NOT NULL REFERENCES assets(id),
    issue_category            TEXT NOT NULL,
    description               TEXT NOT NULL,
    priority                  TEXT NOT NULL DEFAULT 'Medium',
    reported_by               TEXT NOT NULL,
    assigned_to               TEXT,
    assigned_officer_name     TEXT,
    status                    TEXT NOT NULL DEFAULT 'Open',
    approval_status           TEXT NOT NULL DEFAULT 'None',
    approved_amount           NUMERIC,
    current_estimate_id       TEXT,
    actual_cost               NUMERIC,
    cost_variance             NUMERIC,
    variance_reason           TEXT,
    originating_inspection_id TEXT REFERENCES inspections(id),
    verification_status       TEXT,
    verified_by               TEXT,
    verified_at               TIMESTAMPTZ,
    verification_remarks      TEXT,
    reported_date             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolution_notes          TEXT,
    completed_date            TIMESTAMPTZ
  )`,

  // Migrations for existing issues table:
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_officer_name TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'None'`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS approved_amount NUMERIC`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS current_estimate_id TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS actual_cost NUMERIC`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS cost_variance NUMERIC`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS variance_reason TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS originating_inspection_id TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS verification_status TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS verified_by TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS verification_remarks TEXT`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  // ─── Maintenance Estimates (Multi-Version) ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS estimates (
    id                      TEXT PRIMARY KEY,
    issue_id                TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    version                 INTEGER NOT NULL DEFAULT 1,
    inspection_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observed_problem        TEXT NOT NULL,
    probable_cause          TEXT,
    repair_method           TEXT NOT NULL,
    estimated_duration_days INTEGER NOT NULL DEFAULT 7,
    subtotal                NUMERIC NOT NULL DEFAULT 0,
    contingency_percent     NUMERIC NOT NULL DEFAULT 5,
    tax_percent             NUMERIC NOT NULL DEFAULT 18,
    total_estimated_cost    NUMERIC NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'Pending Review',
    submitted_by            TEXT NOT NULL,
    submitted_by_name       TEXT NOT NULL,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by             TEXT,
    reviewed_by_name        TEXT,
    reviewed_at             TIMESTAMPTZ,
    review_remarks          TEXT,
    approved_amount         NUMERIC
  )`,

  // ─── Estimate Line Items (Component-Wise) ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS estimate_items (
    id              SERIAL PRIMARY KEY,
    estimate_id     TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_name       TEXT NOT NULL,
    description     TEXT,
    quantity        NUMERIC NOT NULL DEFAULT 1,
    unit            TEXT NOT NULL,
    unit_cost       NUMERIC NOT NULL DEFAULT 0,
    total_cost      NUMERIC NOT NULL DEFAULT 0,
    proposed_vendor TEXT,
    vendor_contact  TEXT,
    quotation_ref   TEXT
  )`,

  // ─── Issue Work Progress Updates ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS issue_progress (
    id                       SERIAL PRIMARY KEY,
    issue_id                 TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    officer_id               TEXT NOT NULL,
    officer_name             TEXT NOT NULL,
    progress_percent         INTEGER NOT NULL DEFAULT 0,
    work_start_date          TIMESTAMPTZ,
    expected_completion_date TIMESTAMPTZ,
    notes                    TEXT NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ─── Issue Actual Expenditure Items ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS issue_actual_items (
    id               SERIAL PRIMARY KEY,
    issue_id         TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    item_name        TEXT NOT NULL,
    actual_quantity  NUMERIC NOT NULL DEFAULT 1,
    actual_unit_cost NUMERIC NOT NULL DEFAULT 0,
    actual_total     NUMERIC NOT NULL DEFAULT 0,
    actual_vendor    TEXT
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
  `CREATE INDEX IF NOT EXISTS idx_issues_assigned    ON issues(assigned_to)`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_asset  ON inspections(asset_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_date   ON inspections(inspection_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_issue    ON estimates(issue_id)`,
  `CREATE INDEX IF NOT EXISTS idx_estimates_status   ON estimates(status)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_asset_id  ON activity_log(asset_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC)`,
];

/**
 * Ensure schema is initialized (idempotent, runs once per cold start).
 */
export async function ensureSchema() {
  if (schemaInitialized) return;

  for (const statement of SCHEMA_STATEMENTS) {
    try {
      await execRaw(statement);
    } catch (e) {
      console.warn('Schema statement warning:', e.message);
    }
  }
  schemaInitialized = true;
}

/**
 * Drop all tables and reinitialize schema (for seed reset).
 */
export async function resetSchema() {
  await execRaw('DROP TABLE IF EXISTS issue_actual_items CASCADE');
  await execRaw('DROP TABLE IF EXISTS issue_progress CASCADE');
  await execRaw('DROP TABLE IF EXISTS estimate_items CASCADE');
  await execRaw('DROP TABLE IF EXISTS estimates CASCADE');
  await execRaw('DROP TABLE IF EXISTS activity_log CASCADE');
  await execRaw('DROP TABLE IF EXISTS issues CASCADE');
  await execRaw('DROP TABLE IF EXISTS inspections CASCADE');
  await execRaw('DROP TABLE IF EXISTS assets CASCADE');
  await execRaw('DROP TABLE IF EXISTS users CASCADE');
  await execRaw('DROP TABLE IF EXISTS officers CASCADE');
  await execRaw('DROP TABLE IF EXISTS divisions CASCADE');
  await execRaw('DROP TABLE IF EXISTS id_counters CASCADE');

  // Reinitialize
  for (const statement of SCHEMA_STATEMENTS) {
    await execRaw(statement);
  }

  schemaInitialized = true;
}
