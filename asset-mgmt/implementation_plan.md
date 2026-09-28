# Gujarat R&B Asset Management System — Implementation Plan

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router)** | Full-stack React — API routes + SSR + file-based routing |
| Database | **SQLite via `better-sqlite3`** | Zero-config, single-file DB, atomic counters for IDs |
| Styling | **Vanilla CSS** with CSS custom properties | Design-system tokens, no external dependency |
| State | **React Context + `fetch`** | Lightweight, no Redux overhead needed |
| Deployment | **Local dev server** (primary) | SQLite is file-based — avoids serverless persistence pitfalls |
| Deployment (alt) | **VPS / VM** or **hosted DB swap** | If remote demo needed, deploy to a VM or swap SQLite for Turso/PlanetScale |

> [!NOTE]
> **Deployment reality**: SQLite works perfectly for local development and demos. Serverless platforms (Vercel, Netlify) don't support durable file writes across invocations. If a remote deploy is needed, either: (a) deploy to a VPS/VM where the SQLite file persists, or (b) swap `better-sqlite3` for a hosted DB (Turso, PlanetScale). Don't burn time debugging persistence — run locally for the demo if deployment becomes a blocker.

---

## Project Structure

```
asset-mgmt/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Root layout — header, nav, static user
│   │   ├── page.js                   # Dashboard
│   │   ├── globals.css               # Global design-system styles
│   │   ├── assets/
│   │   │   ├── page.js               # Asset Inventory (list + search + filters)
│   │   │   ├── new/page.js           # Add Asset form
│   │   │   └── [id]/
│   │   │       ├── page.js           # Asset Detail view
│   │   │       └── edit/page.js      # Edit Asset form
│   │   ├── issues/
│   │   │   └── page.js               # All Issues list + filters
│   │   └── api/                      # API route handlers (App Router convention)
│   │       ├── assets/
│   │       │   ├── route.js           # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.js       # GET (single) + PUT (edit)
│   │       │       ├── condition/route.js  # PATCH condition
│   │       │       ├── retire/route.js     # PATCH retire
│   │       │       ├── issues/route.js     # GET issues for asset
│   │       │       └── activity/route.js   # GET activity for asset
│   │       ├── issues/
│   │       │   ├── route.js           # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.js       # PUT (update)
│   │       │       └── complete/route.js   # PATCH complete
│   │       ├── dashboard/route.js     # GET aggregated counts
│   │       ├── activity/route.js      # GET recent activity (global)
│   │       ├── reference/route.js     # GET divisions, officers, districts
│   │       └── seed/route.js          # POST seed / reset
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── Header.js                 # App header with static user
│   │   ├── Sidebar.js                # Navigation sidebar
│   │   ├── StatCard.js               # Dashboard summary card
│   │   ├── AssetTable.js             # Asset inventory table
│   │   ├── IssueTable.js             # Issues listing table
│   │   ├── AssetForm.js              # Create/Edit asset form
│   │   ├── IssueForm.js              # Report issue form
│   │   ├── ConditionBadge.js         # Colored condition indicator
│   │   ├── StatusBadge.js            # Colored status indicator
│   │   ├── PriorityBadge.js          # Priority indicator
│   │   ├── ActivityTimeline.js       # Activity log timeline
│   │   ├── Modal.js                  # Reusable modal (condition update, etc.)
│   │   ├── FilterBar.js              # Reusable filter/search bar
│   │   ├── EmptyState.js             # Friendly empty state
│   │   └── Toast.js                  # Success/error notifications
│   │
│   ├── lib/                          # Core logic
│   │   ├── db.js                     # SQLite connection singleton
│   │   ├── schema.sql                # Full DDL — tables, indexes, triggers
│   │   ├── constants.js              # Categories, types, conditions, statuses, issue categories
│   │   ├── seed.js                   # Idempotent seed script + reset
│   │   ├── validators.js             # Server-side validation per category
│   │   ├── id-generator.js           # Atomic readable-ID generator (RD-0001, etc.)
│   │   └── activity-logger.js        # Centralized activity log writer
│   │
│   └── hooks/                        # Client-side React hooks
│       ├── useAssets.js              # Fetch/mutate assets
│       ├── useIssues.js              # Fetch/mutate issues
│       └── useActivity.js            # Fetch activity log
│
├── public/                           # Static assets (favicon, logo)
├── package.json
└── next.config.mjs
```

