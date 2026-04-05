# Ticket Frontend (Next.js + shadcn/ui)

Frontend admin portal for the AI-powered ticket management project.

## Features

- Admin dashboard for ticket operations
- JWT-based login flow
- Protected admin page (`/`) with token validation via `/auth/me`
- Manage tickets:
  - create ticket
  - view AI category/priority/confidence/summary
  - update status, priority, category, assignment, summary (admin override)
- Manage users and roles
- Manage customers

## Tech Stack

- Next.js (App Router)
- TypeScript
- shadcn/ui (default theme)
- Tailwind CSS v4
- sonner toast notifications

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env.local
```

3. Set backend URL in `.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

4. Run dev server

```bash
npm run dev
```

Open `http://localhost:3000/login`.

## Login

Use backend admin credentials from backend `.env`:

- `ADMIN_EMAIL` (default `admin@ticket.local`)
- `ADMIN_PASSWORD` (default `admin123456`)

## Build

```bash
npm run build
```

## Deploy To Vercel (Detailed)

### 1. Push frontend repo

Make sure this repo is on GitHub:

- `git@github.com:tonmoy-dhroubo/customer-ticket-management-ui.git`

### 2. Create project on Vercel

1. Go to Vercel dashboard.
2. Click `Add New...` -> `Project`.
3. Import `customer-ticket-management-ui`.
4. Keep framework as `Next.js` (auto-detected).

### 3. Set environment variable

In Project Settings -> Environment Variables, add:

- `NEXT_PUBLIC_API_BASE_URL` = `https://customer-ticket-management-api-production.up.railway.app`

Apply to:

- `Production`
- `Preview` (recommended)

### 4. Deploy

Click `Deploy`.  
After env var changes, redeploy latest commit to ensure the build picks up the new value.

### 5. Verify frontend

1. Open deployed URL.
2. Go to `/login`.
3. Login with seeded credentials:
   - `admin@ticket.local`
   - `admin123456`
4. Create/update tickets and ensure data reflects in backend.
