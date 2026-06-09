# Spendly

**Spendly** is a personal finance tracker built around your pay cycle — not the calendar month. It helps you understand where your money goes, stay inside your budget, and grow your savings, all from a clean and fast web app.

🔗 **Live app → [spendly-bice.vercel.app](https://spendly-bice.vercel.app)**

---

## What it does

### Expense & Income tracking
Log expenses under custom categories (with icons and colours) and tag them for finer grouping. Income is tracked separately by source — Freelance, Refund, Gift, Others, or any source you create — so it never pollutes your category breakdown. Both support recurring entries that auto-post on a chosen day each month.

### Pay-cycle budgeting
Everything is scoped to your pay cycle, not January 1 – January 31. Set your salary day once and every chart, total, and budget resets on that day. Income received during the cycle is added directly to your remaining budget so the number always reflects real spendable money.

### Savings goals
Create savings goals with a target amount and track progress with a live ring chart. Add savings manually or check **Deduct from monthly budget** to have the amount automatically logged as an expense — keeping your budget and your goals in sync. Deleting that expense reverses the goal amount. A history chart shows your savings trajectory over time.

### Dashboard at a glance
- Total spent vs budget (% used)
- Remaining budget (budget − spending + income)
- Days left in the cycle
- Top spending category
- Donut chart of spending by category
- Cycle-over-cycle spend trend (last 6 cycles)
- Recent transactions with category / source icons
- Budget progress per category

### Expenses page
Full transaction list with search, category filter, income/expense toggle, and cycle navigation. Edit or delete any entry. Export the current cycle to CSV.

### Goals page
Primary savings goal with a progress ring and snapshot history chart, plus a grid of secondary goals. Promote any goal to primary. Add savings inline with optional budget deduction.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Query, React Router |
| Styling | Custom design system — Bricolage Grotesque + Hanken Grotesk |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL on Supabase (RLS enabled on all tables) |
| Auth | JWT (Bearer token), bcrypt password hashing |
| Hosting | Vercel (frontend) · Render (API) |

---

## Key design decisions

**Pay-cycle scope** — All queries are bounded by `cycleStart`/`cycleEnd` derived from the user's `salaryDay`, not fixed calendar months. Cycle helpers use UTC throughout to avoid timezone drift between the browser and server.

**Income sources, not categories** — Income uses a dedicated `income_sources` table instead of sharing the expense category system. Default sources are seeded per user on first access; custom sources can be added or removed freely.

**Savings ↔ budget sync** — When a savings deduction is created, the expense stores a `goalId`. Deleting the expense triggers a goal reversal on the server, keeping the saved amount accurate without any manual correction.

**No build-time migrations** — Database schema is managed via Supabase MCP. The Render build command is `npm install && npx prisma generate` only — no `prisma migrate deploy` in CI.

---

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — KPIs, charts, recent transactions |
| `/expenses` | Full transaction list — filter, search, edit, export |
| `/goals` | Savings goals — progress rings, history chart |
| `/settings` | Profile, salary day, currency, monthly budget, change password |
| `/support` | Send feedback |
