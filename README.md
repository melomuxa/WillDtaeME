# WillDate.me 💕

> A micro-SaaS where someone creates a personalized date invitation link, sends it to their crush, and gets notified when they accept.

---

## What it does

**Sender flow:**
1. Sign in with Google or magic link email
2. Create an invitation — write a personal message, pick venue options with icons, add time slots
3. Get a unique shareable link (e.g. `willdate.me/invite/aB3xK9mQ`)
4. Share via WhatsApp or copy link
5. Receive an email when the receiver accepts, dashboard updates with their choices

**Receiver flow (no account needed):**
1. Open the link
2. See the "Will you go on a date with me?" page — `YES ✨` button and a red `NO` button that flees the cursor before you can hover on it
3. Click YES → pick a location → pick a time (or suggest a date/time if the slot is "Any time")
4. See a confetti celebration screen

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Animation | CSS transitions, canvas-confetti |
| Auth | NextAuth.js v5 beta — Google OAuth + Resend magic link |
| Database | PostgreSQL (Neon) via Prisma 7 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Email | Resend |
| Rate limiting | Upstash Redis (optional) |
| ID generation | Nanoid |
| Hosting | Vercel (recommended) |

---

## Project structure

```
app/
  (auth)/login/            — Sign in page (Google + magic link)
  (dashboard)/dashboard/   — Sender dashboard
    new/                   — Create invitation (3-step form)
    invite/[id]/           — Invitation detail & status
  invite/[shortId]/        — Public invite page ("Will you date me?")
    choose/                — Receiver picks location
    time/                  — Receiver picks time
    success/               — Celebration page
  api/
    auth/[...nextauth]/    — NextAuth handler
    invitations/           — CRUD (authenticated)
    invite/[shortId]/      — Public invite read
      accept/              — POST acceptance

components/
  FleeingNoButton.tsx      — Cursor-fleeing NO button (direct DOM, no React state lag)
  invitation/
    CreateInvitationForm.tsx  — 3-step form with emoji category picker
    InvitationCard.tsx        — Dashboard card with status + copy link

lib/
  constants.ts   — All magic numbers, category icons, flee radius
  routes.ts      — All route and API path constants
  prisma.ts      — Prisma singleton (pg adapter)
  email.ts       — Resend acceptance email
  ratelimit.ts   — Upstash rate limiter (graceful skip when unconfigured)
  validations.ts — Zod schemas
  env.ts         — Startup env var validation

store/
  receiverStore.ts   — Zustand store for receiver multi-step flow

types/
  index.ts           — Shared TypeScript interfaces
  next-auth.d.ts     — Session type extension (user.id)
```

---

## Location category icons

The invitation creator picks a category using emoji buttons:

| Category | Icon |
|---|---|
| Restaurant | 🍽️ |
| Café | ☕ |
| Bar | 🍸 |
| Cinema | 🍿 |
| Outdoor | 🌳 |
| Other → custom | 🍦🍺🍕🍜🥗🍰🌮🍣🚶🚴🚗🎮🎭🏊🎳🎨 |

---

## Local development setup

### 1. Install Node.js (if not installed)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc
nvm install --lts
```

### 2. Clone and install dependencies

```bash
git clone https://github.com/melomuxa/WillDtaeME.git
cd WillDtaeME
npm install
```

### 3. Set up environment variables

Copy `.env.local` and fill in the values:

```bash
# Database — get a free Postgres at https://neon.tech
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Auth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth — https://console.cloud.google.com
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Resend — https://resend.com
RESEND_API_KEY="re_..."
EMAIL_FROM="WillDate.me <onboarding@resend.dev>"

# Upstash Redis — optional, rate limiting is skipped when empty
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Public
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Also set `DATABASE_URL` in `.env` (used by Prisma CLI):

```bash
DATABASE_URL="postgresql://..."
```

### 4. Run database migration

```bash
npx prisma migrate dev --name init
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key technical decisions

**Prisma 7** requires a driver adapter — `@prisma/adapter-pg` is used. `new PrismaClient()` without an adapter throws.

**Next.js 16** renamed `middleware.ts` → `proxy.ts`. The named export must be `proxy`.

**Auth split** — `auth.config.ts` (edge-safe, no Prisma) is used by `proxy.ts`. `auth.ts` (with PrismaAdapter + Resend provider) is used by server components and API routes. The Resend email provider requires a database adapter and cannot be in the edge config.

**NO button** — uses direct DOM mutation (`btn.style.transform`) instead of React state so there is zero re-render latency. Flee radius is 90px so it starts moving before the cursor reaches it. CSS `transition-transform duration-100` makes it smooth.

**Receiver time suggestion** — when a sender marks a time slot as "Any time — whole day", the receiver gets a `datetime-local` picker capped at today + 14 days. Their suggestion is stored in `receiverNote` on the invitation.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

For production, set `NEXT_PUBLIC_APP_URL` to your real domain and add it as an authorized redirect URI in Google Cloud Console.

---

## Database schema (Prisma)

```
User          — sender accounts (NextAuth)
Invitation    — the date invite (shortId = public URL token)
LocationOption — venue choices added by sender
TimeOption    — time slots added by sender
Account/Session/VerificationToken — NextAuth adapter tables
```

---

*Built with Next.js · PostgreSQL · Resend · Hosted on Vercel*