---

## Database Schema

### Tables

```
┌─────────────────────────────────────────────────────────────┐
│ id_counters                                                 │
│   prefix TEXT PK  |  next_val INTEGER NOT NULL DEFAULT 1    │
│   Rows: RD, BR, BLD, ISS                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ divisions (seeded reference)                                │
│   id INTEGER PK  |  name TEXT UNIQUE                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ officers (seeded reference, 5-8 rows)                       │
│   id INTEGER PK  |  name TEXT  |  division_id FK            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ assets                                                      │
│   id TEXT PK (RD-0001)                                      │
│   category TEXT NOT NULL (Road / Bridge / Building)          │
│   type TEXT NOT NULL                                         │
│   name TEXT NOT NULL                                         │
│   district TEXT NOT NULL                                     │
│   address TEXT                                               │
│   latitude REAL                                              │
│   longitude REAL                                             │
│   division_id INTEGER FK → divisions                        │
│   condition TEXT NOT NULL DEFAULT 'Good'                     │
│   status TEXT NOT NULL DEFAULT 'Active'                      │
│   details TEXT (JSON)                                        │
│   created_at TEXT DEFAULT CURRENT_TIMESTAMP                  │
│   updated_at TEXT DEFAULT CURRENT_TIMESTAMP                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ issues                                                      │
│   id TEXT PK (ISS-0001)                                     │
│   asset_id TEXT FK → assets                                 │
│   issue_category TEXT NOT NULL                               │
│   description TEXT NOT NULL                                  │
│   priority TEXT NOT NULL DEFAULT 'Medium'                    │
│   reported_by TEXT NOT NULL                                  │
│   assigned_to INTEGER FK → officers (nullable)              │
│   status TEXT NOT NULL DEFAULT 'Open'                        │
│   reported_date TEXT DEFAULT CURRENT_TIMESTAMP               │
│   resolution_notes TEXT                                      │
│   completed_date TEXT                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ activity_log                                                │
│   id INTEGER PK AUTOINCREMENT                               │
│   asset_id TEXT FK → assets                                 │
│   issue_id TEXT FK → issues (nullable)                      │
│   action TEXT NOT NULL                                       │
│   actor TEXT NOT NULL                                        │
│   timestamp TEXT DEFAULT CURRENT_TIMESTAMP                   │
│   summary TEXT NOT NULL                                      │
│   old_value TEXT                                             │
│   new_value TEXT                                             │
└─────────────────────────────────────────────────────────────┘
```

### Indexes
- `idx_assets_category` on `assets(category)`
- `idx_assets_district` on `assets(district)`
- `idx_assets_status` on `assets(status)`
- `idx_assets_condition` on `assets(condition)`
- `idx_issues_asset_id` on `issues(asset_id)`
- `idx_issues_status` on `issues(status)`
- `idx_issues_priority` on `issues(priority)`
- `idx_activity_asset_id` on `activity_log(asset_id)`
- `idx_activity_timestamp` on `activity_log(timestamp DESC)`

---

## Issue Categories (per Asset Category)

When reporting an issue, the form identifies the asset's category and populates the issue category dropdown with **only** the matching list below. A free-text **Description** field is always shown and always required. When the selected issue category starts with "Other", the description must be ≥ 20 characters.

| Asset Category | Issue Categories |
|----------------|------------------|
| **Road** | Potholes, Surface Cracks, Road Surface Damage, Waterlogging / Drainage, Shoulder / Edge Damage, Road Signage Damage, Road Marking Damage, Road Obstruction, Other Road Issue |
| **Bridge** | Structural Cracks, Concrete Damage, Bearing Damage, Expansion Joint Damage, Railing / Parapet Damage, Deck / Surface Damage, Foundation / Scour Concern, Drainage Problem, Corrosion, Other Bridge Issue |
| **Building** | Roof Leakage, Wall / Ceiling Damage, Structural Damage, Electrical Problem, Plumbing / Water Supply, Drainage / Sanitation, Doors / Windows, Flooring Damage, HVAC / Ventilation, Other Building Issue |

