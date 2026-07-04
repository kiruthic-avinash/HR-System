# HR-System

A Human Resource Management System (HRMS) on the MERN stack: **MongoDB · Express · React · Node.js**, with JWT authentication, server-side role-based access control, and pluggable file storage (local disk / AWS S3).

## Features

| Module | Employee | Admin / HR |
|---|---|---|
| **Auth** | Sign-up (Employee ID, email, password, role), mandatory email verification, sign-in with role-based redirect | Same, with `admin` role |
| **Dashboard** | Quick-access cards (Profile, Attendance, Leave, Salary) + recent-activity notifications | Live summary tiles (headcount, present today, pending leaves) |
| **Profile** | View all own details; edit contact fields + profile picture; upload documents (PDF/image, 5 MB) | Searchable paginated directory; edit *all* fields of any profile; delete any account (employee or admin, never their own) with cascade over attendance/leave/notification data |
| **Attendance** | Check-in / check-out (double-click safe), own daily/weekly history | Master view with date/status filters, corrections, absentee sweep (auto at 23:55 + manual trigger) |
| **Leave** | Request (paid/sick/unpaid) with date range + remarks, monthly calendar with state colors, cancel pending | Approval queue, approve/reject with feedback comment; approval writes `leave` attendance records for the range |
| **Payroll** | Strictly read-only salary breakdown (no write route exists) | Full read/write of every salary structure |

## Architecture

```
client/   React 19 SPA (Vite, Tailwind 4, react-router 7)
          ├─ separate /app (employee) and /admin route trees + layouts
          └─ axios instance with automatic refresh-token retry
server/   Express 4 REST API - layered: routes → middleware → controllers → services → models
          ├─ JWT access (15 min) + rotating refresh cookie (7 d)
          ├─ rbac('admin') middleware on every admin route (client guards are UX only)
          ├─ field-level whitelists in services (employee vs admin profile edits)
          └─ storage abstraction: disk driver (dev) / S3 driver (STORAGE_DRIVER=s3)
```

Key invariants:
- **Identity comes from the JWT**, never from request params, on all `/me` endpoints.
- **Attendance is the single source of truth** for day states; leave approval bulk-upserts `leave` records.
- **Check-in is an atomic upsert** guarded by a unique `{user, date}` index - concurrent clock-ins cannot double-write.

## Getting started

Requirements: Node.js ≥ 20. **No MongoDB install needed** - with `USE_MEMORY_DB=true` the server runs an embedded MongoDB persisted to `server/.mongo-data`.

```bash
# API (http://localhost:5000)
cd server
cp .env.example .env        # defaults work for local dev
npm install
npm run dev

# Client (http://localhost:5173, proxies /api to :5000)
cd client
npm install
npm run dev
```

On first boot in development the server seeds demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin / HR | `admin@hr-system.local` | `Admin@123` |
| Employee | `alice@hr-system.local` | `Alice@123` |
| Employee | `bob@hr-system.local` | `Bob@12345` |

Email verification links for new sign-ups are printed to the server console when no SMTP host is configured. To send real mail via Gmail: enable 2-Step Verification, create an app password at <https://myaccount.google.com/apppasswords>, and set in `server/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=<16-char app password>
MAIL_FROM="HR System <you@gmail.com>"   # must match SMTP_USER - Gmail rewrites the From header
```

The server verifies the SMTP connection at boot and logs the result; if a send fails during sign-up, the registration is rolled back so the email/employee ID stay free for a retry.

## Tests

```bash
cd server && npm test
```

50 integration tests (Jest + Supertest + in-memory MongoDB) covering the auth flow, an RBAC 403/401 matrix over every admin endpoint, attendance check-in atomicity, the leave→attendance sync loop, payroll write-denial, account deletion (cascade, self-delete block), and Mongo operator-injection sanitisation.

## Security

- bcrypt (cost 12) password hashing; verification & refresh tokens stored hashed
- Rotating refresh tokens in an `httpOnly` cookie scoped to `/api/auth`
- helmet, CORS origin whitelist, rate limiting on `/api/auth/*`, body sanitisation against `$`/dot operator injection
- Upload hardening: MIME whitelist, 5 MB cap, randomized filenames
- Admins cannot delete their own account, so at least one admin always remains
- Central error handler; stack traces suppressed in production

## Deployment notes

- **API**: Render/Railway/EC2. Set `NODE_ENV=production`, real `MONGO_URI` (Atlas), strong `JWT_*` secrets, `CLIENT_ORIGIN`, SMTP credentials, and `STORAGE_DRIVER=s3` + `S3_BUCKET`/`S3_REGION` (credentials via standard AWS env/role).
- **Client**: `npm run build` → deploy `client/dist` to Vercel/Netlify; route `/api/*` and `/uploads/*` to the API origin.
- Future scaling (not needed at current size): Redis cache for dashboard aggregates, BullMQ for email fan-out, MongoDB read replicas.
