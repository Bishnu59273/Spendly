# Spendly

**Spendly** is a personal finance tracker built around your pay cycle — not the calendar month. It helps you understand where your money goes, stay inside your budget, and grow your savings, all from a clean and fast web app.

🔗 **Live app → [spendly.it.com](https://spendly.it.com)**

---

## What it does

### Expense & Income tracking

Log expenses under custom categories (with icons and colours) and tag them for finer grouping. Income is tracked separately by source — Freelance, Refund, Gift, Others, or any source you create — so it never pollutes your category breakdown. Both support recurring entries that auto-post on a chosen day each month.

### Pay-cycle budgeting

Everything is scoped to your pay cycle, not January 1 – January 31. Set your salary day once and every chart, total, and budget resets on that day. Income received during the cycle is added directly to your remaining budget so the number always reflects real spendable money.

### Savings goals

Create savings goals with a target amount and track progress with a live ring chart. Add savings manually or check **Deduct from monthly budget** to have the amount automatically logged as an expense — keeping your budget and your goals in sync. Deleting that expense reverses the goal amount. A history chart shows your savings trajectory over time.

### Group expenses — split bills with flatmates & partners

Create a group, invite people with a short 7-character code or a shareable link, and log shared expenses split three ways — **equally**, by **custom amounts**, or by **percentage**. Spendly nets everyone's balances and simplifies them down to the fewest payments needed (the same greedy debt-simplification approach apps like Splitwise use), so a group of five people never ends up with fifteen separate IOUs.

Whoever pays for a shared expense sees it hit their personal Dashboard immediately — the **full amount** deducted from their remaining budget and added to their total spend, under a "Group Expense" category — since that's real money that just left their account. Everyone else's personal budget is untouched until they actually settle their share.

To settle up, pay directly via **UPI** — a deep link opens the payer's UPI app, or they can scan a QR code — then mark it paid. The other person must confirm before it counts (a two-step confirmation, so nothing is recorded on a false claim). Once confirmed, the payment is logged as a real personal expense (for whoever paid) or income (for whoever received it) — right alongside manually-logged transactions on the Dashboard.

Unlike the rest of the app, group actions require an internet connection: every other mutation queues offline and syncs later, but group balances are shared and server-authoritative across multiple people, so they talk to the server directly and surface a clear "you're offline" message instead of queuing.

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

| Layer         | Technology                                                          |
| ------------- | -------------------------------------------------------------------- |
| Frontend      | React 18, Vite, React Query, React Router                            |
| Styling       | Custom design system — Bricolage Grotesque + Hanken Grotesk          |
| Backend       | Node.js, Express, Prisma ORM                                        |
| Database      | PostgreSQL on Supabase (RLS enabled on all tables)                   |
| Auth          | JWT (Bearer token), bcrypt password hashing                          |
| Offline / PWA | IndexedDB (`idb`) + Workbox — most mutations queue offline and sync when back online |
| Notifications | Web Push (VAPID) for in-app announcements, Resend for transactional email |
| Payments      | UPI deep links + `qrcode.react` for group settle-up                  |
| Hosting       | Vercel (frontend) · Render (API)                                     |

---

## Key design decisions

**Pay-cycle scope** — All queries are bounded by `cycleStart`/`cycleEnd` derived from the user's `salaryDay`, not fixed calendar months. Cycle helpers use UTC throughout to avoid timezone drift between the browser and server.

**Income sources, not categories** — Income uses a dedicated `income_sources` table instead of sharing the expense category system. Default sources are seeded per user on first access; custom sources can be added or removed freely.

**Savings ↔ budget sync** — When a savings deduction is created, the expense stores a `goalId`. Deleting the expense triggers a goal reversal on the server, keeping the saved amount accurate without any manual correction.

**No build-time migrations** — Database schema is managed via Supabase MCP. The Render build command is `npm install && npx prisma generate` only — no `prisma migrate deploy` in CI.

**Group balances are a separate ledger, but real cash flow always mirrors to the personal ledger** — `Group`, `GroupExpense`, `GroupExpenseSplit`, and `Settlement` are their own models and remain the sole source of truth for *who owes whom*; that math never changes based on personal budgets. But every point where real money actually moves gets mirrored onto the personal `Expense` table via the same `createExpenseRecord` path used for manual entries: the **payer** of a group expense gets the full amount logged as a personal expense the instant it's created (via `Expense.groupExpenseId`, a unique DB-cascaded link back to the `GroupExpense` — editing or deleting the group expense updates or removes the mirrored entry automatically), and once a settlement is *confirmed* (two-step: one side marks it paid, the other confirms), the debtor gets a personal expense and the **creditor gets category-tied personal income** (not source-tied) — same "Group Settlement" category on both sides — wrapped in one transaction so nothing can end up confirmed with a missing ledger entry. Category-tied income is what makes it net out correctly on the Dashboard as a genuine refund: Total Spent drops back down and Remaining Budget goes back up, so a payer's full outlay followed by a reimbursement settles down to exactly their true share with no double-counting.

**Remaining Budget accounts for all income, not just source-tied** — `summary.js`'s `/cycle` handler computes `remaining = totalBudget − grossSpent + totalIncome`. Earlier this only added back *source-tied* income (e.g. Salary, Gift), so a category-tied refund would correctly shrink Total Spent but leave Remaining Budget looking artificially low — a real gap for any refund, not just group settlements. Fixed once, for every user.

**No offline queue for groups** — group actions (expenses, settlements, invites) bypass the offline sync engine entirely and talk to the server directly, since balances are shared and server-authoritative across multiple people and can't be safely reconciled from a local queue.

---

## Pages

| Route                | Description                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `/`                  | Dashboard — KPIs, charts, recent transactions                       |
| `/expenses`          | Full transaction list — filter, search, edit, export                |
| `/categories`        | Manage expense categories — icons, colors, per-category budgets     |
| `/tags`              | Manage tags for cross-category grouping                             |
| `/goals`             | Savings goals — progress rings, history chart                       |
| `/groups`            | Your groups — create one, join with a code, see balances at a glance |
| `/groups/:groupId`   | Group dashboard — balances, suggested settlements, shared expenses  |
| `/join/:code`        | Accept a group invite link                                         |
| `/settings`          | Profile, salary day, currency, monthly budget, UPI ID, change password |
| `/updates`           | Product announcements                                              |
| `/support`           | Send feedback                                                      |
