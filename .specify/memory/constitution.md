<!--
  Sync Impact Report
  ===================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (initial version)
  Added sections:
    - Core Principles (5 principles)
    - Technology Stack & Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md       ✅ no update needed (generic)
    - .specify/templates/spec-template.md        ✅ no update needed (generic)
    - .specify/templates/tasks-template.md       ✅ no update needed (generic)
    - .specify/templates/checklist-template.md   ✅ no update needed (generic)
  Follow-up TODOs: None
-->

# Mini Storefront Constitution

## Core Principles

### I. Simplicity First
- Every feature MUST start with the simplest viable implementation.
  YAGNI (You Aren't Gonna Need It) applies: do NOT build
  abstractions, services, or layers until a concrete need is proven.
- Maximum of two levels of component nesting in the UI before
  refactoring is required.
- No external service integrations (payment gateways, analytics,
  etc.) unless explicitly specified in a feature spec.
- Rationale: A mini storefront is deliberately small-scope; premature
  complexity is the primary risk.

### II. Responsive Mobile-First UI
- All pages and components MUST be designed mobile-first and MUST
  render correctly on viewports from 320 px to 1440 px.
- Breakpoints MUST follow a consistent system (e.g., sm/md/lg/xl).
- Touch targets MUST be at least 44 × 44 px on mobile.
- Navigation MUST be usable with a single hand on mobile devices.
- No horizontal scrolling is permitted on any supported viewport.
- Rationale: The storefront targets end-users on phones; a broken
  mobile experience is a broken product.

### III. Clear Separation of Storefront & Admin
- The customer-facing storefront and the admin dashboard MUST be
  logically separated (distinct route groups or distinct apps).
- Admin operations (inventory management, pricing, publish/unpublish)
  MUST be protected behind authentication/authorization.
- Storefront pages MUST only display products that are in
  "published" state.
- Changes made in the admin panel (stock, price, visibility) MUST be
  reflected on the storefront without requiring a manual cache purge
  or redeployment.
- Rationale: Mixing admin and public concerns leads to security
  holes and confusing UX.

### IV. Data Integrity & Consistency
- Product stock quantity MUST NOT go below zero; the system MUST
  validate stock levels before any operation that reduces inventory.
- Price MUST be stored and transmitted as an integer in the smallest
  currency unit (e.g., cents) to avoid floating-point errors.
- Every product MUST have a unique identifier, a name, a price,
  a stock quantity, and a published/unpublished status at minimum.
- State transitions (publish ↔ unpublish) MUST be explicit and
  auditable (logged with timestamp).
- Rationale: Incorrect inventory or pricing data directly damages
  trust and revenue.

### V. Testable by Default
- Every API endpoint or service function MUST be independently
  testable without requiring the full application stack.
- Critical paths (add product, update price, update stock,
  publish/unpublish, storefront product listing) MUST have at least
  one automated test covering the happy path.
- UI components MUST be renderable in isolation for visual/snapshot
  testing.
- Rationale: A store that silently breaks checkout or shows wrong
  prices has no value.

## Technology Stack & Constraints

- **Architecture**: Web application with frontend + backend
  separation (API-driven).
- **Frontend**: Single-page application or server-rendered pages;
  MUST use a component-based framework (e.g., React, Vue, Svelte).
- **Backend**: REST or JSON-based API; MUST return structured error
  responses with appropriate HTTP status codes.
- **Storage**: Relational or document database; MUST support ACID
  transactions for inventory updates.
- **Authentication**: Admin routes MUST require authentication;
  storefront routes are public (no login required for browsing).
- **Performance**: Storefront pages MUST achieve Largest Contentful
  Paint (LCP) ≤ 2.5 s on a 4G connection. Admin pages have no
  strict LCP target but MUST remain usable (< 5 s load).
- **Browser support**: Latest two major versions of Chrome, Firefox,
  Safari, and Edge. Mobile Safari and Chrome on iOS/Android.
- **Accessibility**: MUST meet WCAG 2.1 Level A at minimum for the
  storefront.

## Development Workflow

- Features MUST be developed on feature branches and merged via
  pull request.
- Each pull request MUST pass linting, type-checking (if
  applicable), and automated tests before merge.
- Commit messages MUST follow Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- The `main` branch MUST always be in a deployable state.
- Database schema changes MUST be managed through versioned
  migrations—never manual DDL in production.

## Governance

- This constitution is the highest-authority document for the Mini
  Storefront project. All implementation decisions, code reviews, and
  architectural choices MUST comply with the principles above.
- **Amendments**: Any change to this constitution MUST be documented
  in a pull request with a clear rationale. Version number MUST be
  incremented per semantic versioning (see below). All affected
  specs, plans, and task lists MUST be reviewed for alignment after
  an amendment.
- **Versioning policy**: MAJOR for principle removals or
  redefinitions, MINOR for new principles or material expansions,
  PATCH for clarifications and typo fixes.
- **Compliance review**: Every pull request review SHOULD include a
  check against these principles. Violations MUST be justified in
  writing or resolved before merge.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
