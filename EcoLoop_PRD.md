# EcoLoop — Product Requirements Document

**Version 1.0 | Gamified Carbon Footprint Tracking with Conversational AI**

---

## 1. Executive Summary & Product Vision

### 1.1 High-Level Vision

EcoLoop reimagines carbon footprint tracking as a habit loop rather than a one-time audit. Instead of asking users to fill out exhaustive forms, EcoLoop combines three pillars: frictionless conversational logging, a living visual ecosystem that mirrors the user's behavior, and a minimalist recommendation engine that surfaces a single high-impact next step at a time. The product borrows proven mechanics from habit-tracking and virtual-pet games and applies them to the climate domain, where engagement and behavior change are the primary barriers to impact.

The long-term vision is for EcoLoop to become the default "home screen" for personal sustainability — a place users check daily not out of obligation, but because their digital ecosystem reflects something they care about and want to nurture.

### 1.2 Target Audience

**Persona A: "Efficient Erin" — Eco-Conscious Tech Professional**
- Age 28-40, urban, disposable income, already recycles and considers sustainability in purchases
- Wants data-driven insight but has zero time for manual logging
- Motivated by: efficiency, seeing measurable progress, status among peers

**Persona B: "Streak Sam" — Gamification-Driven Student**
- Age 18-24, price-sensitive, highly responsive to points, streaks, and leaderboards
- Motivated by: competition, social proof, visual rewards
- Low patience for friction — app must feel like a game, not homework

**Persona C: "Overwhelmed Olivia" — Climate-Anxious Individual**
- Age 25-45, cares deeply about climate but experiences analysis paralysis from existing calculators
- Has tried carbon calculators before and abandoned them due to complexity or guilt-inducing results
- Motivated by: small, achievable wins; non-judgmental framing; clear cause-and-effect

### 1.3 Core Value Proposition

| Traditional Calculator Failure | EcoLoop Solution |
|---|---|
| Requires manual entry across 10+ categories, every time | Single natural-language chat message parsed automatically into structured activities via LLM |
| Produces a static number with no ongoing engagement loop | Living ecosystem visual updates daily; streaks and points create a return habit |
| Overwhelms users with long lists of generic tips | Surfaces exactly 1-2 personalized, high-impact swaps at a time, each with a concrete analogy and reason |

---

## 2. User Journey & Core Features (Deep Dive)

### 2.A Interactive Onboarding Survey

**User Flow**
1. Welcome screen with brief value proposition (3 short sentences max) and "Get Started" CTA
2. Step 1 of 4 — Housing: card selection (apartment / house / shared housing), heating type toggle (electric / gas / none), household-size slider (1-6+)
3. Step 2 of 4 — Transit: card selection of primary commute mode (car / bus / metro / bike / walk / WFH), weekly distance slider in km
4. Step 3 of 4 — Diet: card selection (omnivore / flexitarian / vegetarian / vegan), slider for meat meals per week
5. Step 4 of 4 — Utilities: slider for estimated monthly electricity (kWh) and water usage (liters)
6. Animated "reveal" screen showing calculated baseline footprint in kg CO2e/month with a relatable comparison, then routes to Dashboard

**Data Points Gathered**
- Housing type, heating fuel type, household size
- Primary transit mode and weekly distance
- Diet category and meat-meal frequency
- Monthly electricity (kWh) and water usage (liters)

**Product Requirements**
- Maximum 4 steps plus welcome and reveal screens — total flow under 90 seconds
- All inputs via sliders or card taps — zero free-text fields to minimize churn
- Progress bar visible at all times; back navigation allowed without losing entered data
- Edge case: if a user skips a step (where allowed), use category-average defaults and flag the estimate as "approximate" on the dashboard until updated

### 2.B Conversational AI-Tracker Interface

