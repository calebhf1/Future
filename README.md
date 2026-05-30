# 🏡 Hearth — Family Budget App

A clean, shared budget tracker for couples. Built with React + Vite, Supabase, and deployable to Vercel in minutes.

## Features

- 📊 **Dashboard** — Monthly overview with spending charts, budget vs actual, income summary
- 💸 **Transactions** — Add and track expenses and income by month
- 🎯 **Savings Goals** — Visual progress toward shared goals (vacation, house, etc.)
- 🏷️ **Categories** — Custom categories with monthly budget amounts and color coding
- 🔐 **Auth** — Email/password login with Supabase. Share one account or each have your own.

---

## Setup Guide (15–20 minutes)

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `hearth-budget`) and a strong database password
3. Select the region closest to you
4. Wait ~2 minutes for it to provision

### Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run** — you should see "Success"

### Step 3 — Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 4 — Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5 — Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign up for an account and start budgeting!

### Step 6 — Deploy to Vercel

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create hearth-budget --public --push
   # or create the repo manually on github.com and follow their instructions
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo

3. In the Vercel deploy screen, add **Environment Variables**:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key

4. Click **Deploy** — done! 🎉

Your app will be live at `https://your-app-name.vercel.app`

---

## Shared Access for Couples

**Option A (Simplest):** Create one account and share the login credentials with your spouse. All data is automatically shared.

**Option B (Each has own login):** Both create separate accounts. Note: data is currently per-user, so you'd each see your own data. To share data across two logins, you'd need to add a household/family concept — ask Claude to help extend the app if you want this!

---

## Customizing

- **Add default categories fast:** Go to Categories → "Load default categories" button
- **Budget amounts:** Set monthly budgets per category to see Budget vs Actual charts
- **Savings goals:** Track progress toward specific goals with optional target dates

---

## Tech Stack

- **Frontend:** React 18, React Router, Recharts, Lucide Icons, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Build:** Vite
- **Hosting:** Vercel
