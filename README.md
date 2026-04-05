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