**Dropdown behavior**: `POST /api/issues` receives `assetId` → server looks up the asset's category → validates that the submitted `issueCategory` belongs to that category's list. Client-side, the `IssueForm` component fetches the asset, reads `category`, and filters `ISSUE_CATEGORIES[category]` from `constants.js` to render the dropdown.

---

## Category-Specific Asset Fields

Stored in the `details` JSON column. Validated server-side per category on create and edit.

### Road
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Classification | Dropdown | ✅ | State Highway, Major District Road, City Road |
| Start Point | Text | ✅ | Location name |
| End Point | Text | ✅ | Location name |
| Length (km) | Number | ✅ | > 0 |
| Surface Type | Dropdown | ❌ | Asphalt, Concrete, Gravel, Earthen |

### Bridge
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Structure Type | Dropdown | ✅ | RCC, Steel, Composite, Stone Masonry |
| Crossing Type | Dropdown | ✅ | River, Railway, Road, Canal |
| Length (m) | Number | ✅ | > 0 |

### Building
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Building Use | Dropdown | ✅ | Government Office, Residential, School, Healthcare Facility, Other |
| Number of Floors | Number | ✅ | ≥ 1 |
| Built-up Area (sq m) | Number | ❌ | > 0 if provided |

---

## API Routes

All under `src/app/api/`:

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/assets` | List assets (query: search, category, district, division, condition, status) |
| `POST` | `/api/assets` | Create asset → generate ID, validate details JSON per category, log activity |
| `GET` | `/api/assets/[id]` | Get single asset with related counts |
| `PUT` | `/api/assets/[id]` | Edit asset (category locked) → validate details, log changes |
| `PATCH` | `/api/assets/[id]/condition` | Update condition only → log old→new |
| `PATCH` | `/api/assets/[id]/retire` | Retire asset (warn if open issues, proceed) → log |
| `GET` | `/api/assets/[id]/issues` | Issues for a specific asset |
| `GET` | `/api/assets/[id]/activity` | Activity log for a specific asset |
| `GET` | `/api/issues` | List all issues (query: status, priority, assetId) |
| `POST` | `/api/issues` | Create issue (blocked on Retired asset, validate issue category against asset category) → log |
| `PUT` | `/api/issues/[id]` | Update issue (assign, status transitions, notes) → log |
| `PATCH` | `/api/issues/[id]/complete` | Complete issue (resolution notes required, sets completed_date) → log |
| `GET` | `/api/dashboard` | Aggregated counts for dashboard |
| `GET` | `/api/activity` | Recent activity (global, limit 20) |
| `GET` | `/api/reference` | Divisions, officers, districts (for dropdowns) |
| `POST` | `/api/seed` | Run seed / reset demo data |

---

## Issue Workflow — State Machine

```
  ┌──────────┐    assign officer    ┌──────────────┐   resolution notes   ┌───────────┐
  │   Open   │ ──────────────────→  │ In Progress  │ ────────────────────→ │ Completed │
  └──────────┘                      └──────────────┘                      └───────────┘
       ↑                                                                       │
       └───────────────────────── reopen (status reset) ───────────────────────┘
