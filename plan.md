# Anchor — Mindful Accountability & Recovery Platform
## Product Design Analysis, Navigation Overhaul & Implementation Specification

> **Status:** APPROVED FOR IMPLEMENTATION — Product Design Review
> **Core Ethos:** _"Accountability without shame. Privacy without compromise. Design that breathes."_
> **Focus:** Information Architecture (IA), Persistent Identity, Top Header Simplification & Main Nav Optimization

---

## 1. Executive Product Design Analysis

### The Problem Space
In personal recovery and daily mindfulness, cognitive friction directly translates into user churn and missed check-ins. Every unneeded icon, ambiguous button, or misplaced tab adds cognitive load to an already vulnerable user state.

Following visual audits of the active application (specifically the `/today` and `/settings` surfaces on mobile and desktop viewports), three critical information architecture and UX flaws were identified:

| User Feedback / Complaint | Current Implementation Flaw | Root Design Cause |
|---|---|---|
| **1. "User profile should be at the top of the screen always and lead to settings"** | Profile text (`userName` / `userEmail`) is hidden on mobile (`hidden md:inline-block`) with zero visual identity. Settings is relegated to a bottom tab. | Misplaced mental model: identity is a primary anchor, while settings is an administrative destination that should be tied to identity, not taking up primary thumb-space. |
| **2. "Community should be a tab on the main navigation"** | "Community Moments Wall" is buried inside `/settings` behind a scroll, invisible to users who don't venture into settings. | Buried core value proposition: Community solidarity is essential for recovery/accountability ("I am not alone"), but was treated as an auxiliary setting rather than a primary destination. |
| **3. "The two icons on the header shouldn't be there IMO"** | Header displays an ambiguous Eye (privacy mode toggle) and a Sign-Out (door) icon on every screen. | Anti-pattern: High-anxiety and destructive actions (sign-out) and cryptic toggles (eye icon) placed in prime visual real estate. Sign-out signals impermanence and risks accidental logouts. |

---

## 2. Information Architecture (IA) Overhaul

### Before: Fragmented & Anxious
```
TOP HEADER:
[Anchor Logo + "Anchor"] ────────────────── [ Eye Icon ] [ Sign Out Icon ]
                                               └─ Cryptic    └─ High anxiety

PAGE BODY

BOTTOM NAVIGATION:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    Today     │   Journal    │   Progress   │   Settings   │
└──────────────┴──────────────┴──────────────┴──────────────┘
                                                    │
                                  Houses Community Moments Wall (Buried)
```

