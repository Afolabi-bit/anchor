# Anchor — Mindful Accountability & Recovery Platform

## Product Specification & Phased Implementation Plan (Revised for Accuracy)

> **Status:** DRAFT — under review
> **Core Ethos:** _"Accountability without shame. Privacy without compromise. Design that breathes."_
> **Revision note:** This version corrects technical and evidentiary claims from the prior draft — see the "What Changed" section at the end for a full list of edits and why they were made.

---

## 1. Executive Summary & Vision Alignment

Recovery and personal accountability are among the most vulnerable, high-stakes journeys a person can undertake. Existing habit trackers fail recovery users in three consistent ways:

1. **The Gamification Trap:** Streak breaks trigger shame and app abandonment ("I broke my 40-day streak, so I might as well relapse").
2. **The Privacy Gap:** Sensitive mental health, substance-use, and journal content is often stored with minimal protection, and users have limited insight into who could access it — employers, data brokers, or in a worst case, legal subpoena.
3. **Cognitive & Visual Clutter:** Dense dashboards, wizards, and clinical-sounding jargon add friction and anxiety to an already difficult moment.

**Anchor's position:** Anchor is not a habit tracker; it's a calm, privacy-respecting space for daily reflection and accountability. It combines harm-reduction-informed design, strong (not absolute) data protection, non-punitive milestone framing, and a warm, tactile, human-centered interface.

**A note on framing:** This document avoids two categories of claim that the previous draft made without sufficient grounding: (1) unqualified security guarantees like "zero-knowledge" or "mathematically unreadable," which imply a level of cryptographic assurance this architecture does not fully deliver; and (2) "clinical" language for features that have not involved any clinical validation. Both are corrected below, with an explanation of what's actually being built instead.

---

## 2. Product Pillars

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANCHOR PRODUCT PILLARS                            │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. RESPECTED DATA     │ 2. RECOVERY-FIRST    │ 3. SENSORY CRAFT              │
│    Field-level        │    Reflection-based  │    Tactile haptics, purposeful│
│    encryption, opt-in │    milestones, honest│    micro-animations, tailored │
│    sharing, plain-    │    pattern surfacing,│    typography, warm human     │
│    language privacy   │    honest summaries  │    microcopy & adaptive tone  │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 3. Detailed Feature Specifications

### Pillar I: Journaling, Data Protection & Honest Privacy

#### 1.1 Direct Daily Journaling Engine

- **Current state:** The Journal page is primarily a historical viewer for morning/evening check-in snippets. Users can't open the app and write a spontaneous, freeform entry.
- **Specification:**
  - **Inline "Freeform Daily Entry":** A prominent, calm prompt (`"What's on your mind right now?"`) directly on `/journal` and `/today`.
  - **Multi-modal input:** Rich text reflection, optional guided prompts (_"What felt hard today?"_, _"What helped you feel grounded?"_), and optional voice dictation via the browser's `Web Speech API` (note: not all browsers support this — needs a text-only fallback).
  - **Tagging & mood context:** Custom tags (e.g. `#urge`, `#therapy-notes`, `#family`) and a mood score attached to the entry.
  - **Auto-save & draft state:** Local draft persistence with a subtle _"Saved"_ indicator, so a reflection is never lost to a dropped connection.

#### 1.2 Field-Level Encryption for Sensitive Free-Text Content

- **Problem:** Substance-use notes, relapse reflections, and journal entries are sensitive and worth protecting beyond standard database security.
- **What we are actually building:** Encryption of specific free-text fields (`journal_entries.body`, `check_ins.reflection`, `check_ins.intention_note`) so that this content is not stored as plaintext in the database. This is **field-level encryption, not a zero-knowledge system** — the two are different guarantees, and it matters which one we claim publicly:
  - A true zero-knowledge architecture means the server can never derive anything from the data, even in aggregate. Anchor's insights engine (mood trends, trigger correlation) needs to read mood scores and blocker tags server-side to generate those features, so the system as a whole is **not** zero-knowledge. Only the free-text fields listed above get this protection.
  - We will describe this accurately in-product as _"your written reflections are encrypted and unreadable to us"_ — not as a blanket "zero-knowledge" claim covering the whole app.
