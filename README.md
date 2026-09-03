# Anchor ⚓

> **Accountability without shame. Privacy without compromise. Design that breathes.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Neon Postgres](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-E05A47?style=flat-square&logo=shield)](file:///c:/dev/anchor/lib/encryption.ts)

**Anchor** is a calm, privacy-respecting daily accountability and recovery companion. Built for individuals navigating recovery, habit change, and nervous system regulation, Anchor rejects punitive streak anxiety, aggressive gamification, and intrusive surveillance in favor of gentle daily rituals, honest reflection, and cryptographic data protection.

---

## Table of Contents

1. [Core Ethos & Anti-Shame Philosophy](#core-ethos--anti-shame-philosophy)
2. [Product Pillars & Architecture](#product-pillars--architecture)
3. [Security & Cryptographic Model](#security--cryptographic-model)
4. [Granular Default-Zero Partner Sharing](#granular-default-zero-partner-sharing)
5. [Design System & Theme Tokens](#design-system--theme-tokens)
6. [Key Features Walkthrough](#key-features-walkthrough)
7. [Database Schema](#database-schema)
8. [Local-First Guest Mode](#local-first-guest-mode)
9. [Getting Started & Setup](#getting-started--setup)
10. [Automated Verification & Test Suite](#automated-verification--test-suite)
11. [Deployment](#deployment)

---

## 1. Core Ethos & Anti-Shame Philosophy

Traditional habit trackers fail individuals in recovery and mental wellness journeys through three fundamental flaws:

1. **The Gamification Trap:** Streak breaks trigger intense shame spirals (*"I broke my 40-day streak, so I've failed completely"*).
2. **The Privacy Gap:** Deeply sensitive mental health and relapse reflections are stored in plaintext databases vulnerable to breaches, snooping, or data brokers.
3. **Cognitive Overwhelm:** Cluttered dashboards with competing primary actions, pushy notifications, and transactional checklists.

**Anchor's Position:**
- **Soft Landings Guaranteed:** If an intention is missed, there are no flashing red warning banners, harsh resets, or punitive alerts. Progress is framed as accumulated experience on a continuous path.
- **Single-Habit Clarity:** Grounded around one primary anchor habit per circadian cycle to cultivate depth over shallow multi-tasking.
- **Tactile, Calming Interactions:** Micro-haptics and resonant singing bowl chimes turn daily check-ins into grounding somatic rituals rather than data entry chores.

---

## 2. Product Pillars & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANCHOR ARCHITECTURE                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. RESPECTED DATA    │ 2. RECOVERY-FIRST    │ 3. SENSORY CRAFT              │
│    Server-managed    │    2D Circumplex     │    Web Audio 432Hz synthesizer│
│    AES-256-GCM field │    Mood (Valence x   │    vibration micro-haptics,   │
│    encryption, zero  │    Energy), soft     │    organic claymorphism,      │
│    trackers, default-│    landings, non-    │    Warm Linen & Dark Stone    │
│    zero partner link │    diagnostic trends │    harmonious design tokens   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Tech Stack
- **Framework:** Next.js 16.3.3 (App Router, Turbopack, Server Actions, Route Handlers)
- **UI Engine:** React 19.2.8 + Framer Motion 13.1.1
- **Styling:** Tailwind CSS 4 with native `@theme` CSS variable tokens
- **Database & ORM:** Neon Serverless PostgreSQL with Drizzle ORM
- **Cryptography:** Node.js native `crypto` module (AES-256-GCM, 96-bit IVs)
- **Audio & Sensory:** HTML5 Web Audio API harmonic chime synthesizer + Web Vibration API
- **Authentication:** `jose` JWT cookies (`httpOnly`, `SameSite=Lax`, secure) + `bcryptjs`
- **PWA & Offline:** Progressive Web App with homescreen launch manifest and local-first guest caching

---

## 3. Security & Cryptographic Model

Anchor implements **Option A: Server-Managed Application-Layer Field Encryption (AES-256-GCM)** as defined in `plan.md` §1.2.

```
Plaintext Reflection ──────┐
                           │ Node.js crypto
Environment / KMS Key ────┼── AES-256-GCM ──► Base64 Ciphertext + 96-bit IV + Key Version "v1"
                           │
Unique 12-byte Hex IV ─────┘
```

### Encrypted Fields
Only sensitive, free-text reflections are encrypted, preserving database indexing for non-sensitive structured metrics:
- `check_ins.reflection` (Evening reflection free-text)
- `check_ins.intention_note` (Morning intention micro-note)
- `journal_entries.content` (Full personal reflective journal entries)

### Transparent Privacy Boundaries
Anchor clearly articulates what is and is not encrypted:
- **Encrypted:** Written reflection text, private journal entries, and intention notes are stored strictly as base64 ciphertext with unique initialization vectors.
- **Unencrypted Structured Data:** Mood valence (-5 to +5), somatic energy (1 to 5), blocker tags (`stress`, `time`, `urges`), and completion timestamps remain structured to power client-side trend visualization and statistical pattern analysis without external AI calls.
- **Complete Client Storage Purge on Logout:** When a user logs out, all client-side `localStorage`, `sessionStorage`, and `IndexedDB` stores are aggressively purged (`lib/client-storage.ts`). This guarantees that autosaved journal drafts (`anchor_journal_draft_*`), starred dates, saved quotes, and cached check-ins never linger on shared or public workstations.
- **Zero Third-Party Trackers:** No Google Analytics, no Meta Pixel, no data brokers.

---

## 4. Granular Default-Zero Partner Sharing

Anchor provides an optional accountability partner and sponsor portal (`/sponsor` and `/share/[token]`) governed by **strict, default-zero permissions**:

```typescript
// db/schema.ts: All partner sharing flags default to FALSE
export const partnerPermissions = pgTable("partner_permissions", {
  shareConsistency: boolean("share_consistency").default(false).notNull(),
  shareMilestones: boolean("share_milestones").default(false).notNull(),
  shareMoodTrends: boolean("share_mood_trends").default(false).notNull(),
  shareBlockers: boolean("share_blockers").default(false).notNull(),
  shareJournalNotes: boolean("share_journal_notes").default(false).notNull(), // Off by default!
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});
```

### Adversarially Verified Permissions
- **Journal Redaction:** If a partner has all metric flags enabled but `shareJournalNotes: false`, journal reflections and intention notes are strictly sanitized to `undefined` server-side before reaching the network response.
- **Time-Bound Tokens:** Partner share links expire after a configurable window (30, 60, or 90 days). Expired tokens return `HTTP 410 Gone`.

---

## 5. Design System & Theme Tokens

Anchor features two complete, rigorously tested themes built around warm, earthy, grounding tones with zero fluorescent or clinical colors.

### Palettes (`app/globals.css`)

| Token | Light Mode ("Warm Linen") | Dark Mode ("Dark Stone") | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FAF7F2` | `#1C1917` | Canvas background |
| `--surface-card` | `#FFFFFF` | `#25221F` | Elevated card surfaces |
| `--border-subtle` | `#EAE3D7` | `#38332E` | Card & container borders |
| `--text-primary` | `#2C2520` | `#ECE7E0` | High-contrast body & titles |
| `--text-secondary` | `#786F66` | `#A8A096` | Subordinate labels & captions |
| `--accent-terracotta` | `#C86D51` | `#C86D51` | Primary action button & active focus |
| `--tone-positive` | `#658B70` | `#658B70` | Sage: positive follow-through |
| `--tone-reflective` | `#B88452` | `#B88452` | Warm Ochre: morning ritual & cadence |

### Standardized Button Weights
Anchor eliminates competing solid buttons:
1. **`.btn-primary` (Single Filled Style):** Filled Terracotta (`#C86D51`), hover `#B35D43`, white text, pill shape (`rounded-full`), active tap compression (`scale(0.98)`).
2. **`.btn-secondary` (Subordinate Outlined Style):** Transparent background, subtle border (`1px solid var(--border-subtle)`), muted text, hover background shift to `var(--surface-subtle)`.

### Strict 4px Spacing Scale
Layouts use an 8-step spacing scale (4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px) via `.page-container`, `.card-base`, `.card-stack`, and `.section-stack`.

---

## 6. Key Features Walkthrough

### 1. The Single-Focus Today Screen (`/today`)
- **Collapsed Calm Header:** Displays greeting (`Good Morning` / `Good Evening, [Name]`), anchor focus, and grounding reason with zero card clutter.
- **Single Hero Ritual Card:** Automatically displays whichever ritual is relevant based on time of day (Morning Intention before 2 PM; Evening Reflection after 2 PM).
- **Secondary Supporting Area:** Displays full daily wisdom quote (untruncated with author attribution) paired with the "Pause & Breathe" grounding tool.
- **Subtle Other-Ritual Switch:** A compact pill in the header enables toggling between morning and evening views on demand.

### 2. 2-Dimensional Circumplex Mood Logging
- Evaluates emotion along two human dimensions:
  - **Emotional Valence:** -5 (Unpleasant/Depleted) to +5 (Grounded/Joyful).
  - **Somatic Energy:** 1 (Low Energy/Lethargic) to 5 (High Energy/Activated).
- Mapped visually on a dual-curve SVG timeline on `/progress` alongside follow-through overlays.

### 3. Explainable Statistical Pattern Engine
- Surfaces trigger correlations directly from the user's self-reported blocker tags (`stress`, `time strain`, `fatigue`, `impulse urges`, `distraction`).
- **Minimum Threshold Enforcement:** Requires at least **3 occurrences** on a specific day-of-week or time window before surfacing an insight.
- Phrased transparently and non-diagnostically (e.g. *"You've logged stress as an obstacle on 3 Tuesday evenings"*).
- Every card includes a dismiss action that persists to `localStorage`.

### 4. Non-Diagnostic Progress Summaries (`/progress`)
- Generates clean, printer-friendly summaries formatted with `@media print` for browser print or Save-as-PDF.
- Reflections and journal notes are **strictly excluded by default**, requiring an explicit opt-in checkbox before export.
- Carries a permanent disclaimer: *"This is a self-reported summary from the Anchor app, not a clinical assessment."*

### 5. Somatic Grounding Drawer ("Pause & Breathe")
- Interactive 4-7-8 and box breathing simulator.
- 5-4-3-2-1 sensory grounding checklist.
- HTML5 Web Audio singing bowl chime synthesizer (zero external audio assets).

---

## 7. Database Schema

The database is defined using Drizzle ORM targeting Neon PostgreSQL (`db/schema.ts`):

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    users     │──1:N──│   commitments    │──1:N──│    check_ins    │
└──────────────┘       └──────────────────┘       └─────────────────┘
       │                                                   │ (AES-256-GCM)
       ├──1:N──► journal_entries (AES-256-GCM)             ├── intentionNote
       ├──1:N──► partner_permissions (Default-Zero)        └── reflection
       ├──1:N──► push_subscriptions (Web Push)
       └──1:N──► weekly_recaps
```

---

## 8. Local-First Guest Mode

Visitors can experience Anchor immediately without creating an account or entering credentials:
- **3-Screen Onboarding:** Allows selecting an intention, experiencing an interactive evening check-in preview with tactile haptics, and selecting notification cadence.
- **Local Storage Manager (`lib/guest-service.ts`):** Stores check-ins, commitments, and journal entries locally in browser `localStorage`.
- **Guest Banner (`app/components/GuestBanner.tsx`):** Displays a non-intrusive reminder on `/today` and `/journal`:
  > *"Guest Mode: Saved locally on this device. Create an account to back up and sync."*
- **Route Guard Protection:** Unauthenticated guests can use `/today` and `/journal` without forced redirects to `/login`.

---

## 9. Getting Started & Setup

### Prerequisites
- Node.js 20.x or later
- npm or pnpm
- A Neon Serverless Postgres database instance (or any standard PostgreSQL 15+ database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Afolabi-bit/anchor.git
   cd anchor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment template:
   ```bash
   cp .env.example .env.local
   ```

   Generate a cryptographically secure 256-bit encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Fill in your `.env.local` file:
   ```env
   # PostgreSQL Connection String
   DATABASE_URL="postgres://user:password@ep-sample-pool.neon.tech/anchor?sslmode=require"

   # AES-256-GCM Application Key (64 hex characters)
   ANCHOR_ENCRYPTION_KEY="<your-generated-256-bit-hex-key>"

   # Authentication Secret
   JWT_SECRET="<your-jwt-secret>"

   # Web Push Notification Keys (VAPID)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="<vapid-public-key>"
   VAPID_PRIVATE_KEY="<vapid-private-key>"
   VAPID_SUBJECT="mailto:support@anchor.app"
   ```

4. **Run Database Migrations:**
   ```bash
   npx drizzle-kit push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Automated Verification & Test Suite

Anchor maintains dedicated standalone verification scripts to validate security, permissions, statistical surfacing, and onboarding flows:

### 1. Direct Neon Postgres Ciphertext & KMS Rotation Test
Directly queries the database layer bypassing the application to ensure free-text fields are stored strictly as base64 ciphertext:
```bash
npx tsx scripts/phase5-encryption-test.ts
```
*Validates: base64 ciphertext storage, 96-bit hex IV generation, key versioning, and KMS key swap isolation.*

### 2. Default-Zero Partner Permissions & Adversarial Redaction Test
```bash
npx tsx scripts/phase5-sharing-permissions-test.ts
```
*Validates: all 5 flags default to false, adversarial token sanitization, and HTTP 410 Gone expiry.*

### 3. Statistical Pattern Engine & Export Audit
```bash
npx tsx scripts/verify-phase3.ts
```
*Validates: sample threshold (>= 3 occurrences), non-diagnostic phrasing, mandatory disclaimer, and opt-in reflection export.*

### 4. Onboarding, Guest Mode & Audit Fixes
```bash
npx tsx scripts/verify-guest-and-onboarding.ts
```
*Validates: 3-screen onboarding architecture, interactive check-in preview, local-first guest service, and copy compliance.*

### 5. TypeScript Compilation & Linting
```bash
npx tsc --noEmit
npm run lint
```

---

## 11. Deployment

Anchor is optimized for deployment on **Vercel** with **Neon Postgres**:

1. Push your repository to GitHub / GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Under **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`
   - `ANCHOR_ENCRYPTION_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
4. Deploy. Vercel will automatically build the Next.js production bundle using Turbopack.

---

## License

Private & Proprietary. All rights reserved.
Built with mindfulness, precision, and respect for human vulnerability.