**User Flow**
1. User taps floating action button from any screen, opening a chat bottom-sheet
2. User types or dictates a free-text description of their day (e.g., "I took the metro to work and ate a vegan lunch, but left my AC running for 4 hours")
3. Input sent to backend parsing endpoint; UI shows a typing indicator
4. Backend returns structured activity list; UI renders each as an editable confirmation chip (category icon, description, estimated CO2e)
5. User can tap any chip to adjust quantity/unit before confirming
6. User taps "Log it" — activities are persisted, ecosystem state recalculates, points are awarded with a micro-animation

**Technical / Functional Requirements**
- Backend calls an LLM in JSON-schema / structured-output mode — response must conform exactly to the activity schema (category, subcategory, description, quantity, unit, confidence)
- Each parsed activity is mapped to a CO2e value via the emission-factor lookup table — the LLM never invents CO2e numbers directly
- If the model sets `clarificationNeeded = true` (e.g., "I drove a lot" with no distance), the UI asks a single targeted follow-up question before allowing the log to be confirmed
- Fallback: if the LLM call fails or times out, fall back to keyword-based rule matching against a static phrase library, and flag the log as "estimated"
- Edge case: multiple activities in one message must each be extracted as separate array entries with independent CO2e values
- Voice input (Web Speech API) is a P2 stretch goal feeding the same text pipeline

### 2.C Gamified Virtual Ecosystem Dashboard

**Visual Mechanics**

The centerpiece of the dashboard is an animated scene (island, forest, or small planet — island recommended for visual variety with water/sky/land elements). The scene is rendered via SVG/Framer Motion and occupies roughly 50% of the viewport height on the home screen.

**Ecosystem States**

A single `healthScore` (0-100) drives all visual states. The score is recalculated after every log and decays slightly (-2 to -5 points) for each consecutive day with zero logs.

| healthScore Range | Weather State | Visual Description |
|---|---|---|
| 80-100 | Clear | Lush, dense flora; 2-3 animated fauna; bright sky; unlocked rare assets visible |
| 60-79 | Clear | Healthy vegetation, sparser; 1 fauna animal; slightly dimmer sky |
| 40-59 | Cloudy | Neutral baseline density; light cloud cover; no fauna |
| 20-39 | Polluted | Wilting plants; grey haze overlay; drifting smog particles |
| 0-19 | Stormy | Dead/grey trees; dark storm clouds; rain animation; no fauna |

**Score Adjustment Rules**
- **+score**: logging a below-category-average activity, completing a swap, meeting a weekly goal
- **−score**: logging an above-category-average activity, missing 2+ consecutive days of logs, missing a weekly goal
- Unlocked flora/fauna assets (earned via achievements) only render when `healthScore >= 60`
- Each high-emission log triggers a brief "impact preview" animation (e.g., a small cloud puff) before the score visibly updates, reinforcing cause-and-effect

**The "Why It Changed" Transparency Engine**

Below the ecosystem canvas, a horizontally scrollable bar chart shows daily total CO2e for the last 14 days. Tapping any bar opens a bottom-sheet tooltip containing:
- The date and total CO2e for that day
- A plain-English sentence identifying the single largest contributing activity (e.g., "Your flight to Da Nang accounted for 68% of this day's footprint")
- A short explanation of why that activity category is carbon-intensive, written in conversational, non-judgmental tone

Edge case: on days with no logs, the bar is shown in a muted color with a tooltip reading "No activity logged — your ecosystem may be drifting toward neutral."

### 2.D The Minimalist "Carbon Swap" Engine

**UI Requirement**

A dedicated, uncluttered screen (and a summary card on the dashboard) showing a maximum of two swap suggestions at any time — never a scrolling list. Each suggestion is presented as a single full-width card.

**The Swap Template (strict 3-part schema, enforced for every suggestion)**
1. **The Swap** — a bolded, specific, minimal behavior change (e.g., "Swap your Tuesday beef lunch for a vegan bowl")
2. **The Real-World Analogy** — an intuitive comparison expressed in everyday terms (e.g., "Saves the equivalent of charging your phone ~750 times")
3. **The Data-Backed Reason** — exactly two sentences explaining the scientific mechanism behind the savings

