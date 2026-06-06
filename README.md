# Spendly — Monthly Expense Manager

Full-stack expense tracker with salary-cycle-aware budgeting.

## Stack

- **Frontend**: React + Vite, Tailwind CSS, Recharts, React Query, React Router, Lucide React
- **Backend**: Node.js + Express, Prisma ORM, JWT (httpOnly cookie), Zod
- **Database**: PostgreSQL via Supabase

---

## Quick Start

### 1. Configure the Server

Copy `.env.example` to `.env` in `server/` and fill in your credentials:

```env
# From Supabase → Project Settings → Database → Connection string → Transaction Pooler
DATABASE_URL=postgresql://postgres.bjhpwqpoadhdnwqocdhk:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# From Supabase → Project Settings → Database → Connection string → Session Pooler (port 5432)
DIRECT_URL=postgresql://postgres.bjhpwqpoadhdnwqocdhk:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

JWT_SECRET=change-this-to-a-random-secret
PORT=4000
CLIENT_URL=http://localhost:5173
```

> Get your password: https://supabase.com/dashboard/project/bjhpwqpoadhdnwqocdhk/settings/database

### 2. Generate Prisma Client

```bash
cd server
npm run db:generate
```

### 3. Run the Server

```bash
cd server
npm run dev
```

### 4. Run the Client

```bash
cd client
npm run dev
```

Open http://localhost:5173 — register an account and start tracking.

---

## Project Structure

```
/
├── client/              # React + Vite frontend
│   └── src/
│       ├── api/         # React Query hooks
│       ├── components/  # Shared UI components
│       ├── pages/       # Dashboard, Expenses, Tags, Settings, Login, Register
│       └── utils/       # Cycle logic, currency formatting
├── server/              # Express backend
│   ├── prisma/          # Schema + seed
│   └── src/
│       ├── routes/      # auth, categories, tags, expenses, summary
│       ├── middleware/   # JWT auth, error handler
│       └── lib/         # Prisma client, cycle helper
└── README.md
```

## Features

- **Salary-cycle budgeting**: expenses grouped by your pay cycle (e.g., 25th → 24th), not calendar months
- **Custom tags**: emoji + color pills, multi-select on expenses
- **Charts**: pie (by category) + bar (6-cycle trend) via Recharts
- **CSV export**: one click to download current cycle expenses
- **Recurring expenses**: daily cron auto-inserts expenses on their recurring day
- **Dark mode**: toggle in Settings
- **Mobile responsive**: works on 375px screens

## Deploy

- **Frontend → Vercel**: point root to `client/`, build command `npm run build`, output `dist`
- **Backend → Render**: point root to `server/`, start command `npm start`, set all env vars