```

| Transition | Preconditions | Side Effects |
|------------|---------------|--------------|
| **Open → In Progress** | `assigned_to` must be set (officer selected) | Logs `ISSUE_STATUS_UPDATED` |
| **In Progress → Completed** | `resolution_notes` non-empty | Sets `completed_date`, logs `ISSUE_COMPLETED` |
| **Completed → Open** | None (simple reopen) | Clears `completed_date` and `resolution_notes`, logs `ISSUE_REOPENED` |
| **Open → Open** (assign only) | None | Sets `assigned_to`, logs `ISSUE_ASSIGNED` |

**Not allowed**: skipping In Progress (Open → Completed), going backwards from In Progress → Open (update the assignment or details instead).

**Reopening** (MVP): A completed issue can be reopened, which resets it to Open. This is a simple status update — no new issue is created. The activity log captures the full history.

---

## Business Rules — Implementation Map

| Rule | Where Enforced | How |
|------|----------------|-----|
| No issue on Retired asset | `POST /api/issues` | Check `asset.status !== 'Retired'`, return 400 |
| Retire with open issues → **warn, allow** | `PATCH /api/assets/[id]/retire` | Query open issues → include warning + list in response, but proceed with retirement |
| Resolution notes required for Complete | `PATCH /api/issues/[id]/complete` | Validate `resolution_notes` is non-empty, return 400 if missing |
| Assignment required for In Progress | `PUT /api/issues/[id]` | If `status → In Progress`, check `assigned_to` is set, return 400 if missing |
| Issue category must match asset category | `POST /api/issues` | Look up asset → validate `issueCategory ∈ ISSUE_CATEGORIES[asset.category]` |
| "Other" issue category → description ≥ 20 chars | `POST /api/issues` | If `issueCategory` starts with "Other", enforce `description.length >= 20` |
| Category locked after creation | `PUT /api/assets/[id]` | Ignore `category` field in update payload |
| Category-specific details validated | `POST /api/assets`, `PUT /api/assets/[id]` | Validate `details` JSON against required fields for the asset's category |
| Retired assets hidden by default | `GET /api/assets` | Default filter excludes `status = 'Retired'` unless explicitly included |
| Condition updated manually | UI + `PATCH /api/assets/[id]/condition` | Separate endpoint, separate log entry |

---

## Pages & UI Detail

### 1. Dashboard (`/`)

```
┌──────────────────────────────────────────────────────┐
│  Header: "Gujarat R&B Asset Management"   Demo User  │
├──────┬───────────────────────────────────────────────┤
│      │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ Nav  │  │Total│ │Roads│ │Brdg │ │Bldg │  StatCards  │
│      │  └─────┘ └─────┘ └─────┘ └─────┘            │
│      │  ┌─────┐ ┌───────────┐                        │
│      │  │Open │ │Poor/Crit  │                        │
│      │  │Issue│ │Assets     │                        │
│      │  └─────┘ └───────────┘                        │
│      │                                               │
│      │  ┌─ Issues Requiring Attention ──────────┐    │
│      │  │ High/Critical, not Completed           │    │
│      │  │ Sorted: priority DESC, age DESC        │    │
│      │  └────────────────────────────────────────┘    │
│      │                                               │
│      │  ┌─ Recent Activity ─────────────────────┐    │
│      │  │ Timeline: last 15 entries              │    │
│      │  └────────────────────────────────────────┘    │
└──────┴───────────────────────────────────────────────┘
```

### 2. Asset Inventory (`/assets`)

- **Search bar** — filters by name or ID (debounced, 300ms)
- **Filter chips/dropdowns** — Category, District, Division, Condition, Status (multi-select where appropriate)
- **Table** — ID, Name, Category, Type, District, Condition (badge), Status (badge), Actions
- **"+ Add Asset"** button → navigates to `/assets/new`
- Default sort: newest first
- Retired assets hidden unless Status filter includes "Retired"

### 3. Add Asset (`/assets/new`)

- **Step 1**: Select Category (3 big cards: Road / Bridge / Building)
- **Step 2**: Dynamic form based on category
  - Common fields: Name, Type (dropdown filtered by category), District, Address, Lat/Lng, Division, Condition
  - Category-specific panel: Road details / Bridge details / Building details
- Validation: all required fields, numeric ranges for lengths/area/floors
- On success: redirect to asset detail, show toast

### 4. Asset Detail (`/assets/[id]`)

Tabbed or sectioned layout:

- **Overview** — all fields displayed, condition badge, status badge
- **Category Details** — rendered section based on category
- **Action buttons**: Edit Asset, Update Condition (modal), Report Issue, Retire Asset
- **Maintenance Issues** — split into Open/In Progress and Completed sections
  - Each issue: ID, category, priority badge, status, assigned officer, dates
  - Click to expand/edit inline or in modal
- **Activity History** — chronological timeline with icons per action type

### 5. Edit Asset (`/assets/[id]/edit`)

- Same form as Add, but category field is **disabled/locked**
- Pre-populated with current values
- Changes logged to activity

### 6. Maintenance Issues (`/issues`)

- **Filter bar** — Status, Priority, Asset Category
- **Table** — Issue ID, Asset (link), Category, Priority (badge), Status (badge), Assigned To, Reported Date
- Click row → expands or navigates to asset detail

### 7. Issue Actions (inline or modal on asset detail)

- **Assign Officer** — dropdown of seeded officers
- **Move to In Progress** — requires assigned officer
- **Complete** — requires resolution notes (textarea)
- Each transition logged to activity

---

## Activity Logger — Centralized Helper

```javascript
// lib/activity-logger.js
function logActivity(db, { assetId, issueId, action, actor, summary, oldValue, newValue })
```

Called from **every mutation handler** — never from the client. Guarantees no action is missed.

**Logged actions enum:**
- `ASSET_REGISTERED`
- `ASSET_EDITED`
- `CONDITION_UPDATED`
- `ASSET_RETIRED`
- `ISSUE_REPORTED`
- `ISSUE_ASSIGNED`
- `ISSUE_STATUS_UPDATED`
- `ISSUE_COMPLETED`
- `ISSUE_REOPENED`

---

## ID Generator — Atomic Counters

```javascript
// lib/id-generator.js
function generateId(db, prefix) {
  // Single transaction:
  // UPDATE id_counters SET next_val = next_val + 1 WHERE prefix = ?
  // SELECT next_val - 1 FROM id_counters WHERE prefix = ?
  // Return: `${prefix}-${String(val).padStart(4, '0')}`
}
```

Prefix mapping: `Road → RD`, `Bridge → BR`, `Building → BLD`, `Issue → ISS`

---

## Seed Data

### Reference Data
- **5 Divisions**: Roads Division (Ahmedabad), Roads Division (Surat), Roads Division (Rajkot), Buildings Division (Gandhinagar), Buildings Division (Vadodara)
- **8 Officers**: Distributed across divisions with realistic Gujarat names
- **33 Districts**: All Gujarat districts

### Asset Seeds (18 assets)

| # | Category | Name | District | Condition |
|---|----------|------|----------|-----------|
| 1 | Road | Ahmedabad-Vadodara Expressway | Ahmedabad | Good |
| 2 | Road | SH-17 Rajkot-Jamnagar Highway | Rajkot | Fair |
| 3 | Road | Gandhinagar-Mehsana MDR | Gandhinagar | Good |
| 4 | Road | Surat Ring Road (South) | Surat | Poor |
| 5 | Road | Bhavnagar City Road Section-12 | Bhavnagar | Critical |
| 6 | Road | Junagadh-Veraval MDR | Junagadh | Fair |
| 7 | Bridge | Sabarmati River Bridge (NH-48) | Ahmedabad | Good |
| 8 | Bridge | Tapi Bridge (Surat) | Surat | Fair |
| 9 | Bridge | Narmada Flyover (Bharuch) | Bharuch | Poor |
| 10 | Bridge | Aji River Culvert (Rajkot) | Rajkot | Good |
| 11 | Bridge | Banas Bridge (Palanpur) | Banaskantha | Critical |
| 12 | Building | Sachivalay (State Secretariat) | Gandhinagar | Good |
| 13 | Building | District Collectorate | Ahmedabad | Fair |
| 14 | Building | R&B Division Office | Surat | Good |
| 15 | Building | Government Primary School No.4 | Vadodara | Poor |
| 16 | Building | Taluka Health Centre | Mehsana | Fair |
| 17 | Building | PWD Rest House | Kutch | Poor |
| 18 | Building | District Panchayat Office | Rajkot | Good |

### Issue Seeds (14 issues)

Spread across statuses (Open, In Progress, Completed), priorities (Low→Critical), all three asset categories. Completed issues have resolution notes and completed dates.

### Activity Log Seeds

Auto-generated from the seed data: asset registration entries, issue reported entries, status changes matching the seeded issues, condition changes for assets that are Poor/Critical.

### Seed Script

- **Idempotent**: checks if data exists before inserting
- **Reset command**: `POST /api/seed?reset=true` drops all data and re-seeds
- Runs automatically on first DB initialization

---

## Design System (CSS Custom Properties)

```css
:root {
  /* Primary palette — Government / institutional blue-grey */
  --color-primary: #1a56db;
  --color-primary-dark: #1342a8;
  --color-primary-light: #e8effd;

  /* Semantic status colors */
  --color-good: #059669;
  --color-fair: #d97706;
  --color-poor: #dc2626;
  --color-critical: #991b1b;

  /* Priority colors */
  --color-priority-low: #6b7280;
  --color-priority-medium: #2563eb;
  --color-priority-high: #ea580c;
  --color-priority-critical: #dc2626;

  /* Asset status */
  --color-active: #059669;
  --color-under-maintenance: #d97706;
  --color-retired: #6b7280;

  /* Issue status */
  --color-open: #ef4444;
  --color-in-progress: #f59e0b;
  --color-completed: #10b981;

  /* Surface & text */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --radius: 8px;
  --shadow: 0 4px 6px -1px rgba(0,0,0,.3);
}
```

Dark-mode first. Glassmorphism card effects. Smooth transitions on all interactive elements.

---

## Build Order

### Phase 1 — Foundation
1. Database schema + connection singleton (`db.js`, `schema.sql`)
2. Constants file (all enums, categories, types)
3. ID generator
4. Activity logger
5. Seed data script
6. Reference data API (`/api/reference`)

### Phase 2 — Core CRUD
7. Asset APIs: create, get, list, edit
8. Issue APIs: create, get, list, update, complete
9. Condition update API
10. Retire asset API
11. Dashboard aggregation API
12. Activity API (global + per-asset)

### Phase 3 — UI Shell
13. Global CSS design system
14. Root layout (header, sidebar navigation)
15. Reusable components (badges, cards, modal, toast, empty state)

### Phase 4 — Pages
16. Dashboard page with stat cards, attention issues, recent activity
17. Asset Inventory page with search + filters + table
18. Add Asset page with category-driven form
19. Asset Detail page with overview, issues, activity
20. Edit Asset page
21. All Issues page with filters

### Phase 5 — Polish
22. Business rule enforcement with user-friendly error messages
23. Loading states, transitions, animations
24. Responsive layout adjustments
25. Seed data verification + reset endpoint
26. End-to-end demo flow testing

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero setup, single file, perfect for demo; easily swappable later |
| JSON column for category details | Avoids 3 separate detail tables; validated in application layer per category |
| Atomic ID counters via DB | Never "count+1"; survives deletions and concurrent access |
| Activity log from service layer | Single `logActivity()` helper called alongside every mutation — no middleware gaps |
| Dark theme by default | Premium feel, matches modern government dashboard aesthetics |
| No client-side state library | `fetch` + React state is sufficient for this data volume |
| Category locked after creation | Prevents ID-prefix mismatch and data integrity issues |
| Retire allows with warning | Blocking retirement on open issues is too rigid — real assets may need retirement while issues are unresolved; history is preserved either way |
| Reopen completed issues | Simple status reset to Open — avoids forcing users to create duplicate issues for recurring problems |
| Local-first deployment | SQLite file persistence doesn't survive serverless cold starts; demo locally or on a VM |

---

## Demo Flow Checklist

- [ ] Open Dashboard → see summary cards, attention issues, recent activity
- [ ] Navigate to Asset Inventory → see seeded assets with filters
- [ ] Click "+ Add Asset" → create a new Road with all details
- [ ] See generated ID (RD-XXXX) on the asset detail page
- [ ] Click "Report Issue" → fill category, description, priority
- [ ] Assign an officer from the dropdown
- [ ] Move issue to "In Progress"
- [ ] Complete the issue with resolution notes
- [ ] See issue status change + activity timeline on asset page
- [ ] Return to Dashboard → verify updated counts
