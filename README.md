# EcoLoop - Gamified Carbon Footprint Awareness Platform

> **Transform carbon tracking from a chore into a daily habit through conversational AI, living ecosystems, and personalized recommendations.**

![EcoLoop Banner](https://img.shields.io/badge/version-1.0.0-blue) ![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black) ![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)

---

## 📋 Table of Contents

1. [Vertical Overview](#vertical-overview)
2. [Core Approach & Logic](#core-approach--logic)
3. [How the Solution Works](#how-the-solution-works)
4. [Assumptions](#assumptions)
5. [Architecture](#architecture)
6. [Getting Started](#getting-started)
7. [Tech Stack](#tech-stack)
8. [Key Features](#key-features)
9. [Project Structure](#project-structure)

---

## 🌍 Vertical Overview

### Chosen Vertical: Carbon Footprint Awareness Platform

**EcoLoop** reimagines personal carbon tracking as a **habit loop** rather than a one-time calculation. Traditional carbon footprint calculators fail because they:
- Require exhaustive manual data entry
- Produce static, guilt-inducing numbers
- Offer generic, overwhelming recommendations
- Lack engagement mechanics for sustained behavior change

**EcoLoop solves this** by combining three pillars:

1. **Frictionless Conversational Logging** — Users describe their day in natural language (e.g., "Took the metro to work, had a vegan lunch"); AI parses this into structured carbon-impact data
2. **Living Visual Ecosystem** — A dynamic digital ecosystem that reflects real-time behavior, encouraging daily engagement
3. **Minimalist Recommendation Engine** — One high-impact "swap" at a time, presented with real-world analogies and science-backed reasoning

### Target Personas

| Persona | Motivation | Use Case |
|---------|-----------|----------|
| **"Efficient Erin"** — Eco-Conscious Tech Pro | Data-driven insights, efficiency, social status | Wants to track impact without friction |
| **"Streak Sam"** — Gamification-Driven Student | Points, streaks, leaderboards, visual rewards | Motivated by competition and progress |
| **"Overwhelmed Olivia"** — Climate-Anxious Individual | Small wins, non-judgmental framing, clarity | Paralyzed by traditional calculators |

---

## 🔍 Core Approach & Logic

### The Problem We're Solving

**Behavior Change Bottleneck:** Most carbon-awareness tools treat sustainability as a one-time calculation or informational exercise. Users calculate their footprint, feel guilty or overwhelmed, and abandon the tool.

**Our Solution:** EcoLoop applies proven **habit-loop mechanics** from habit-tracking and virtual-pet games to the climate domain:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE ECOLOOP HABIT CYCLE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CUE (Visual Notification)                                   │
│       ↓                                                       │
│  ROUTINE (Log daily activity via chat)                       │
│       ↓                                                       │
│  REWARD (Ecosystem updates, points, streak maintained)       │
│       ↓                                                       │
│  [Return to CUE next day]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

#### 1. **Smart Activity Parsing (AI-Powered)**
- User inputs free-text description of their day
- Google Vertex AI (Gemini) with structured output extracts structured activities
- Maps activities to **emission factor lookup table** (never hallucinated CO2e values)
- Returns editable confirmation chips for user review before logging

**Example Flow:**
```
User: "Took the metro to work and ate a vegan lunch, 
       but left my AC running for 4 hours"

AI Parser Returns:
├─ Transport: Metro, 15 km → 0.615 kg CO2e
├─ Food: Vegan meal → 0.59 kg CO2e
└─ Electricity: AC, 4 hours → ~0.9 kg CO2e
                              TOTAL: 2.1 kg CO2e
```

#### 2. **Health Score-Driven Ecosystem**
A single `healthScore` (0-100) drives all visual states:

| Score | Weather | Visual State | Fauna |
|-------|---------|--------------|-------|
| 80-100 | Clear | Lush, dense flora | 2-3 animals |
| 60-79 | Clear | Healthy vegetation | 1 animal |
| 40-59 | Cloudy | Neutral baseline | None |
| 20-39 | Polluted | Wilting plants, haze | None |
| 0-19 | Stormy | Dead trees, rain | None |

**Score Adjustments:**
- **+points**: Log below-average activity, complete a swap, meet weekly goal
- **−points**: Log above-average activity, miss 2+ consecutive days, miss goals
- **Decay**: −2 to −5 points per day with zero logs (ecosystem slowly declines)

#### 3. **The Carbon Swap Engine**
Instead of overwhelming users with 10+ tips, EcoLoop surfaces **exactly 1-2 personalized recommendations** at a time:

**Swap Template (Strict 3-Part Schema):**
```
┌──────────────────────────────────────────────────┐
│ 1. THE SWAP (Bold, specific behavior change)    │
│    "Swap your Tuesday beef lunch for a           │
│     vegan bowl"                                  │
├──────────────────────────────────────────────────┤
│ 2. REAL-WORLD ANALOGY (Intuitive comparison)    │
│    "Saves the equivalent of charging your        │
│     phone 750 times"                             │
├──────────────────────────────────────────────────┤
│ 3. DATA-BACKED REASON (2 sentences, conversational)
│    "Beef production requires 20x more land       │
│     than plant-based foods. By reducing meat     │
│     just one day per week, you'll lower your     │
│     diet's carbon intensity significantly."      │
└──────────────────────────────────────────────────┘
```

#### 4. **Gamification Loop**

| Action | Eco-Points |
|--------|-----------|
| Daily log submitted | +10 |
| Below-average activity | +25 |
| Weekly goal met | +50 |
| Swap completed (7-day trial) | +100 |

**Streaks & Achievements:**
- Consecutive daily logs = streak counter
- Major milestones unlock new ecosystem assets (flora/fauna)
- Global leaderboard for social motivation

---

## ⚙️ How the Solution Works

### End-to-End User Journey

#### **Phase 1: Onboarding (Quick Profile)**
```
Welcome → Housing → Transit → Diet → Utilities → Baseline Reveal
(1 screen)  (slider)  (distance)  (meals/week)  (kWh, liters)   (↓ in kg CO2e/month)
```

- Max 4 steps + welcome/reveal screens (~90 seconds total)
- All inputs via sliders or card selections (zero free-text friction)
- Calculates baseline monthly footprint using modal emissions factors
- **Edge case**: Skipped fields populated with category-average defaults

#### **Phase 2: Daily Logging (Conversational Chat)**

```
User logs in → Floating Action Button (FAB) → Chat Bottom-Sheet
                                              ↓
                                    User types: "Drove 40km today"
                                              ↓
                                    Backend calls Vertex AI
                                    (structured output mode)
                                              ↓
                                    Returns: [{
                                      category: "transport",
                                      subcategory: "car",
                                      quantity: 40,
                                      unit: "km",
                                      co2eKg: 7.68
                                    }]
                                              ↓
                                    UI renders editable confirmation chips
                                              ↓
                                    User taps "Log it"
                                              ↓
                                    Persisted to database,
                                    ecosystem recalculates,
                                    points awarded
```

**Fallback Mechanism:** If LLM times out, fall back to regex-based keyword matching against static phrase library (ensures feature never breaks).

#### **Phase 3: Ecosystem Visualization (Daily)**

```
Ecosystem Canvas (50% viewport height)
    ├─ Island/forest/planet scene rendered via SVG + Framer Motion
    ├─ Visual state driven by healthScore (0-100)
    └─ Updates with smooth animations after each log

Below Canvas:
    └─ 14-day bar chart (daily CO2e totals)
       └─ Tap any bar → tooltip with "Why It Changed" explanation
```

#### **Phase 4: Swap Recommendations**

```
Weekly or triggered by achievement:
    ├─ LLM analyzes last 14 days of emissions
    ├─ Identifies highest-reduction-opportunity category
    └─ Generates single swap card with 3-part template

User selects "Try this swap":
    ├─ Creates 7-day goal
    └─ After 7 days → "How'd it go?"
       ├─ Mark "Completed" → +100 points + unlock achievement
       └─ Mark "Abandoned" → Archive, generate new swap
                              (don't re-suggest for 30 days)
```

#### **Phase 5: Social Engagement (Optional)**

```
Global Leaderboard:
    └─ Weekly Eco-Points ranking
       ├─ Paginated view of all users
       └─ Refreshed daily

Weekly Digest (Email):
    ├─ Summary of weekly category totals
    ├─ Percentage reduction vs. previous week
    ├─ Celebratory tone (even if emissions increased)
    └─ One specific actionable suggestion
```

### Data Flow Architecture

```
┌─────────────────────┐
│   User Frontend     │ (React/Next.js)
│  - Chat interface  │
│  - Ecosystem canvas│
│  - Dashboard       │
└──────────┬──────────┘
           │ HTTP/JSON
           ↓
┌─────────────────────────────────────────┐
│        Next.js API Routes               │
├─────────────────────────────────────────┤
│ /api/parse-activity   → AI parsing      │
│ /api/generate-swap    → Swap engine     │
│ /api/day-insight      → Daily summary   │
│ /api/weekly-digest    → Email digest    │
│ /api/leaderboard      → Rankings        │
└──────────┬──────────────────────────────┘
           │ Vertex AI SDK / Prisma ORM
           ↓
┌────────────────────────────────────────┐
│   Google Vertex AI (Gemini 1.5 Flash)  │
│   - Activity parsing (structured JSON) │
│   - Swap generation                    │
│   - Insight generation                 │
│   - Text embeddings (for deduplication)│
└────────────────────────────────────────┘
           │
           ↓
┌────────────────────────────────────────┐
│   SQLite Database (Prisma)             │
│   - Users, profiles, baselines         │
│   - CarbonLogs (daily activities)      │
│   - EcosystemState (health score)      │
│   - SwapActions (recommendations)      │
│   - Goals, Achievements                │
│   - LeaderboardEntry                   │
└────────────────────────────────────────┘
```

### Emission Factor Lookup Table

The system uses **curated, real-world emission factors** (never generated by LLM):

```javascript
Transport:
  - Car: 0.192 kg CO2e/km
  - Bus: 0.105 kg CO2e/km
  - Metro/Subway: 0.041 kg CO2e/km
  - Flight: 0.255 kg CO2e/km

Food:
  - Beef: 6.61 kg CO2e/meal
  - Chicken: 1.57 kg CO2e/meal
  - Vegetarian: 0.84 kg CO2e/meal
  - Vegan: 0.59 kg CO2e/meal

Utilities:
  - Grid Electricity: 0.45 kg CO2e/kWh
  - Water: 0.34 kg CO2e/100L

Shopping:
  - General goods: 0.6 kg CO2e per $10 spent

Waste:
  - Landfill: 0.58 kg CO2e/kg
```

---

## 🎯 Assumptions

### User Behavior Assumptions

1. **Users will engage with conversational interfaces**
   - Assumption: Free-text chat is more intuitive than form-filling
   - Risk: Voice/accessibility support needed for broader adoption
   - Mitigation: Voice input (Web Speech API) on roadmap

2. **Visual ecosystems drive daily return visits**
   - Assumption: Users care enough about their digital ecosystem to log consistently
   - Risk: May not work for all demographics (older users, non-gaming audiences)
   - Mitigation: Alternative engagement mechanics (email streaks, notifications)

3. **One swap at a time prevents decision paralysis**
   - Assumption: Users are overwhelmed by multiple recommendations
   - Risk: May frustrate power users who want full control
   - Mitigation: "Advanced view" with full swap library (future)

### Technical Assumptions

4. **Google Vertex AI structured output is reliable**
   - Assumption: Gemini will consistently return valid JSON
   - Fallback: Regex-based keyword matching for critical features
   - Monitoring: Fallback frequency logged for observability

5. **Emission factor lookup table is stable**
   - Assumption: Scientific consensus on kg CO2e values doesn't change frequently
   - Mitigation: Annual review of factors against latest IPCC/DEFRA standards

6. **Users provide reasonably accurate descriptions**
   - Assumption: "I drove 40km" is closer to truth than random numbers
   - Risk: Gaming/accuracy abuse (e.g., logging zero emissions)
   - Mitigation: Anomaly detection on user logs; flag outliers for review

### Data & Privacy Assumptions

7. **SQLite is sufficient for initial scale**
   - Assumption: MVP handles <10k daily active users
   - Plan: Migrate to PostgreSQL at scale

8. **Users consent to activity tracking**
   - Assumption: Clear privacy policy and onboarding messaging
   - Risk: GDPR/regional compliance needed
   - Mitigation: Anonymization options, data export/deletion rights

### Business Model Assumptions

9. **Gamification sustains engagement without monetization (initially)**
   - Assumption: Streaks, points, leaderboards are sufficient motivation
   - Plan: Premium tier (advanced analytics, API access) at scale

10. **Social features (leaderboards) improve retention**
    - Assumption: Users are motivated by peer comparison
    - Risk: Toxicity or unhealthy competition
    - Mitigation: Moderation, opt-in social features

---

## 🏗️ Architecture

### Directory Structure

```
promptwars_3/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes
│   │   │   ├── auth/         # NextAuth routes
│   │   │   ├── parse-activity/
│   │   │   ├── generate-swap/
│   │   │   ├── day-insight/
│   │   │   ├── weekly-digest/
│   │   │   └── leaderboard/
│   │   ├── dashboard/        # Main app screen
│   │   ├── login/
│   │   ├── register/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── EcosystemCanvas.tsx   # SVG ecosystem visualization
│   │   ├── ChatDrawer.tsx        # Chat input interface
│   │   ├── SwapCard.tsx          # Recommendation cards
│   │   ├── WeeklyChart.tsx       # 14-day chart
│   │   ├── Sidebar.tsx           # Navigation
│   │   └── ...
│   └── lib/
│       ├── ai.ts            # Vertex AI wrapper & prompts
│       ├── db.ts            # Prisma client & queries
│       ├── emissionFactors.ts  # Lookup tables
│       ├── ecosystem.ts      # Health score logic
│       └── fallbackParser.ts # Regex fallback
├── prisma/
│   └── schema.prisma        # Database schema
├── package.json
├── tsconfig.json
├── .gitignore
└── EcoLoop_PRD.md           # Full product specification
```

### Key API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/parse-activity` | POST | Parse user input → structured activities |
| `/api/generate-swap` | POST | Generate personalized swap recommendation |
| `/api/day-insight` | GET | Get insight for specific day |
| `/api/weekly-digest` | POST | Generate weekly summary email |
| `/api/leaderboard` | GET | Fetch paginated rankings |
| `/api/user/log` | POST | Save carbon log |
| `/api/user/goal` | POST/PUT | Create/update goals |
| `/api/user/swap` | GET | Get user's active swaps |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Google Cloud Project** with Vertex AI enabled
- Environment variables configured (see below)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Nav0711/promptwars_3.git
   cd promptwars_3
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   DATABASE_URL="file:./dev.db"
   GOOGLE_CLOUD_PROJECT="your-project-id"
   GOOGLE_CLOUD_LOCATION="us-central1"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Initialize database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Next.js 16, TypeScript | UI framework, routing, SSR |
| **Styling** | Tailwind CSS 4, PostCSS | Utility-first CSS |
| **Animation** | Framer Motion 11 | Ecosystem canvas, transitions |
| **Charts** | Recharts 2 | 14-day emissions bar chart |
| **Icons** | Lucide React | UI icons |
| **AI/ML** | Google Vertex AI (Gemini 1.5 Flash) | LLM parsing, generation, embeddings |
| **Database** | SQLite (dev), PostgreSQL (prod) | Persistent data storage |
| **ORM** | Prisma 5 | Type-safe database queries |
| **Auth** | NextAuth 4 | User authentication |
| **Security** | bcryptjs | Password hashing |
| **Linting** | ESLint 9 | Code quality |

---

## 🎨 Key Features

### ✅ Implemented

- [x] User registration & authentication (NextAuth)
- [x] Interactive onboarding survey (4-step)
- [x] Baseline carbon footprint calculation
- [x] Conversational activity logging (AI-powered)
- [x] Structured activity parsing with fallback
- [x] Living ecosystem visualization
- [x] Health score calculation & decay logic
- [x] 14-day emissions history chart
- [x] Carbon swap recommendation engine
- [x] Gamification (points, streaks, achievements)
- [x] Global leaderboard
- [x] Database schema & migrations

### 🚧 Roadmap

- [ ] Voice input support (Web Speech API)
- [ ] Weekly digest email (automated)
- [ ] Advanced analytics dashboard
- [ ] Social sharing & challenges
- [ ] Mobile app (React Native)
- [ ] Data import (fitness trackers, smart home devices)
- [ ] Premium tier (detailed insights, API access)
- [ ] Carbon offset marketplace integration

---

## 📊 Database Schema

**Key Models:**
- **User**: Auth, baseline profile, points, streak tracking
- **CarbonLog**: Raw user input, parsed activities, total CO2e
- **EcosystemState**: Health score, weather, unlocked assets
- **Goal**: Weekly/monthly reduction targets, status tracking
- **SwapAction**: Recommended swaps, trial period (7 days), completion status
- **Achievement**: Unlockable badges (STREAK_7, FIRST_SWAP, etc.)
- **LeaderboardEntry**: Weekly eco-points rankings

See `prisma/schema.prisma` for full details.

---

## 🔒 Safety & Tone

All AI responses are generated with:
- **Safety settings**: Block harassment, hate speech
- **Supportive tone**: Never guilt-inducing or judgmental
- **Conversational language**: Avoid technical jargon
- **Real-world analogies**: Make science relatable (e.g., "equivalent to driving X km")

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Questions

For questions or feedback:
- Open an issue on [GitHub](https://github.com/Nav0711/promptwars_3/issues)
- Check the [EcoLoop PRD](EcoLoop_PRD.md) for full product specification
- Review the API documentation in individual route files

---

**Built with ❤️ for a sustainable future.**
