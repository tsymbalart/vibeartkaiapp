# Overview

**Artkai Pulse** is the unified team operating system for Artkai's design practice. It combines two formerly separate apps:

1. **Pulse Check-in** — anonymous team health-check across 8 pillars (originally `vibeartkaiapp`).
2. **Design Ops** — project health, design team well-being, and risks/opportunities tracking (originally `checkartkaiapp`, fused in 2026).

Both flows share one Postgres database, one Express API, one React app, and the same Vibe design system (dark navy + DM Sans + Boxicons + dark mode). Pulse features are available to all members; Design Ops features (Projects, Design Team, Operational Tasks) are gated to leads and directors.

# User Preferences

I prefer simple language and clear explanations. I want iterative development with frequent, small updates. Ask before making major architectural changes or introducing new dependencies. I prefer to work with functional programming paradigms where applicable. Do not make changes to files in the `lib/api-spec/` folder.

# System Architecture

The project is structured as a pnpm workspace monorepo. The backend consists of an Express 5 API server, while the frontend is built with React, Vite, Tailwind CSS, and shadcn/ui. PostgreSQL is used for the database, managed with Drizzle ORM.

**Frontend/UI/UX:**
- **Design System:** Artkai-style branding with a warm, human, and approachable tone.
- **Color Scheme:** Primary dark navy (#07142D) in light mode, with a light grey-blue (hsl(210 18% 82%)) in dark mode. Backgrounds are light gray (#F5F6F8) in light mode and deep navy (hsl(220 50% 7%)) in dark mode, maintaining a true luminance inversion.
- **Typography:** DM Sans font, strictly using `font-normal` (400) and `font-medium` (500) weights.
- **Border Radii:** A hierarchical system is applied: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for mid-level elements like buttons, and `rounded-lg` (8px) for small elements. `rounded-full` is reserved for inherently circular components.
- **Theming:** Supports light/dark mode toggling, persisting the preference in `localStorage`.
- **Animations:** Utilizes Framer Motion for UI animations.
- **Charting:** Recharts is used for data visualization.
- **Iconography:** Boxicons (filled style) via react-icons/bi.
- **Confetti:** `canvas-confetti` for celebratory effects.

**Backend/API:**
- **API Framework:** Express 5.
- **Authentication:** Google OAuth 2.0 (OpenID Connect with PKCE) for secure user authentication. Users sign in with their Google accounts. Sessions are managed server-side using a custom `sessions` table. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment secrets.
- **Authorization:** Role-based access control with `member`, `lead`, and `director` roles. Middleware (`authMiddleware`, `requireAuth`, `requireRole`) enforces access policies.
- **Database Schema:** Designed to support teams, users, check-ins, responses, pulse settings, sub-teams, anonymous feedback (intent threads), kudos, and 1:1 meeting notes. Key tables include `teams`, `users`, `questions`, `check_ins`, `responses`, `pulse_settings`, `sub_teams`, `intent_threads`, `kudos`, and `one_on_one_notes`.
- **Scoring Engine:** Normalizes responses to a 0-100 scale. Calculates pillar scores as a weighted average of question scores and a composite score as a weighted average of pillar scores. Statuses (Green, Yellow, Red) are assigned based on score thresholds. Supports `latest_only` (default) or `average_all` scoring modes within a 90-day rolling window. Sub-team filtering is consistently applied across metrics.
- **API Specification:** OpenAPI specification is used for API definition and code generation.
- **Validation:** Zod is used for schema validation, integrated with Drizzle ORM (`drizzle-zod`).

**Monorepo Structure:**
- `artifacts/`:
  - `api-server` — Express 5 API server. Routes split across `pulse*`, `projects`, `designTeam`, `registerItems`, `allowedEmails`, `designOpsDashboard`. Custom session management via `lib/auth`.
  - `app` — Single React + Vite frontend serving both Pulse and Design Ops flows. Pulse pages live in `src/pages/*` (Dashboard, CheckIn, MyJourney, …); Design Ops pages live alongside (Projects, ProjectDetail, DesignTeam, DesignTeamMember, OperationalTasks). Design Ops UI primitives are isolated under `src/components/design-ops/*`.
  - `mockup-sandbox` — internal component preview server.
- `lib/`:
  - `api-spec` — single OpenAPI source (extended in 2026 with all design-ops paths).
  - `api-client-react` — orval-generated React Query hooks.
  - `api-zod` — orval-generated Zod schemas (re-exports schemas from `./generated/api`; the parallel `./generated/types/` directory is intentionally NOT re-exported to avoid name collisions — derive types via `z.infer<typeof Schema>`).
  - `db` — Drizzle ORM schema. Pulse tables: `teams`, `users`, `subTeams`, `questions`, `checkIns`, `responses`, `pulseSettings`, `intentThreads`, `kudos`, `oneOnOneNotes`. Design-ops tables (added 2026): `projects`, `projectHealthChecks`, `userHealthChecks`, `projectAssignments`, `registerItems`, `allowedEmails`. The `users` table is fused: design-ops "people" are `users` rows with `roleTitle` set, plus optional `leadUserId`, `employmentStatus`, `notes`, `reviewDate`.
  - `scoring` — pure utility package for design-ops scoring (`PROJECT_HEALTH_DIMS`, `PERSON_HEALTH_DIMS`, `computeHealthStatus`, `computeRiskScore`, `computeOpportunityScore`, status labels). Importable from both backend and frontend with no runtime deps.

**Design Ops domain model:**
- A user is "tracked" in the Design Team listing iff `users.roleTitle IS NOT NULL`.
- Untracked users (logged in but not yet claimed by a lead) appear in the "Track Member" form on the Design Team page.
- Health checks are immutable snapshots stored in `project_health_checks` and `user_health_checks` (the same dimensions as Check originally tracked).
- Risks and opportunities live in a unified `register_items` table with `linkedTo: "project" | "user"`.
- All design-ops queries are scoped to the user's `teamId` for multi-tenant safety.

**Auth:**
- Google OAuth 2.0 via `google-auth-library` (no Passport).
- Login is gated by either an existing pending invitation OR a row in `allowed_emails` for the team. Directors manage the allowlist via Settings > Allowed Emails.
- Sessions stored server-side in the `sessions` table.

# Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

# External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Google OAuth 2.0 (OpenID Connect with PKCE)
- **Frontend Framework:** React
- **Build Tool:** Vite, esbuild
- **Styling:** Tailwind CSS, shadcn/ui
- **Charting Library:** Recharts
- **Animation Library:** Framer Motion
- **Icons:** Boxicons (via react-icons/bi)
- **Font:** DM Sans
- **Confetti Library:** canvas-confetti
- **API Code Generation:** Orval
- **Schema Validation:** Zod
