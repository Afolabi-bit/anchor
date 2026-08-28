# Anchor — Tier-1 Design System & UX Scaling Plan

> **Product Vision:** A warm, judgment-free daily accountability & recovery companion that replaces streak anxiety with honest reflection, sensory grounding, and actionable insight.

---

## 1. Design System & Token Hierarchy

### A. 3-Tier Token Architecture (`app/globals.css`)
```
[ Global Primitives ] ──► [ Semantic Intent Tokens ] ──► [ Component Tokens ]
```

- **Fluid Typography (Major Third Scale 1.25):**
  - `--font-size-xs`: `clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem)`
  - `--font-size-sm`: `clamp(0.875rem, 0.825rem + 0.25vw, 0.9375rem)`
  - `--font-size-base`: `clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)`
  - `--font-size-lg`: `clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem)`
  - `--font-size-xl`: `clamp(1.375rem, 1.25rem + 0.5vw, 1.625rem)`
  - `--font-size-2xl`: `clamp(1.75rem, 1.5rem + 0.8vw, 2.25rem)`
  - `--font-size-hero`: `clamp(2.25rem, 1.9rem + 1.4vw, 3.5rem)`

- **Organic Elevation (Zero hard edges, warm diffuse ambient shadow):**
  - `--shadow-organic-sm`: `0 2px 8px -2px rgba(44, 37, 32, 0.04), 0 1px 4px -1px rgba(44, 37, 32, 0.03)`
  - `--shadow-organic-md`: `0 8px 24px -6px rgba(44, 37, 32, 0.06), 0 2px 8px -2px rgba(44, 37, 32, 0.04)`
  - `--shadow-organic-lg`: `0 16px 40px -10px rgba(44, 37, 32, 0.08), 0 4px 16px -4px rgba(44, 37, 32, 0.04)`

- **Spring Physics & Temporal Curves:**
  - `--ease-spring-gentle`: `cubic-bezier(0.25, 1, 0.5, 1)`
  - `--ease-spring-bouncy`: `cubic-bezier(0.34, 1.56, 0.64, 1)`
  - `--duration-breathe`: `4000ms`

---

## 2. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANCHOR SCALING ROADMAP                          │
└──────┬────────────────────┬────────────────────┬───────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
【 Phase 1: Sensory UX 】 【 Phase 2: Offline & AI 】 【 Phase 3: Partner & Security 】
 • Fluid Typography Tokens• PWA Service Worker   • Sponsor Read-Only View
 • "Hold to Anchor" ritual• IndexedDB Sync Queue • Redacted PDF/CSV Export
 • Conversational Reveal  • Natural Pattern AI   • Privacy Shield Blur
 • Web Haptics & Audio    • Soft Landing Flow    • Multi-Commitment System
```

---

## Phase 1: Sensory Polish & Micro-Interactions (Immediate)

### 1.1 Morning Intention Flow: "Zero-Friction Priming"
- [ ] **Quick-Add Smart Chips:** Suggest recent and frequently used micro-actions based on commitment type (*e.g., "15m walk", "Call sponsor", "Read 10 pages"*).
- [ ] **"Hold to Anchor" Sealing Ritual:** Replace instant submit button with a 1.5-second tactile press-and-hold progress interaction with micro-vibration feedback.
- [ ] **Intention Affirmation Banner:** Soft ripple animation affirming the start of the day.

### 1.2 Evening Reflection Flow: "Conversational Pacing"
- [ ] **Single-Thought Progressive Reveal:** Display the 3 core cards (*Yes / Partially / Not today*) first; reveal subsequent reflection prompts smoothly only after selection.
- [ ] **Neutral Dignified "Not Today" State:** Ensure "Not today" retains the same warm, supportive styling as "Yes", removing any subconscious failure stigma.
- [ ] **Contextual Tag Carousel:** Categorized obstacle tags (*Time, Stress, Urges, Fatigue, Distraction*) with gentle organic chip toggles.

### 1.3 Multi-Sensory Polish
- [ ] **Micro-Haptics (Web Vibration API):** Subtle tactile ticks on chip toggles, button presses, and ritual completion.
- [ ] **Soundscape for Grounding Drawer:** Gentle singing bowl chime via Web Audio synthesizer at the completion of 4-7-8 breathing cycles (toggleable).

---

## Phase 2: Continuity, Offline-First & Pattern Insights (Short-term)

### 2.1 Offline-First Sync Architecture
- [ ] **Service Worker & Manifest Setup:** Installable PWA support with cached static assets and shell.
- [ ] **IndexedDB Local Storage Queue:** Queue check-ins locally when offline; automatically synchronize with Neon Postgres upon reconnection.
- [ ] **Network State Indicator:** Subtle, non-intrusive offline badge (*"Saved locally — will sync when connected"*).

### 2.2 Qualitative Behavioral Pattern Engine
- [ ] **Pattern Recognition Logic:** Synthesize weekly check-in tags into supportive natural language summaries:
  - *"You identified 'Time & Schedule' on 3 consecutive Fridays. Would you like to set a lighter intention for Fridays?"*
  - *"Days starting with a morning intention have an 85% follow-through rate."*
- [ ] **7-Day Trend Chart Polish:** Interactive tooltips revealing micro-actions and reflections on hover/tap.

### 2.3 Restorative Soft Landing Greetings
- [ ] Adaptive greeting copy when a check-in was missed: *"New day. Yesterday is behind us — let's anchor today."*
- [ ] Graceful 1-tap option to log a quick backfilled reflection without streak penalties.

---

## Phase 3: Ecosystem, Security & Partner Support (Medium-term)

### 3.1 Sponsor / Accountability Partner View
- [ ] **Secure Read-Only Access Token:** Generate a private, expiring access link for a sponsor, therapist, or trusted partner.
- [ ] **Granular Privacy Controls:** Allow user to choose between *High-Level Overview Only* (completion rate, touchpoints) and *Full Journal Reflection Access*.

### 3.2 Clinical & Therapy Data Export
- [ ] Export clean, beautifully formatted PDF and CSV summaries for therapy or recovery meetings.
- [ ] Summary includes mood/craving trends, obstacle breakdown, and highlighted takeaways.

### 3.3 Discreet "Privacy Shield" Mode
- [ ] One-tap top bar toggle (or double-tap screen gesture) to instantly blur commitment names and journal entries in public settings.

---

## 3. Database Schema Extensions (Drizzle Postgres)

```typescript
// Proposed schema updates in db/schema.ts for Phase 2 & 3:

// sponsor_access_tokens
export const sponsorTokens = pgTable("sponsor_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  includeJournalNotes: boolean("include_journal_notes").default(false).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// user_preferences (extended)
// - soundEnabled: boolean
// - hapticsEnabled: boolean
// - privacyShieldEnabled: boolean
```

---

## 4. Quality & Verification Checklist

- [ ] **Accessibility:** Full WCAG AAA color contrast, keyboard navigability, and screen reader announcements.
- [ ] **Performance:** Sub-100ms interaction latency, Zero Layout Shift (CLS < 0.01), and instant offline check-in caching.
- [ ] **Tone Compliance:** 100% free of shame, failure flags, red warning alerts, or punitive gamification.
