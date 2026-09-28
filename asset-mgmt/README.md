# Gujarat Roads & Buildings Asset Management System

A modern full-stack web application designed for the **Roads & Buildings Department, Government of Gujarat**, to track, monitor, and maintain public infrastructure assets across Gujarat districts.

Built with **Next.js 16 (App Router)**, **React 19**, **Neon Serverless Postgres**, and a bespoke **Dark-Mode Glassmorphism Design System** in pure Vanilla CSS.

---

## 🏛️ System Features

### 1. Multi-Category Infrastructure Tracking
- **Roads**: State Highways, Major District Roads (MDR), City Roads with start/end points, chainage lengths, surface types (Asphalt, Concrete).
- **Bridges**: River bridges, flyovers, culverts with crossing types, superstructure types (RCC, Steel, Composite), and span lengths.
- **Buildings**: Collectorates, hospitals, schools, administrative complexes with building use, total floors, and plinth area ($m^2$).

### 2. Condition & Status Monitoring
- **Asset Conditions**: Good, Fair, Poor, Critical with visual condition badges.
- **Asset Statuses**: Active, Under Maintenance, Retired.
- **Atomic ID Generation**: Formatted identifiers (`RD-0001`, `BR-0001`, `BLD-0001`) with sequence safety across concurrent creations.

### 3. Maintenance Issue State Machine
- **Lifecycle Management**: `Open` ➔ `In Progress` ➔ `Completed` (with optional `Reopen`).
- **Enforced Business Rules**:
  - `In Progress` requires officer assignment.
  - `Completed` requires mandatory resolution notes.
  - Category-specific issue types (e.g. *Potholes* for roads, *Expansion Joints* for bridges, *Roof Leakage* for buildings).
  - Minimum 20-character descriptions for "Other" issue categories.
  - Retired assets are protected from new issue creation.
  - Warnings surfaced when retiring an asset with unresolved issues.

### 4. Real-time Audit & Activity Log
- Chronological timeline tracking every asset registration, condition change, issue report, officer assignment, and completion note.
- Global and asset-specific activity feeds.

### 5. Instant Demo & Testing Reset
- One-click **"🔄 Reset Demo Data"** directly from the top navigation bar or via `POST /api/seed?reset=true`.
- Seeds **18 realistic Gujarat infrastructure assets**, **14 issues**, and historical activity entries.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack, App Router) |
| **Frontend** | React 19, Server & Client Components |
| **Database** | Neon Serverless PostgreSQL (`@neondatabase/serverless`) |
| **Styling** | Custom Vanilla CSS (Design tokens, glassmorphism, responsive grid) |
| **Font** | Google Inter variable font |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Neon Database**: A free serverless Postgres connection string from [neon.tech](https://neon.tech)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database (Optional)
The database auto-initializes on first launch, or you can run the seed script directly:
```bash
node --env-file=.env.local -e "import('./src/lib/seed.js').then(m => m.runSeed(true)).then(console.log)"
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
asset-mgmt/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── api/            # 13 REST API route handlers
│   │   │   ├── activity/   # Global activity feed
│   │   │   ├── assets/     # Asset CRUD, condition, retire, issues, activity
│   │   │   ├── dashboard/  # Aggregated counts & attention issues
│   │   │   ├── issues/     # Issue CRUD, assignment, transitions, completion
│   │   │   ├── reference/  # Divisions, officers, districts, constants
│   │   │   └── seed/       # Database reset & seeding
│   │   ├── assets/         # /assets (Inventory), /assets/new, /assets/[id], /assets/[id]/edit
│   │   ├── issues/         # /issues (All Maintenance Issues with deep linking)
│   │   ├── globals.css     # Bespoke dark design system (~1600 lines)
│   │   ├── layout.js       # Root layout with Sidebar, Header & ToastProvider
│   │   └── page.js         # Executive Dashboard
│   ├── components/         # 15 reusable UI components
│   │   ├── ActivityTimeline.js
│   │   ├── AssetForm.js
│   │   ├── AssetTable.js
│   │   ├── ConditionBadge.js
│   │   ├── EmptyState.js
│   │   ├── FilterBar.js
│   │   ├── Header.js
│   │   ├── IssueForm.js
│   │   ├── IssueTable.js
│   │   ├── Modal.js
│   │   ├── PriorityBadge.js
│   │   ├── Sidebar.js
│   │   ├── StatCard.js
│   │   ├── StatusBadge.js
│   │   └── Toast.js
│   └── lib/                # Database singleton, constants, validators, loggers
│       ├── activity-logger.js
│       ├── constants.js
│       ├── db.js
│       ├── id-generator.js
│       ├── seed.js
│       └── validators.js
└── package.json
```

---

## 🔌 API Endpoints Summary

### Assets
- `GET /api/assets` — Filter & search assets (`category`, `district`, `condition`, `status`, `search`)
- `POST /api/assets` — Register new asset with category-specific details
- `GET /api/assets/:id` — Get single asset with parsed category details
- `PUT /api/assets/:id` — Update asset core metadata & details (category locked)
- `PATCH /api/assets/:id/condition` — Update asset condition with audit note
- `PATCH /api/assets/:id/retire` — Retire asset (surfaces warning on open issues)
- `GET /api/assets/:id/issues` — Get all issues for a specific asset
- `GET /api/assets/:id/activity` — Get full audit timeline for an asset

### Issues
- `GET /api/issues` — List all issues with filters (`status`, `priority`, `category`)
- `POST /api/issues` — Report new issue against an asset
- `GET /api/issues/:id` — Single issue detail
- `PUT /api/issues/:id` — Assign officer, transition status, update details
- `PATCH /api/issues/:id/complete` — Complete issue with resolution notes

### System & Reference
- `GET /api/dashboard` — Aggregated counts by category/condition and attention issues
- `GET /api/activity` — Global recent activity stream
- `GET /api/reference` — Divisions, districts, officers, and system enums
- `POST /api/seed?reset=true` — Reinitialize and seed demo dataset

---

## 🎯 Verification & Demo Flow

The application comes with an automated end-to-end test script verifying the full 10-step lifecycle:

```bash
node scratch/test-demo-flow.mjs
```

1. **Executive Dashboard**: Review KPIs, attention-needed critical issues, and activity feed.
2. **Inventory Search & Filter**: Instant filtering by district, condition, category, or keyword search.
3. **Register New Asset**: Multi-step wizard creating a road (`RD-0007`) with start/end points and length.
4. **Update Condition**: Change condition with audit trail logging.
5. **Report Issue**: File a high-priority pothole issue assigned to an officer.
6. **Issue Workflow**: Move to `In Progress`, resolve with notes, and mark `Completed`.
7. **Audit Trail**: Real-time activity log reflecting every status change.
8. **1-Click Reset**: Use the header reset button to return to a clean demo slate.