- **Key management — two options, needs a decision before Phase 2 starts:**
  - **Option A (recommended starting point): Server-managed encryption via a KMS** (e.g. AWS KMS, or Neon's own encryption-at-rest plus an application-layer key stored in a secrets manager). This protects against database leaks and most unauthorized access, without any risk of a user permanently losing their data if they forget a password. This is the safer default for a recovery app, where the user base may already be in a vulnerable state and where permanent data loss could itself cause harm.
  - **Option B (client-held key, higher protection, higher risk):** A passphrase-derived key that never leaves the client, using the Web Crypto API's `SubtleCrypto` with **PBKDF2** (which has native, well-supported browser implementation — Argon2id, mentioned in the prior draft, requires a WASM library and adds bundle size and complexity, so it should be treated as a possible future upgrade, not an assumed default). This gives stronger protection against a database breach or subpoena, but if a user loses their passphrase and recovery phrase, **the data is permanently and unrecoverably lost.** For a recovery app, someone losing months of reflection at a fragile moment because they misplaced a 12-word phrase is a real harm, not just a UX inconvenience.
  - **Recommendation:** Ship Option A first. Treat Option B as an opt-in "advanced privacy mode" later, with very clear, repeated warnings about irreversible data loss before a user enables it — not the default for all users.

#### 1.3 Granular, Default-Zero Sponsor & Partner Sharing

- **Problem:** Apps that share everything with an accountability partner by default cause users to self-censor or avoid honest logging out of fear of disappointing that partner.
- **Specification:**
  - **Default-zero sharing:** When inviting a sponsor, partner, or therapist, nothing is shared until the user explicitly turns it on.
  - **Granular permissions**, each off by default:
    - `[ ]` Check-in completion status
    - `[ ]` Milestone/days-anchored count
    - `[ ]` Mood trend (aggregate, not entry text)
    - `[ ]` Blocker/trigger categories
    - `[ ]` Journal reflections and intention notes — kept off by default even after other sharing is enabled, since this is the most sensitive content
  - **Time-bound, revocable partner links:** Tokens expire after a set window (e.g. 30/90 days) and can be revoked instantly from settings.

#### 1.4 Plain-Language Privacy Explanation

- A dedicated `/privacy` page and in-app drawer, written in plain language, that accurately describes:
  - **What is encrypted:** the specific free-text fields listed in 1.2, and how (KMS-managed by default, with the tradeoffs of any future client-key option explained honestly).
  - **What is not encrypted:** structured data like mood scores, tags, and check-in status, which the app needs to generate insights — stated plainly rather than glossed over.
  - **No ad trackers, no data brokers:** a clear commitment to no third-party marketing SDKs or ad pixels.
  - **Legal requests:** an honest statement of what Anchor can and cannot produce if legally compelled, based on the actual encryption model chosen — not an overstated "we have nothing to give them" claim unless that's literally true for every field being described.

---

### Pillar II: Reflection, Mood Tracking & Pattern Surfacing

#### 2.1 Daily Mood Log & Visual Timeline

- **Two-dimensional mood model (valence and energy):** a simple, well-established framework (the "circumplex model of affect" is one academic version of this, though our implementation is a simplified, non-clinical version of the idea) — valence from unpleasant to pleasant, energy from low to high.
- One-tap mood logging on `/today` and `/journal`.
- **Mood timeline chart:** 7/30/90-day views showing self-reported mood over time, overlaid with check-in completion to let users notice their own patterns — presented as a personal reflection tool, not a diagnostic one.

#### 2.2 Reflection-Framed Milestones (Anti-Shame Streaks)

- **Philosophy:** Move away from "don't break the streak or you're back to zero," which research on habit apps and clinical literature on shame both associate with disengagement and, in recovery contexts specifically, with worse outcomes after a lapse. Frame progress as accumulated experience instead.
- **Milestone architecture:** 24 hours, 7 days, 30 days, 60 days, 90 days, 6 months, 1 year.
- **On reaching a milestone:** a quiet reflection prompt (_"What's one thing you've learned about yourself in these 30 days?"_), not just a celebratory animation.
- **On a setback:** compassionate, honest framing — _"This doesn't erase the last 45 days. Take a breath, and start again whenever you're ready."_ No claims about "neural rewiring" or other physiological effects unless we can point to real evidence for the specific claim being made.

#### 2.3 Pattern & Trigger Surfacing (Not a "Clinical" or "AI" Insights Engine)

- **What this is:** Simple, transparent correlation of the user's own logged blocker tags (stress, isolation, fatigue, schedule disruption, conflict) against time-of-day, day-of-week, and mood dips — computed with straightforward statistics on the user's own data.
- **What this is not:** This should not be marketed or labeled as clinical, diagnostic, or AI-driven insight. A few weeks of one person's self-reported data is not a statistically robust basis for confident claims, and presenting it with clinical-sounding language risks the user (or a therapist reading a shared summary) over-trusting a pattern that may just be noise.
- **How it should be presented:** framed as an observation for the user to consider, not a conclusion — e.g. _"You've logged 'stress' as a blocker on 3 of the last 4 Friday evenings. Want to try scheduling a check-in reminder earlier that day?"_ — always phrased as a possibility to explore, with an easy way to dismiss it if it doesn't resonate.

#### 2.4 Sponsor / Therapist Summary Export

- A plain **progress summary** (not labeled "clinical") that a user can generate and share: check-in consistency, milestone status, mood trend, and blocker categories.
- Journal text is excluded by default and only included if the user explicitly opts in for that specific export.
- The exported document should include a brief note that this is self-reported data from the app, not a clinical assessment — so a therapist or sponsor reading it understands its limits.

---

### Pillar III: Frictionless Onboarding & Try-Before-Commit

#### 3.1 Low-Commitment Onboarding

- **Screen 1 — Intention:** select or type a primary focus (e.g. "Sobriety & recovery," "Rest," "Focus").
- **Screen 2 — Check-in preview:** let the user try an actual check-in step right away, with a gentle haptic pulse, so they understand what the daily check-in feels like before committing to an account.
- **Screen 3 — Schedule & privacy:** choose morning/evening times, and a short, honest explanation of what an account does (sync across devices) and what's protected (per section 1.4).

#### 3.2 Guest Mode

- Let first-time users try check-ins before creating an account, stored locally (`localStorage` or IndexedDB) in an ephemeral session.
- Prompt to save: _"Your progress is on this device only right now. Create an account to keep it and sync across devices."_ — clear that guest data is not yet backed up, so nothing is lost by surprise if they clear their browser.

---

### Pillar IV: Aesthetic Craft & Sensory Design

#### 4.1 Design System & Tokens

- **Palette:** Terracotta (`#C86D51`), Sage (`#658B70`), Warm Ochre (`#B88452`); background `#FAF7F2` (light) / `#1C1917` (dark); elevated surfaces `#FFFFFF` / `#25221F` with soft borders `#EAE3D7` / `#38332E`.
- **Typography:** a warm humanist sans (e.g. `Plus Jakarta Sans` or `Outfit`) for body text, paired with a reflective serif (e.g. `Fraunces` or `Lora`) for headings.
- **Spacing:** a strict 4px-based scale (4, 8, 12, 16, 24, 32, 48, 64) applied consistently.

#### 4.2 Tactile & Audio Feedback

- **Haptics** (`navigator.vibrate`, where supported — note this API has inconsistent support across iOS Safari and needs a graceful no-op fallback): short pulses for selection, a slightly longer settle pattern when an intention is confirmed.
- **Optional calming tone on completion:** a soft, pleasant chime or tone. This should be described simply as a calming sound — we should not attach specific-frequency healing claims (e.g. "432Hz" or "528Hz") to it, since there's no credible evidence that particular audio frequencies have therapeutic effects, and claiming otherwise could undermine trust with users or professionals who look into it.

#### 4.3 Purposeful Micro-Animations

- Check-ins settle into place rather than snapping away instantly (e.g. via `framer-motion`), with moderate, natural-feeling spring physics — not bouncy or playful, in keeping with the calmer tone.

#### 4.4 Intentional Empty States

- No blank dead ends. First-time journal view: a simple, warm illustration with a welcoming, non-prescriptive prompt (_"This is where your reflections will live. Start whenever you're ready."_).
- Empty search results: _"No entries match that search."_ — clear and calm, not overly poetic to the point of feeling evasive.

#### 4.5 Human Microcopy

- Avoid system jargon: prefer _"Save reflection"_ over _"Submit"_; _"That didn't save — want to try again?"_ over _"Error 404."_
- Avoid unearned claims in copy — no "neural rewiring," no implied clinical authority, no absolute promises ("your data is 100% safe") that a security review hasn't verified.

#### 4.6 Light Customization

- Theme options (e.g. Warm Linen, Dark Stone, Sage, Terracotta accent).
- Notification tone selection, including a silent/haptic-only option.

---

## 4. Database Schema (Revised)

```typescript
// journal_entries: sensitive free-text is encrypted; mood/tags remain
// plaintext/structured so the pattern-surfacing feature can read them.
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  title: varchar("title", { length: 255 }),
  encryptedContent: text("encrypted_content").notNull(), // ciphertext, see 1.2
  encryptionIv: varchar("encryption_iv", { length: 64 }).notNull(),
  encryptionKeyVersion: varchar("encryption_key_version", {
    length: 32,
  }).notNull(), // supports future key rotation / Option A→B migration
  moodValence: integer("mood_valence"), // -5 to 5, plaintext by design (see 2.1/2.3)
  moodEnergy: integer("mood_energy"), // 1 to 5, plaintext by design
  tags: jsonb("tags").$type<string[]>(),
  isStarred: boolean("is_starred").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// partner_permissions: default-zero sharing, journal notes locked separately
export const partnerPermissions = pgTable("partner_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  partnerEmail: varchar("partner_email", { length: 255 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  shareConsistency: boolean("share_consistency").default(false).notNull(),
  shareMilestones: boolean("share_milestones").default(false).notNull(),
  shareMoodTrends: boolean("share_mood_trends").default(false).notNull(),
  shareBlockers: boolean("share_blockers").default(false).notNull(),
  shareJournalNotes: boolean("share_journal_notes").default(false).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Additions to users table:
// - themePreference: varchar("theme_preference", { length: 32 }).default("warm-linen")
// - chimeTone: varchar("chime_tone", { length: 32 }).default("soft-chime") // no frequency-specific naming
// - encryptionMode: varchar("encryption_mode", { length: 16 }).default("server-managed") // "server-managed" | "client-key", see 1.2
```

---

## 5. Phased Roadmap (Resequenced)

The prior draft bundled encryption architecture, a pattern-insights engine, onboarding, sensory design, and export into a single "v2" milestone. Given that the core daily check-in loop hasn't yet been validated with real users, this revision separates low-risk, high-value work (Phase 1) from higher-risk architectural decisions (Phases 2–3) that deserve their own review before committing engineering time.

### Phase 1 — Journaling & Microcopy (low risk, ship first)

- [ ] Build the freeform daily journal entry (1.1) on `/journal` and `/today`
- [ ] Add intentional empty states (4.4)
- [ ] Audit and rewrite user-facing copy across the app per the microcopy guidelines (4.5)
- [ ] Add mood logging (2.1) — plaintext, simple two-dimensional model

### Phase 2 — Data Protection (needs a decision before starting)

- [ ] **Decision required:** confirm Option A (server-managed/KMS) vs. Option B (client-held key) per section 1.2, including sign-off on the data-loss tradeoff if B is pursued
- [ ] Implement field-level encryption for the fields listed in 1.2 using the chosen approach
- [ ] Build the granular sharing permissions matrix (1.3) in `/settings`, default-zero
- [ ] Write the accurate `/privacy` page (1.4) — reviewed against what's actually implemented before publishing

### Phase 3 — Pattern Surfacing & Summaries

- [ ] Build the mood timeline chart (2.1)
- [ ] Build trigger/blocker pattern surfacing (2.3), with non-clinical, dismissible framing
- [ ] Build the sponsor/therapist progress summary export (2.4), with journal text excluded by default

### Phase 4 — Onboarding & Sensory Polish

- [ ] Build the 3-screen onboarding flow with live check-in preview (3.1)
- [ ] Add Guest Mode (3.2)
- [ ] Add haptics and calming audio feedback (4.2), with tested fallbacks for unsupported browsers
- [ ] Add theme/chime customization (4.6)

### Phase 5 — Verification

- [ ] End-to-end testing across the actual target platform(s) (confirm web/PWA vs. native scope before this phase)
- [ ] If Option B encryption was built: independent verification that ciphertext is unreadable without the client key, plus a clear, tested account-recovery/data-loss user flow
- [ ] If Option A was built: confirm KMS access controls and key rotation are configured correctly

---

## 6. Success Metrics

1. **Speed:** morning check-in completable in well under a minute; evening reflection in under a minute for a simple entry (specific targets should come from real user testing, not assumed).
2. **Data protection:** 100% of the specific free-text fields listed in 1.2 encrypted per the chosen key-management approach; privacy page accurately reflects what's implemented.
3. **Retention & shame-free return:** weekly active reflection rate, and the percentage of users who return within 48 hours of a missed day — a more meaningful signal than raw streak length.
4. **Craft consistency:** design tokens applied consistently; no unsupported claims (frequency healing, "clinical," "zero-knowledge") appearing in shipped copy.

---

## 7. What Changed From the Prior Draft (and Why)

| Prior draft                                                                  | This revision                                                                                              | Why                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Zero-knowledge encryption," "mathematically unreadable"                     | "Field-level encryption" for specific free-text fields only                                                | The insights engine needs server-readable mood/tag data, so the system as a whole isn't zero-knowledge — the claim overstated the actual guarantee                |
| Client-held passphrase key as the default                                    | Server-managed (KMS) encryption as the default; client-held key offered later as an opt-in "advanced" mode | A forgotten passphrase means permanent, unrecoverable data loss — too risky as a default for a recovery app's user base                                           |
| "PBKDF2 / Argon2id" listed interchangeably                                   | PBKDF2 specified for now, Argon2id flagged as a future option requiring a WASM library                     | They aren't interchangeable; the prior draft didn't acknowledge the added complexity Argon2id requires in-browser                                                 |
| "432Hz / 528Hz singing bowl" tones marketed for their frequency              | Described plainly as a "calming tone," no frequency-based claims                                           | No credible evidence supports specific-frequency healing effects; the claim risked undermining trust                                                              |
| "Clinical progress brief," "Clinical & Sponsor Recap Reports," "AI insights" | "Progress summary," "pattern surfacing" — explicitly framed as self-reported and non-diagnostic            | No clinical validation has occurred; labeling it "clinical" implies a rigor and authority it doesn't have                                                         |
| "Neural rewiring" language on milestone loss                                 | Removed; replaced with plain, honest reassurance                                                           | Unsupported physiological claim not needed to convey the same compassionate message                                                                               |
| Five major workstreams bundled into one "v2" milestone                       | Resequenced into 5 phases, with encryption/insights gated behind explicit decisions and review             | The prior sequencing risked significant engineering investment in architecture (encryption, insights) before the core check-in loop was validated with real users |