**Functional Requirements**
- Swap suggestions are generated by an LLM call that takes the user's last 14 days of category-level emissions plus their baseline profile, and is constrained by prompt instruction to return at most one swap targeting the category with the largest reduction opportunity
- "Try this swap" creates a SwapAction record and an associated 7-day goal
- After 7 days, the user is prompted "How'd it go?" — marking the swap completed awards bonus points and unlocks a related achievement if applicable; marking it abandoned simply archives it and triggers generation of a new suggestion
- Fallback: if the LLM is unavailable, serve a swap from a curated static library matched by category, ensuring the feature never shows an empty state
- Edge case: do not re-suggest a swap the user marked "abandoned" for at least 30 days

### 2.E Motivation Mechanics (Points & Leaderboard)

**Gamification Loops**

| Action | Eco-Points Awarded |
|---|---|
| Daily log submitted | +10 |
| Logged activity below category daily average | +25 |
| Weekly goal met | +50 |
| Swap completed after 7-day trial | +100 |

- **Streaks**: counts consecutive days with at least one CarbonLog; resets to zero after a full day with no logs
- **Unlockable assets**: each major achievement (e.g., 7-day streak, first completed swap, healthScore reaching 80) unlocks a new flora/fauna asset added to `ecosystem.unlockedAssets`

**Social Proof — Leaderboard**
- Global leaderboard: ranks all users by weekly Eco-Points, refreshed daily, paginated
- Friend-group leaderboard: users can create/join groups via invite code; ranks group members only
- Edge case: new users (less than 7 days active) are shown in a separate "New Members" tier to avoid discouragement from established users' high totals

---

## 3. Technical Architecture & Data Schema Guidelines

### 3.1 Recommended Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) + TypeScript | SSR for fast initial load; strong ecosystem for animation libraries |
| Styling | Tailwind CSS | Rapid, consistent design-system implementation |
| Animation | Framer Motion | Smooth cross-fades between ecosystem weather states |
| Charts | Recharts | Lightweight, composable charts for trend/category views |
| Backend | Next.js API routes (or FastAPI microservice for AI parsing) | Co-located with frontend for MVP velocity; FastAPI option if Python ML tooling needed later |
| Database | PostgreSQL via Prisma ORM | Relational integrity for logs, goals, leaderboard relationships; strong query support for aggregations |
| Auth | NextAuth.js (email/password + Google OAuth) | Fast to implement, widely supported |
| AI / LLM | Anthropic Claude API with structured JSON output mode | Reliable schema-conformant parsing for activity extraction and swap generation |
| Hosting | Vercel (frontend/API) + managed Postgres (Neon/Supabase) | Low-ops MVP deployment with easy scaling path |

### 3.2 Data Model Summary

**User Profile**
- `id`, `email`, `name`, `createdAt`
- `baselineProfile` (JSON: housing, transit, diet, utilities answers)
- `baselineFootprintKgCO2e` (computed at onboarding)
- `ecoPoints`, `currentStreak`, `longestStreak`, `lastLogDate`
- Relations: `carbonLogs[]`, `goals[]`, `swapsAccepted[]`, `achievements[]`, `ecosystemState`

**Carbon Logs**
- `id`, `userId`, `rawInputText` (original chat message)
- `loggedAt` vs. `activityDate` (allows back-dating)
- `parsedActivities` (JSON array: category, subcategory, description, quantity, unit, co2eKg, confidence)
- `totalCo2eKg` (sum of all activity CO2e in this log)
- `source`: `'chat' | 'manual' | 'import'`

**Ecosystem State**
- `id`, `userId` (1:1 with User)
- `healthScore` (0-100, integer)
- `weatherState`: `'clear' | 'cloudy' | 'polluted' | 'stormy'`
- `unlockedAssets` (JSON array of asset IDs from achievements)
- `lastUpdated` (auto timestamp)