### After: Calm, Cohesive & Human-Centered
```
TOP HEADER (Persistent on all screens):
[Anchor Logo + "Anchor"] ────────────────── [ Profile Avatar (Z) ]
  (Home/Daily Reset)                           └─ Leads directly to /settings
                                                  (Displays initial, active indicator)

PAGE BODY

BOTTOM NAVIGATION (4 Core Experience Pillars):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    Today     │   Journal    │   Progress   │  Community   │
│  (Check-in)  │ (Reflect)    │   (Growth)   │ (Solidarity) │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 3. Detailed UX & Architectural Fixes

### Fix 1: Persistent Top-Right User Profile (Avatar)
- **Visual Design**:
  - 36px circular avatar button placed in the top right of the persistent header on **all screen viewports** (mobile, tablet, desktop).
  - Background: Organic warm terracotta/ochre tint (`bg-[#F9EBE7] dark:bg-[#38251F]`) with crisp typography (`text-[#C86D51] dark:text-[#DB8165] font-semibold text-xs sm:text-sm`).
  - Fallback logic: Derived from user's name first initial, user's email first initial, or calm default `"A"` (Anchor) or `"U"` (User).
  - Sits inside a subtle tactile border (`border border-[#EAE3D7] dark:border-[#38332E]`).
  - Tactile micro-interaction: subtle spring tap animation (`whileTap={{ scale: 0.92 }}`) and soft haptic feedback (`triggerHaptic(10)`).
- **Navigation Behavior**:
  - Directly navigates to `/settings`.
  - When the user is currently on `/settings`, the profile avatar shows an active ring (`ring-2 ring-[#C86D51]/60 dark:ring-[#DB8165]/60 ring-offset-2 ring-offset-[#FAF7F2] dark:ring-offset-[#1C1917]`).
  - Tooltip on desktop hover: `"Account & Settings"`.

### Fix 2: Promoting Community to Main Navigation
- **Navigation Tab Order**:
  1. **Today (`/today`)**: Daily grounding, morning intention, evening reflection, daily anchor action.
  2. **Journal (`/journal`)**: Spontaneous freeform reflection, emotional tagging, personal journal log.
  3. **Progress (`/progress`)**: Reflection timeline, anti-shame streaks, mood trends, milestone celebrations.
  4. **Community (`/community`)**: Anonymous Community Moments Wall, gentle resonance ("Care/Heart"), filter by focus category, vulnerability without comparison or toxic social algorithms.
- **Iconography**:
  - Phosphor icon: `<UsersThree />` or `<Users />` (matching existing design system tokens).
- **Settings Page Cleanup**:
  - The redundant `Community Moments Wall` promo card at the top of `/settings` is removed or simplified into a subtle secondary link, eliminating IA redundancy and streamlining the settings screen.

### Fix 3: De-cluttering the Top Header
- **Remove from Header**:
  - Remove `Eye` / `EyeSlash` toggle button.
  - Remove `SignOut` button.
  - Remove redundant raw email text label.
- **Relocated Destinations**:
  1. **Privacy Shield Mode**:
     - Relocated to `/settings` under a dedicated **"Discretion & Privacy"** card.
     - Includes a clear toggle switch with descriptive microcopy: _"Blur sensitive journal reflections and intentions in public spaces."_
     - Optional quick gesture: Desktop keyboard shortcut (`Cmd/Ctrl + Shift + P`) or double-tap on header logo for power users.
  2. **Sign Out**:
     - Relocated exclusively to `/settings` at the bottom of the page under **"Account & Session"**.
     - Clear, intentional red/warm styled button with confirmation state to prevent accidental sign-outs.

---

## 4. Component Specification & File Changes

### 1. `app/components/Navigation.tsx`
- **Updates**:
  - Replace `NAV_ITEMS`:
    ```typescript
    const NAV_ITEMS = [
      { href: "/today", label: "Today", icon: CalendarBlank },
      { href: "/journal", label: "Journal", icon: BookOpen },
      { href: "/progress", label: "Progress", icon: ChartBar },
      { href: "/community", label: "Community", icon: UsersThree },
    ];
    ```
  - Remove header `Eye` / `EyeSlash` button and `SignOut` button.
  - Add persistent `UserProfileButton` in header linking to `/settings`:
    - Reads `userName` and `userEmail` props.
    - Computes user initial (e.g. `user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"`).
    - Renders an accessible, tactile avatar button with active state highlighting when `pathname === "/settings"`.
    - Retains smooth layout pill on desktop and fluid spring tabs on mobile.

### 2. `app/settings/page.tsx`
- **Updates**:
  - Remove the prominent `Community Moments Wall` hero card (since Community is now a 1st-class bottom/desktop tab).
  - Add **Discretion & Privacy** section containing the `Privacy Blur` toggle with clear plain-language description.
  - Ensure the **Sign Out** button at the bottom of the settings screen is distinct, tactile, and well-positioned in the account management section.

### 3. `app/today/page.tsx`, `app/journal/page.tsx`, `app/progress/page.tsx`, `app/community/page.tsx`
- **Updates**:
  - Verify all top-level page components pass user session props (`userName`, `userEmail`) to `<Navigation />` so the header avatar displays the user's authentic initial across all screens.

---

## 5. Implementation Steps

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                           │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Update NAV_ITEMS & Navigation Component                       │
│          - Add UsersThree icon, replace Settings with Community        │
│          - Strip Eye & SignOut icons from header                       │
│          - Add persistent User Profile avatar with /settings link     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Refactor Settings Page                                        │
│          - Remove duplicate Community card                             │
│          - Add Privacy Blur toggle in settings                         │
│          - Polish Account & Sign Out section at bottom of settings     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Session & Prop Propagation                                    │
│          - Ensure Navigation receives user info across all pages       │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Verification & Polish                                         │
│          - Verify mobile bottom navigation responsiveness              │
│          - Verify desktop top header alignment                         │
│          - Test /settings navigation from avatar                       │
│          - Test /community navigation from bottom tab                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Success Metrics & Design Verification

1. **Cognitive Calm**: Clean header with only Logo (left) and Profile Avatar (right). Zero unneeded icon buttons.
2. **Thumb-Zone Optimization**: Bottom navigation consists purely of the 4 core day-to-day engagement surfaces (Today, Journal, Progress, Community).
3. **Accessibility**: Touch targets for avatar and bottom tabs strictly meet >= 44x44px guidelines.
4. **Information Architecture Clarity**: Settings is correctly positioned as an identity/configuration destination reached via the profile avatar.
