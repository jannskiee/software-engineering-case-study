# 🚀 Deployment Guide — Supabase + Vercel

## ✅ What's Already Done (Code Changes)

| Change | Status |
|---|---|
| `schema.prisma` → PostgreSQL with `directUrl` | ✅ Done |
| `.env` and `.env.local` → Supabase placeholders | ✅ Done |
| Removed native `bcrypt` → using `bcryptjs` only | ✅ Done |
| `seed.ts` → updated import to `bcryptjs` | ✅ Done |
| `package.json` → added `postinstall` + `vercel-build` | ✅ Done |
| Deleted old SQLite migrations | ✅ Done |
| Build tested → **compiles successfully** | ✅ Done |

---

## 📋 Step-by-Step: What YOU Need to Do

### STEP 1 — Create Supabase Project (5 minutes)

1. Go to [https://supabase.com](https://supabase.com) → Sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `inventory-system`
   - **Database Password:** Choose a strong password → **SAVE IT**
   - **Region:** Pick closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Wait ~2 minutes for project to provision

### STEP 2 — Get Database Connection Strings

1. In Supabase Dashboard → **Project Settings** (gear icon) → **Database**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the **Transaction (port 6543)** URL → this is your `DATABASE_URL`
5. Copy the **Session (port 5432)** URL → this is your `DIRECT_URL`

### STEP 3 — Update Your `.env` and `.env.local` Files

Replace the placeholder values with your real Supabase URLs.

**In `.env` (for Prisma CLI):**
```dotenv
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**In `.env.local` (for Next.js app) — same DB URLs plus auth:**
```dotenv
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

GOOGLE_CLIENT_ID=your_new_google_client_id
GOOGLE_CLIENT_SECRET=your_new_google_client_secret
```

### STEP 4 — Push Schema to Supabase

Run these commands in your terminal:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the `User`, `Account`, `Session`, `VerificationToken` tables in Supabase
- Generate a fresh `prisma/migrations/` folder

### STEP 5 — Seed the Super Admin

```bash
npx prisma db seed
```

This creates the `superadmin` account in your Supabase database.

### STEP 6 — Test Locally

```bash
npm run dev
```

Then visit:
- `http://localhost:3000/admin-login` → Log in with `superadmin` / `superadmin`
- `http://localhost:3000/login` → Test Google OAuth
- `http://localhost:3000/dashboard/users` → Should show user counts

### STEP 7 — Rotate Google OAuth Credentials

⚠️ **Your old credentials were exposed. You MUST do this.**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Delete the old OAuth 2.0 Client
4. Create a new one:
   - **Authorized redirect URIs:** 
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://your-app.vercel.app/api/auth/callback/google` (prod — add after Vercel deploy)
5. Copy new Client ID and Secret → paste into `.env.local`

### STEP 8 — Push to GitHub

```bash
git add .
git commit -m "migrate to supabase postgresql + vercel ready"
git push origin main
```

### STEP 9 — Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **"Add New" → "Project"**
3. Select your `inventory-system` repository
4. **Framework Preset:** Next.js (auto-detected)
5. **Environment Variables** — Add ALL of these:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Supabase pooled URL (port 6543) |
| `DIRECT_URL` | Your Supabase direct URL (port 5432) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Your generated secret |
| `GOOGLE_CLIENT_ID` | Your new Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Your new Google Client Secret |

6. Click **Deploy** → Wait ~60 seconds

### STEP 10 — Post-Deploy: Update Google OAuth Redirect

After Vercel gives you your URL (e.g., `https://inventory-system-xyz.vercel.app`):

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth Client
3. Add Authorized redirect URI:
   ```
   https://inventory-system-xyz.vercel.app/api/auth/callback/google
   ```
4. Also update `NEXTAUTH_URL` in Vercel's env vars to your actual URL

---

## 🔄 How to Redeploy After Code Changes

```bash
git add .
git commit -m "your change description"
git push origin main
```

That's it. Vercel auto-deploys on every push to `main` in ~30 seconds.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   User Browser   │────▶│     Vercel        │
│                  │◀────│  (Next.js App)    │
└─────────────────┘     │  Frontend +       │
                        │  API Routes +     │
                        │  NextAuth         │
                        └────────┬─────────┘
                                 │ Prisma
                                 ▼
                        ┌──────────────────┐
                        │    Supabase       │
                        │   PostgreSQL      │
                        │  (Free: 500MB)    │
                        └──────────────────┘
```

## 💰 Cost

| Service | Free Tier | Paid Upgrade |
|---|---|---|
| Vercel | 100GB bandwidth, 10s functions | $20/mo Pro |
| Supabase | 500MB DB, 2 projects | $25/mo Pro |
| Google OAuth | Free forever | Free |
| **Total** | **$0/month** | — |