**Supporting Tables**
- `Goal`: type, targetValue, category (nullable), startDate, endDate, status
- `SwapAction`: swapTitle, analogyText, reasonText, estimatedSavingsKgCO2eWeekly, status
- `Achievement` / `UserAchievement`: code, title, description, iconAsset, unlockedAt
- `LeaderboardEntry`: userId, weeklyPoints, rank, groupId (nullable, for friend groups)

### 3.3 Emission Calculation Engine

A pure function `calculateCo2e(category, subcategory, quantity, unit)` reads from a centralized, editable config (`lib/emissionFactors.ts`) so factors can be regionalized without code changes. The LLM never generates CO2e values directly — it only extracts structured activity data, which is then passed through this deterministic function. Selected baseline factors:

| Category | Subcategory | Factor (kg CO2e) |
|---|---|---|
| Transport | Car (petrol), per km | 0.192 |
| Transport | Bus, per km | 0.105 |
| Transport | Metro/Subway, per km | 0.041 |
| Transport | Flight (short-haul), per km | 0.255 |
| Food | Beef meal | 6.61 |
| Food | Chicken meal | 1.57 |
| Food | Vegetarian meal | 0.84 |
| Food | Vegan meal | 0.59 |
| Electricity | Per kWh (grid avg) | 0.45 |
| Water | Per 100 liters | 0.34 |
| Waste | Per kg landfill | 0.58 |
| Shopping | Per $10 spent (avg goods) | 0.6 |

### 3.4 LLM Integration Contracts

**Activity Parser Endpoint**

Input: free-text user message. Output: strict JSON with an `activities` array (category, subcategory, description, quantity, unit, confidence) plus `clarificationNeeded` and `clarificationQuestion` fields. Backend maps each activity through the emission engine before persisting.

**Swap Recommendation Endpoint**

Input: user's last 14 days of category-level emissions + baseline profile. Output: strict JSON with `swapTitle`, `analogyText`, `reasonText`, `estimatedSavingsKgCO2eWeekly`, and `targetCategory`. Prompt-level constraint enforces a single suggestion targeting the highest-impact, realistically achievable category.

---

## 4. Key Performance Indicators (KPIs) & Success Metrics

### 4.1 Engagement Metrics

| Metric | Target / Definition |
|---|---|
| DAU/MAU ratio | Target ≥ 25% — indicates habitual daily use |
| Average time to log an action via chat | Target < 30 seconds from chat-open to confirmed log |
| Day 7 retention | Target ≥ 35% of new users still active 7 days post-onboarding |
| Day 30 retention | Target ≥ 18% |
| Average streak length | Tracked weekly; target median streak ≥ 4 days by week 4 |
| Swap acceptance rate | % of surfaced swaps marked "Try this swap" — target ≥ 40% |
| Swap completion rate | % of accepted swaps marked "completed" after 7 days — target ≥ 50% |

### 4.2 Environmental Impact Metrics

| Metric | Definition |
|---|---|
| Aggregate CO2e reduction | Sum of (baselineFootprintKgCO2e - current rolling 30-day average) across all active users |
| Average per-user footprint trend | Month-over-month % change in average daily logged CO2e per active user |
| Category-level reduction breakdown | % change per category (transport, food, electricity, water, shopping, waste), highlighting which swap types drive the most real-world impact |
| Goal completion rate | % of active goals marked "completed" vs. "missed" at end date |

### 4.3 Business / Product Health Metrics

- Onboarding completion rate (target ≥ 70% reach the reveal screen)
- LLM parsing fallback rate (target < 5% of chat logs require the keyword fallback)
- Leaderboard participation (% of users who view leaderboard weekly)
- Achievement unlock distribution (identify which achievements are too easy/hard and tune thresholds)