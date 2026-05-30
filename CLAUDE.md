# CLAUDE.md — WillDateMe Project Instructions

> **Read this file completely at the start of every session before writing a single line of code.**
> This is the single source of truth for how this project is built, maintained, and documented.

---

## Table of Contents

1. [Session Protocol](#1-session-protocol)
2. [Project Overview](#2-project-overview)
3. [Architecture & Tech Stack](#3-architecture--tech-stack)
4. [Code Quality Rules](#4-code-quality-rules)
5. [Commenting Standard](#5-commenting-standard)
6. [No Hard-Coding Policy](#6-no-hard-coding-policy)
7. [Environment Variables](#7-environment-variables)
8. [File & Folder Conventions](#8-file--folder-conventions)
9. [Git & Commit Rules](#9-git--commit-rules)
10. [Testing Requirements](#10-testing-requirements)
11. [Error Handling Standard](#11-error-handling-standard)
12. [Session Changelog](#12-session-changelog)

---

## 1. Session Protocol

### At the Start of Every Session

Before writing any code, Claude must:

1. **Read this entire file** — top to bottom, no skipping.
2. **Read the Session Changelog** (Section 12) — understand what was done last and what is pending.
3. **Check `TODO.md`** (if it exists) — pick up any open tasks.
4. **State a session plan** — in a short comment block, describe what will be done this session before starting.

### During the Session

- Work in small, focused steps — one feature or fix at a time.
- After completing each logical unit of work, pause and verify it works before moving on.
- Never leave the codebase in a broken state (failing build, missing imports, broken routes).
- If a decision has trade-offs, leave a `// DECISION:` comment explaining why the approach was chosen.

### At the End of Every Session

After finishing all code changes, Claude must append a new entry to **Section 12 (Session Changelog)** of this file with the following format:

```
### Session [N] — [Date]

**Added:**
- [List every new file, feature, or function added]

**Modified:**
- [List every file changed and why]

**Removed:**
- [List anything deleted and why it was removed]

**Bugs Fixed:**
- [Describe each bug: what it was, what caused it, how it was fixed]

**Known Issues / Next Steps:**
- [Anything that is incomplete, deferred, or needs attention next session]
```

This changelog is the project memory. It must be accurate and complete.

---

## 2. Project Overview

**App Name:** DateMe  
**Purpose:** A web app that lets someone create a personalized date invitation link, share it, and get notified when the receiver accepts.

**Core User Flows:**

```
Sender:
  Sign up → Create invitation (venue + time options) → Share link → View dashboard → Receive email on acceptance

Receiver (no account needed):
  Open link → See "Will you date me?" page → Yes button (No button runs away) →
  Choose location → Choose time → See celebration → Done
```

**Domain:** Likely `willdate.me` or `datenight.app` (verify before deploying)

**Status:** In development. See Section 12 for current progress.

---

## 3. Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Frontend + API routes in one project |
| Language | TypeScript (strict mode) | Type safety everywhere |
| Styling | Tailwind CSS | Utility-first, no custom CSS unless necessary |
| Animation | Framer Motion | Page transitions, the fleeing No button, celebrations |
| Auth | NextAuth.js v5 | Google OAuth + magic link email login |
| Database | PostgreSQL (Neon) | Primary data store |
| ORM | Prisma | Type-safe DB queries |
| Email | Resend | Transactional emails |
| Rate Limiting | Upstash Redis | Protect `/api/invite/[shortId]/accept` |
| Storage | Cloudinary (optional) | Venue/food option images |
| Hosting | Vercel | Deployment |
| ID Generation | Nanoid | Short unique invite link IDs |

**Key Architectural Decisions:**
- No separate backend server — all API logic lives in Next.js route handlers (`app/api/`)
- The receiver never creates an account — their choices are stored on the `Invitation` row
- `Invitation.shortId` (8 chars) is the public link token; `Invitation.id` is never exposed publicly
- All API routes that mutate data must validate ownership before proceeding

---

## 4. Code Quality Rules

These rules are non-negotiable. Every file Claude writes must follow them.

### General

- **TypeScript strict mode** — no `any`, no `ts-ignore`, no implicit `any`. If a type is unknown, define it.
- **No magic numbers** — every numeric constant must be a named constant with a comment explaining its meaning.
- **No magic strings** — route paths, status values, event names, and similar string literals must be constants or enums.
- **Single responsibility** — each function does one thing. If a function needs a long comment to explain what it does, it should be split.
- **Pure functions where possible** — functions that transform data should not have side effects.
- **Fail loudly in development, fail gracefully in production** — use `process.env.NODE_ENV` guards for verbose error output.

### React / Next.js

- All Client Components must have `'use client'` at the top.
- All Server Components and route handlers must be explicitly async where they use `await`.
- Never use `useEffect` to fetch data — use React Server Components or SWR/React Query.
- Avoid prop drilling more than 2 levels — use context or Zustand for shared state.
- Loading states and error states are required for every data-fetching component.

### API Routes

- Every route handler must have explicit TypeScript types for request bodies.
- Every route handler validates its inputs before touching the database.
- Every route handler returns a consistent response shape: `{ data } | { error, code }`.
- Route handlers that modify data must be idempotent where possible.

### Database

- Never write raw SQL — use Prisma client only.
- Always use `select` to limit fields returned — never return entire rows with sensitive fields.
- Wrap multi-step database operations in a `prisma.$transaction()`.

---

## 5. Commenting Standard

Comments are mandatory. They explain *why*, not *what*. The code already shows what — comments show the reasoning.

### Function Header Comment (required for every function)

```typescript
/**
 * Generates a short unique ID for a date invitation link.
 *
 * Uses nanoid with a custom alphabet (URL-safe characters only, no ambiguous
 * characters like 0/O or 1/l) to ensure the ID is readable when shared verbally
 * or in print.
 *
 * @param length - Number of characters in the ID (default: 8)
 * @returns A URL-safe unique string, e.g. "aB3xK9mQ"
 */
function generateInviteId(length: number = INVITE_ID_LENGTH): string {
  return nanoid(length)
}
```

### Inline Comment (use for non-obvious logic)

```typescript
// Clamp the button position so it never leaves the viewport.
// We subtract the button's own width/height to avoid clipping at the edges.
const clampedX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth))
const clampedY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight))
```

### Decision Comment (use when a choice has trade-offs)

```typescript
// DECISION: We use nanoid(8) instead of UUID for the public shortId.
// UUIDs are 36 chars and look ugly in a shared link. An 8-char nanoid
// gives ~2 trillion possible values (62^8), which is sufficient for this
// use case and far less likely to collide than a 4-char code.
```

### TODO Comment (use for known gaps, always include date)

```typescript
// TODO [2025-06-01]: Add rate limiting to this endpoint once Upstash Redis
// is configured. Currently unprotected against spamming accept requests.
```

### Section Comment (use in long files to separate concerns)

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Email Sending
// ─────────────────────────────────────────────────────────────────────────────
```

---

## 6. No Hard-Coding Policy

**Nothing that can change between environments, users, or builds should be a literal value in code.**

### What must never be hard-coded:

| Category | Bad | Good |
|---|---|---|
| URLs | `"https://dateme.app/invite/"` | `process.env.NEXT_PUBLIC_APP_URL + "/invite/"` |
| Limits | `if (options.length > 4)` | `if (options.length > MAX_OPTIONS_PER_INVITE)` |
| Timeouts | `setTimeout(fn, 3000)` | `setTimeout(fn, FLEE_ANIMATION_TIMEOUT_MS)` |
| Colors | `"#D4537E"` in JS/TS | Tailwind class or CSS variable |
| Email addresses | `"noreply@dateme.app"` | `process.env.EMAIL_FROM` |
| Status strings | `status === "ACCEPTED"` | `status === InviteStatus.ACCEPTED` |
| Route strings | `"/dashboard/new"` | `ROUTES.DASHBOARD_NEW` |

### Where constants live:

```
lib/
  constants.ts      ← App-wide constants (limits, timeouts, config values)
  routes.ts         ← All route path strings
  enums.ts          ← Status enums and other typed string sets
```

### Example constants file:

```typescript
// lib/constants.ts

// ─── Invite Configuration ───────────────────────────────────────────────────

/** Length of the public short ID used in invitation URLs (e.g. "aB3xK9mQ"). */
export const INVITE_ID_LENGTH = 8

/** Maximum number of location/venue options a sender can add to one invitation. */
export const MAX_LOCATION_OPTIONS = 4

/** Maximum number of time options a sender can add to one invitation. */
export const MAX_TIME_OPTIONS = 4

/** Maximum character length for the sender's personal message. */
export const MAX_PERSONAL_MESSAGE_LENGTH = 280

/** Maximum character length for any option label (location name or time label). */
export const MAX_OPTION_LABEL_LENGTH = 60


// ─── Fleeing No Button ───────────────────────────────────────────────────────

/** Pixel radius within which the No button starts fleeing the cursor. */
export const NO_BUTTON_FLEE_RADIUS_PX = 130

/** Pixel distance the No button jumps each time it flees. */
export const NO_BUTTON_FLEE_SPEED_PX = 180


// ─── Rate Limiting ───────────────────────────────────────────────────────────

/** Max number of accept attempts per invitation per window. */
export const RATE_LIMIT_MAX_ATTEMPTS = 3

/** Rate limit window duration in seconds. */
export const RATE_LIMIT_WINDOW_SECONDS = 3600


// ─── Invitation Expiry ───────────────────────────────────────────────────────

/** Number of days after creation before an invitation auto-expires. */
export const INVITE_EXPIRY_DAYS = 30
```

---

## 7. Environment Variables

All environment variables are defined in `.env.local` (local dev) and set in the Vercel dashboard (production).

**Never commit `.env.local` to version control.**

### Required Variables

```bash
# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host/dateme"

# ─── Auth (NextAuth.js) ──────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth — create at console.cloud.google.com
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# ─── Email (Resend) ──────────────────────────────────────────────────────────
RESEND_API_KEY="re_..."
EMAIL_FROM="DateMe <noreply@willdate.me>"

# ─── Rate Limiting (Upstash Redis) ───────────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://....upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."

# ─── Public Variables (exposed to browser) ───────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ─── Optional: Image uploads (Cloudinary) ────────────────────────────────────
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Validation

At startup, validate that all required variables are present. Add to `lib/env.ts`:

```typescript
// lib/env.ts
// Validates required environment variables on startup.
// Throws a clear error in development if any are missing —
// this prevents mysterious runtime failures from missing config.

const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'NEXT_PUBLIC_APP_URL',
]

if (process.env.NODE_ENV !== 'test') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}
```

---

## 8. File & Folder Conventions

### Directory Structure

```
dateme/
├── app/                          ← Next.js App Router pages and API routes
│   ├── (auth)/                   ← Route group: unauthenticated pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              ← Route group: authenticated pages
│   │   └── dashboard/
│   │       ├── page.tsx          ← Sender dashboard
│   │       ├── new/page.tsx      ← Create invitation form
│   │       └── invite/[id]/page.tsx  ← Invitation detail
│   ├── invite/
│   │   └── [shortId]/
│   │       ├── page.tsx          ← "Will you date me?" page
│   │       ├── choose/page.tsx   ← Choose location
│   │       ├── time/page.tsx     ← Choose time
│   │       └── success/page.tsx  ← Celebration
│   └── api/
│       ├── invitations/
│       │   ├── route.ts          ← GET list / POST create
│       │   └── [id]/route.ts     ← GET detail / DELETE
│       └── invite/
│           └── [shortId]/
│               ├── route.ts      ← GET public data
│               └── accept/route.ts  ← POST acceptance
│
├── components/
│   ├── ui/                       ← Generic reusable UI (buttons, inputs, etc.)
│   ├── invitation/               ← Invitation-specific components
│   └── layout/                   ← Shared layout components (navbar, footer)
│
├── lib/
│   ├── prisma.ts                 ← Prisma client singleton
│   ├── email.ts                  ← Email sending functions
│   ├── ratelimit.ts              ← Upstash rate limiter
│   ├── auth.ts                   ← NextAuth config
│   ├── env.ts                    ← Environment variable validation
│   ├── constants.ts              ← App-wide constants
│   ├── routes.ts                 ← Route path constants
│   └── validations.ts            ← Zod schemas for all inputs
│
├── store/
│   └── receiverStore.ts          ← Zustand for receiver multi-step flow
│
├── types/
│   └── index.ts                  ← Shared TypeScript types and interfaces
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── auth.ts                       ← NextAuth entry point
├── middleware.ts                 ← Route protection
├── CLAUDE.md                     ← This file
├── TODO.md                       ← Current task list
├── .env.local                    ← Local secrets (gitignored)
└── package.json
```

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `FleeingNoButton.tsx` |
| Files (utilities) | camelCase | `generateInviteId.ts` |
| Files (routes) | lowercase | `route.ts`, `page.tsx` |
| React components | PascalCase | `FleeingNoButton` |
| Functions | camelCase | `generateInviteId()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_LOCATION_OPTIONS` |
| Types/Interfaces | PascalCase | `InvitationWithOptions` |
| Enums | PascalCase | `InviteStatus` |
| CSS classes | Tailwind utilities only | `text-pink-500 hover:bg-pink-50` |
| Database fields | camelCase | `shortId`, `respondedAt` |

---

## 9. Git & Commit Rules

### Commit Message Format

Every commit must follow this format:

```
<type>(<scope>): <short description>

[optional body explaining WHY, not WHAT]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature or user-visible change |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `style` | Formatting, whitespace, missing semicolons |
| `docs` | Changes to CLAUDE.md, README, comments |
| `test` | Adding or updating tests |
| `chore` | Dependency updates, config changes |
| `perf` | Performance improvements |

**Examples:**

```
feat(invite): add fleeing No button with viewport clamping

The No button now listens to mousemove events and jumps away from the
cursor whenever it enters a 130px radius. Position is clamped so it
never leaves the visible viewport area.

fix(api): prevent double acceptance of already-accepted invitations

The accept endpoint was not checking InviteStatus before writing to the
database. Added a status check with a 409 response for non-PENDING invites.

docs(claude): update session changelog after session 3
```

### Branch Naming

```
main            ← Production. Never commit directly.
dev             ← Integration branch. All feature branches merge here.
feat/<name>     ← New feature (e.g., feat/fleeing-no-button)
fix/<name>      ← Bug fix (e.g., fix/double-accept-bug)
chore/<name>    ← Maintenance (e.g., chore/update-prisma)
```

---

## 10. Testing Requirements

### Test Coverage Targets

| Layer | Target |
|---|---|
| Utility functions (`lib/`) | 100% |
| API route handlers | All happy paths + all error cases |
| React components | Critical user interactions (Yes click, form submission) |
| E2E | Full sender flow + full receiver flow |

### Test File Location

Tests live alongside the code they test:

```
lib/
  constants.ts
  constants.test.ts       ← Unit tests for constants validation logic
components/
  FleeingNoButton.tsx
  FleeingNoButton.test.tsx
app/
  api/
    invite/[shortId]/
      accept/
        route.ts
        route.test.ts
```

### Testing Stack

- **Unit/Integration:** Vitest + Testing Library
- **E2E:** Playwright
- **DB:** Use a separate test database — set `DATABASE_URL_TEST` in `.env.test`

### Required Tests Per API Route

Every API route handler must have tests for:

1. Happy path (valid input, expected output)
2. Missing required fields (should return 400)
3. Invalid field values (should return 400 with specific message)
4. Unauthenticated access on protected routes (should return 401)
5. Wrong owner access (should return 403)
6. Not found (should return 404)
7. Conflict state (e.g., accepting an already-accepted invite — should return 409)

---

## 11. Error Handling Standard

### API Response Shape

All API routes must return a consistent shape:

```typescript
// types/index.ts

/** Standard success response wrapper */
export interface ApiSuccess<T> {
  data: T
  message?: string
}

/** Standard error response wrapper */
export interface ApiError {
  error: string       // Human-readable message
  code: string        // Machine-readable error code (e.g. "INVITE_NOT_FOUND")
  details?: unknown   // Optional validation details (Zod errors, etc.)
}
```

### HTTP Status Codes

| Status | When to use |
|---|---|
| 200 | Successful GET or action |
| 201 | Resource created successfully |
| 400 | Invalid input (validation failure) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g., invite already accepted) |
| 429 | Rate limited |
| 500 | Unexpected server error (always log these) |

### Error Handling in Route Handlers

```typescript
// app/api/invite/[shortId]/accept/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { acceptInviteSchema } from '@/lib/validations'
import { InviteStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendAcceptanceEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'

/**
 * POST /api/invite/[shortId]/accept
 *
 * Records the receiver's chosen location and time options,
 * marks the invitation as accepted, and sends a notification
 * email to the sender.
 *
 * No authentication required — the receiver does not have an account.
 * Rate-limited to prevent spamming.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    // 1. Rate limit by shortId to prevent spam
    const rateLimitResult = await rateLimit(params.shortId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // 2. Validate request body shape
    const body = await req.json()
    const parsed = acceptInviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // 3. Load the invitation (fail fast if not found)
    const invitation = await prisma.invitation.findUnique({
      where: { shortId: params.shortId },
      include: { sender: true, locationOptions: true, timeOptions: true }
    })
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found.', code: 'INVITE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Reject if already accepted (idempotency guard)
    if (invitation.status !== InviteStatus.PENDING) {
      return NextResponse.json(
        { error: 'This invitation has already been responded to.', code: 'INVITE_NOT_PENDING' },
        { status: 409 }
      )
    }

    // 5. Validate chosen options belong to this invitation
    const chosenLocation = invitation.locationOptions.find(
      o => o.id === parsed.data.locationOptionId
    )
    const chosenTime = invitation.timeOptions.find(
      o => o.id === parsed.data.timeOptionId
    )
    if (!chosenLocation || !chosenTime) {
      return NextResponse.json(
        { error: 'Selected options do not belong to this invitation.', code: 'INVALID_OPTION' },
        { status: 400 }
      )
    }

    // 6. Accept the invitation and save choices atomically
    await prisma.$transaction([
      prisma.invitation.update({
        where: { shortId: params.shortId },
        data: {
          status: InviteStatus.ACCEPTED,
          chosenLocationId: chosenLocation.id,
          chosenTimeId: chosenTime.id,
          respondedAt: new Date()
        }
      })
    ])

    // 7. Send notification email to sender (non-blocking — don't fail the request if email fails)
    sendAcceptanceEmail({
      to: invitation.sender.email,
      senderName: invitation.sender.name ?? 'there',
      locationName: chosenLocation.name,
      timeLabel: chosenTime.label
    }).catch(err => {
      // Log the error but don't propagate — the invite is accepted regardless
      console.error('[email] Failed to send acceptance email:', err)
    })

    return NextResponse.json({ data: { success: true } }, { status: 200 })

  } catch (err) {
    // Log unexpected errors with context for debugging
    console.error('[api/invite/accept] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

### Client-Side Error Handling

```typescript
// Always show user-facing error messages (never expose raw error objects)
// Always provide a recovery action (retry button, back link, etc.)
// Always log technical details to the console in development

async function submitAcceptance(locationId: string, timeId: string) {
  try {
    const res = await fetch(`/api/invite/${shortId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationOptionId: locationId, timeOptionId: timeId })
    })

    if (!res.ok) {
      const err = await res.json()
      // Show the user-facing message, log the code for debugging
      console.error('[accept] Error code:', err.code)
      throw new Error(err.error ?? 'Something went wrong.')
    }

    return await res.json()

  } catch (err) {
    // Re-throw for the calling component to handle and display
    throw err
  }
}
```

---

## 12. Session Changelog

> This section is maintained by Claude. A new entry is appended at the end of every session.
> Entries are never edited — only new ones are added. The most recent session is at the bottom.

---

### Session 0 — Project Initialization

**Added:**
- `CLAUDE.md` — this file, defining all project conventions and protocols
- `DateMe_App_Spec.md` — full technical specification document covering tech stack, database schema, page map, API endpoints, email system, auth, hosting, and development phases

**Modified:**
- N/A — project not yet initialized

**Removed:**
- N/A

**Bugs Fixed:**
- N/A

**Known Issues / Next Steps:**
- Run `npx create-next-app@latest dateme --typescript --tailwind --app` to initialize the project
- Install all dependencies listed in the spec
- Create `.env.local` from the template in Section 7
- Initialize Prisma with `npx prisma init` and write `schema.prisma`
- Run first migration: `npx prisma migrate dev --name init`
- Create `lib/constants.ts`, `lib/routes.ts`, `lib/env.ts` before writing any feature code
- Implement auth with NextAuth.js before any protected routes

---

<!-- Claude: append new session entries below this line -->

### Session 1 — 2026-05-30 — Full MVP Scaffold

**Added:**
- Node.js v24 via nvm (was not installed on machine)
- Next.js 16.2.6 project initialized with TypeScript, Tailwind, App Router
- All dependencies: prisma@7, next-auth@beta, @auth/prisma-adapter, @prisma/adapter-pg, pg, framer-motion, zustand, react-hook-form, @hookform/resolvers, zod, nanoid, resend, canvas-confetti, @upstash/ratelimit, @upstash/redis
- `prisma/schema.prisma` — full schema with User, Invitation, LocationOption, TimeOption + NextAuth models (Account, Session, VerificationToken)
- `.env.local` — template with all required environment variable slots
- `lib/constants.ts` — all app-wide constants (flee radius, limits, etc.)
- `lib/routes.ts` — all route and API route path constants
- `lib/env.ts` — required env var validation at startup
- `lib/prisma.ts` — Prisma 7 singleton using `@prisma/adapter-pg`
- `lib/email.ts` — Resend-powered acceptance notification email
- `lib/ratelimit.ts` — Upstash Redis rate limiter (graceful fallback when unconfigured)
- `lib/validations.ts` — Zod schemas for create invitation + accept invitation
- `types/index.ts` — ApiSuccess, ApiError, PublicInvitation, DashboardInvitation, form input types
- `types/next-auth.d.ts` — extends Session type with `user.id`
- `store/receiverStore.ts` — Zustand store for receiver's multi-step choice flow
- `auth.config.ts` — Edge-safe NextAuth config (no Prisma imports); used by proxy.ts
- `auth.ts` — Full NextAuth config with PrismaAdapter, Google OAuth, Resend magic link
- `proxy.ts` — Next.js 16 proxy (replaces middleware.ts) using edge-safe auth
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `app/api/invitations/route.ts` — GET list + POST create (authenticated)
- `app/api/invitations/[id]/route.ts` — GET detail + DELETE (authenticated, ownership-checked)
- `app/api/invite/[shortId]/route.ts` — GET public invite data (no auth, no sender PII)
- `app/api/invite/[shortId]/accept/route.ts` — POST acceptance with rate limiting + email
- `app/layout.tsx` — root layout with Geist font and metadata
- `app/page.tsx` — landing page with hero + 3-step explainer
- `app/(auth)/login/page.tsx` — Google OAuth + magic link login page
- `app/(auth)/signup/page.tsx` — redirects to /login
- `app/(dashboard)/dashboard/page.tsx` — sender dashboard with invitation list
- `app/(dashboard)/dashboard/new/page.tsx` — create invitation page
- `app/(dashboard)/dashboard/invite/[id]/page.tsx` — invitation detail page
- `app/invite/[shortId]/page.tsx` — server component that checks status + renders InvitePage
- `app/invite/[shortId]/InvitePage.tsx` — "Will you date me?" client page
- `app/invite/[shortId]/choose/page.tsx` + `ChooseLocationClient.tsx` — location picker
- `app/invite/[shortId]/time/page.tsx` + `ChooseTimeClient.tsx` — time picker + accept submission
- `app/invite/[shortId]/success/page.tsx` + `SuccessClient.tsx` — confetti celebration page
- `components/FleeingNoButton.tsx` — cursor-fleeing No button (hidden on mobile)
- `components/invitation/InvitationCard.tsx` — dashboard card with status + copy link + delete
- `components/invitation/CreateInvitationForm.tsx` — 3-step multi-step form (message → options → preview)
- `components/ui/CopyButton.tsx` — reusable clipboard copy button with "Copied!" feedback

**Modified:**
- `prisma/schema.prisma` — replaced Prisma init placeholder with full application schema

**Removed:**
- `middleware.ts` — renamed to `proxy.ts` (Next.js 16 renamed the convention)

**Bugs Fixed:**
- Prisma 7 requires `@prisma/adapter-pg` driver adapter (can't call `new PrismaClient()` without args)
- Next.js 16 deprecated `middleware.ts` → `proxy.ts`; export must be named `proxy`
- Edge Runtime incompatibility: split auth config into `auth.config.ts` (edge-safe) and `auth.ts` (Node.js)
- Prisma 7 generated client uses `@ts-nocheck` and exports to `app/generated/prisma/` — imports must point to specific sub-files (`/client`, `/enums`)
- `zodResolver` type mismatch with `z.boolean().default(false)` — removed `.default()` from Zod schema; React Hook Form handles the default value

**Known Issues / Next Steps:**
- Database not yet provisioned — create a Neon/Supabase PostgreSQL instance and fill in `.env.local`
- Run `npx prisma migrate dev --name init` once DATABASE_URL is set
- Set up Google OAuth credentials at console.cloud.google.com
- Set up Resend account and verify domain (willdate.me)
- Set up Upstash Redis for rate limiting (optional in dev)
- Confetti animation and Framer Motion entrance animations on invite page not yet added (Phase 2)
- Image upload for location options not yet added (Phase 2)
- Dashboard polling/revalidation for live status updates not yet added
