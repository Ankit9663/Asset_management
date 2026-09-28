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
Navigate to the `asset-mgmt` folder and create a `.env.local` file:

```bash
cd asset-mgmt
cp .env.example .env.local
```

Add your database connection string in `.env.local`:
```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require"
```

### 3. Install Dependencies
```bash
cd asset-mgmt
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```
.
├── asset-mgmt/             # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router pages and 13 API routes
│   │   ├── components/     # 15 reusable UI components
│   │   └── lib/            # DB singleton, ID generator, seed, validators
│   ├── package.json
│   └── README.md
├── README.md               # Project documentation
└── .gitignore
```
