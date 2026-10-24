# Coffee Ninja Inquiry Management System

Staff sign in, record customer inquiries, find them later, and move them through
New → In Progress → Resolved.

**Stack:** Next.js (React) · Node/Express · PostgreSQL · Jest, Supertest, React Testing Library

## Prerequisites
- Node.js 20+
- Docker (for PostgreSQL), or a local Postgres reachable with the `DATABASE_URL` in `backend/.env`

## Run it locally

```bash
# 1. Database
docker compose up -d
docker compose exec db psql -U inquiry -d inquiries -c "CREATE DATABASE inquiries_test;"

# 2. Backend (http://localhost:4000)
cd backend
npm install
cp .env.example .env          # Windows cmd: copy .env.example .env
npm run migrate               # drops and recreates the tables
npm run seed
npm run dev

# 3. Frontend (new terminal, http://localhost:3000)
cd frontend
npm install
cp .env.example .env.local    # Windows cmd: copy .env.example .env.local
npm run dev
```

Open http://localhost:3000 and sign in.

## Test accounts
Password for all: `Password123!` (the login page also has one-click buttons for these)

| Email | Role | Can see |
|---|---|---|
| alice@coffeeninja.test | staff | only inquiries she created |
| bob@coffeeninja.test | staff | only inquiries he created |
| maya@coffeeninja.test | manager | every inquiry |

## Tests
```bash
cd backend && npm test     # 11 tests against a real Postgres test database
cd frontend && npm test    # 5 tests with the API mocked
```

## API
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/login, /api/auth/logout | httpOnly cookie session |
| GET | /api/auth/me | current user |
| POST | /api/inquiries | create (validated, duplicate-checked) |
| GET | /api/inquiries?status=&q= | list, filter, search (scoped to the user) |
| GET | /api/inquiries/:id | 400 bad id, 404 missing or not yours |
| PATCH | /api/inquiries/:id/status | body `{ status, version }` |

Errors always look like `{ "error": { "code", "message", "details?" } }`.

See [DECISIONS.md](./DECISIONS.md) for design rules, trade-offs, and testing gaps.