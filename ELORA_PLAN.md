# Elora Statistics Dashboard — Implementation Plan

## Architecture Overview
Add an `/elora` section to stockwise-stats mirroring the pattern of `/stockwise` and `/letterlock`. Dark slate tech-dashboard aesthetic with glass morphism, gradient accents, smooth animations. Mobile-first, desktop-friendly.

---

## Pages & Routes

### 1. `/elora` — Main Dashboard
**Layout:** Full-width dark background, centered content max-w-7xl.

#### A. AI Insights Banner (top center)
- Full-width glass card with subtle gradient border (emerald/teal)
- Pulsing glow animation on the left accent bar
- Auto-rotating carousel of AI-generated weekly insights
- Expandable to show more insights

#### B. Top 10 Users Table
- Glass card with "Top Users" header
- Expand icon in header → navigates to `/elora/users`
- Columns: #, User ID (clickable → `/elora/users/[id]`), Last Entry Date, Total Entries
- Alternating row opacity, hover glow effect
- Entry count has mini inline bar visualization

#### C. Entry Activity Chart (Bar Chart)
- Two grouped bars: "This Week" and "This Month"
- Each bar actually has 2 sub-bars: current period (solid) + prior period (translucent)
- Below bars: total counts + percentage change (green/red)
- Values animate in on scroll/load

#### D. Chat Messages Chart (Bar Chart)
- Same layout as Entry Activity
- Shows user-sent messages only (role='user')
- Week vs prior week, month vs prior month

#### E. Active Chat Users Chart (Bar Chart)
- Same layout
- Counts unique users who sent ≥1 message in each period

### 2. `/elora/users` — Full Users Table
- Same dark theme
- Top 100 users, paginated (Next/Prev, page numbers)
- Same columns as dashboard table with entry count bar visualization
- Clickable user IDs

### 3. `/elora/users/[userId]` — User Profile
**Persistent Header Bar:** Join date, total entries, total messages, last active date. This stays visible across sub-views.

**Two Tab/Section Layout:**

#### A. Entries Tab (default)
- Table: Emoji, Title, Date, Word Count
- Click row → modal with full entry content (styled dark card)
- Modal: backdrop blur, slide-up animation, close button
- Paginated if > 20 entries

#### B. Profile Tab
- **Summary View:** Cards showing counts of each top-level category (events: 3, people: 12, topics: 5, etc.)
- Expand icon → opens full profile view (inline state toggle, not separate route)
- **Full Profile View:** Each category as a collapsible accordion section
  - Capitalized category name with count badge
  - Expanded: each entity shown as a styled card with its properties
  - People: show relation, location, notes (sorted by most recent note)
  - Topics: show entries grouped under that topic
  - Values: icon indicating Conflicted/Supported/Affirmed/Deepened
  - Claims: show the claim text and entry references
  - Emotions: show with intensity/color indicators
  - Commitments: show with progress indicators
  - Milestones: show with highlight styling

---

## Netlify Functions

### `functions/elora-dashboard-read.ts`
```
GET /api/elora-dashboard-read
```
Returns:
```json
{
  "topUsers": [{ user_id, latest_created_at, total_entry_count }],  // top 10
  "entries": {
    "thisWeek": { count, priorWeekCount, pctChange },
    "thisMonth": { count, priorMonthCount, pctChange }
  },
  "chatMessages": {
    "thisWeek": { count, priorWeekCount, pctChange },
    "thisMonth": { count, priorMonthCount, pctChange }
  },
  "activeChatUsers": {
    "thisWeek": { count, priorWeekCount, pctChange },
    "thisMonth": { count, priorMonthCount, pctChange }
  },
  "insights": [{ title, summary, date }]
}
```

### `functions/elora-users-read.ts`
```
GET /api/elora-users-read?page=1&limit=50
```
Returns:
```json
{
  "users": [{ user_id, latest_created_at, total_entry_count }],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

### `functions/elora-user-read.ts`
```
POST /api/elora-user-read
Body: { userId: string }
```
Returns:
```json
{
  "user": {
    "id": "...",
    "created_at": "...",
    "total_entries": 42,
    "total_messages": 156,
    "last_active": "...",
    "profile": { ...jsonb }
  },
  "entries": [{ id, content, embedding, insight_title, insight_emoji, insight_summary, metadata, entry_date, word_count }],
  "totalEntries": 42
}
```

---

## Components

### Elora Layout & Nav
- `components/Elora/Layout.tsx` — wraps page in flex column with Nav
- `components/Elora/Nav.tsx` — dark navbar, Elora branding, links: Dashboard (`/elora`), Users (`/elora/users`)

### Dashboard Components
- `components/Elora/Dashboard/InsightBanner.tsx` — AI insight cards with glow
- `components/Elora/Dashboard/TopUsersTable.tsx` — mini table with expand link
- `components/Elora/Dashboard/ComparisonBar.tsx` — single grouped bar with count + pct
- `components/Elora/Dashboard/ComparisonChart.tsx` — pair of ComparisonBars (week + month)
- `components/Elora/Dashboard/StatCard.tsx` — gradient-bordered card wrapper

### User Components
- `components/Elora/Users/UserHeader.tsx` — persistent info bar
- `components/Elora/Users/UserEntries.tsx` — entries table + modal
- `components/Elora/Users/UserProfile.tsx` — profile summary + full view with accordions
- `components/Elora/Users/EntryModal.tsx` — full entry modal

### Shared
- `components/Elora/TableHead.tsx` — reusable table header
- `components/Elora/TableRow.tsx` — reusable table row
- `components/Elora/Pagination.tsx` — page controls

---

## CSS Approach (`styles/elora.css`)
- Dark slate base: `bg-slate-900`, `bg-slate-800`, `bg-slate-800/50`
- Glass cards: `backdrop-blur-md bg-slate-800/60 border border-slate-700/50`
- Accent gradients: emerald-400 → teal-500 for Stockwise continuity, or a new Elora accent (maybe violet/purple)
- Chart bars: gradient fills (from accent to transparent), rounded tops, width transition animation
- Table rows: `hover:bg-slate-700/50` transition
- Modals: `backdrop-blur-sm bg-black/60`, slide-up with `translateY` transition
- Percentage badges: green bg for positive, red bg for negative
- Pulse animation for insight banner glow
- Scroll-triggered count-up animations (CSS only with @keyframes)

---

## Implementation Order
1. Netlify functions (data layer)
2. Elora Layout + Nav
3. `_app.tsx` integration (add Elora route handling)
4. Dashboard page + components
5. Users page + table components
6. User profile page + sub-components
7. CSS styling pass
8. Mobile responsive polish