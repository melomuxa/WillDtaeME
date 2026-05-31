# WillDate.me 💕

> A micro-SaaS where someone creates a personalized date invitation link, sends it to their crush, and gets notified when they accept.

**Live:** [willdate.me](https://willdate.me)

---

## What it does

**Sender flow:**
1. Sign in with Google or magic link email
2. Create an invitation — enter recipient name, write a personal message, pick venue options with icons, add time slots
3. Get a unique shareable link (e.g. `willdate.me/invite/aB3xK9mQ`)
4. Share via WhatsApp or copy link
5. Receive a personalised email ("Liza said YES! 💕") and see it in the dashboard

**Receiver flow (no account needed):**
1. Open the link
2. See the "Will you go on a date with me?" page — `YES ✨` and a dark red `NO` button that flees the cursor the moment it gets close
3. Click YES → pick a location → pick a time (or suggest a specific date/time if the slot is "Any time")
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
| Email | Resend (domain: willdate.me) |
| Rate limiting | Upstash Redis (optional) |
| ID generation | Nanoid |
| DNS | Cloudflare |
| Hosting | Vercel |

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
    time/                  — Receiver picks time (+ whole-day date picker)
    success/               — Confetti celebration
  api/
    auth/[...nextauth]/    — NextAuth handler
    invitations/           — CRUD (authenticated)
    invite/[shortId]/      — Public invite read
      accept/              — POST acceptance (rate limited)
  sitemap.ts               — Auto-generated sitemap.xml
  robots.ts                — robots.txt

components/
  FleeingNoButton.tsx         — Cursor-fleeing NO button (direct DOM, no React re-renders)
  invitation/
    CreateInvitationForm.tsx  — 3-step form with emoji category picker
    InvitationCard.tsx        — Dashboard card with status + copy link

lib/
  constants.ts   — All magic numbers, category icons, flee radius
  routes.ts      — All route and API path constants
  prisma.ts      — Prisma singleton (pg adapter, pooled for Vercel)
  email.ts       — Resend acceptance email with recipient name + donation section
  ratelimit.ts   — Upstash rate limiter (skipped when unconfigured)
  validations.ts — Zod schemas
  env.ts         — Startup env var validation

store/
  receiverStore.ts   — Zustand store for receiver multi-step flow

types/
  index.ts           — Shared TypeScript interfaces
  next-auth.d.ts     — Session type extension (user.id)

prisma/
  schema.prisma      — Full schema incl. recipientName field
  migrations/        — All applied migrations
```

---

## Location category icons

The invitation creator picks a category first — the name field then shows a context-aware placeholder.

| Category | Icon | Example placeholder |
|---|---|---|
| Restaurant | 🍽️ | `Dinner at Bella Napoli…` |
| Café | ☕ | `Let's grab a coffee at…` |
| Bar | 🍸 | `Cocktails at Sky Lounge…` |
| Cinema | 🍿 | `IMAX Vue City Centre…` |
| Outdoor | 🌳 | `Evening walk by the river…` |
| Other → custom | 🍦🍺🍕🍜🥗🍰🌮🍣🚶🚴🚗🎮🎭🏊🎳🎨 | icon-specific hints |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL — use **pooled** URL for Vercel |
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Full production URL e.g. `https://willdate.me` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `EMAIL_FROM` | ✅ | e.g. `WillDate.me <noreply@willdate.me>` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full production URL e.g. `https://willdate.me` |
| `UPSTASH_REDIS_REST_URL` | optional | Rate limiting — skipped if empty |
| `UPSTASH_REDIS_REST_TOKEN` | optional | Rate limiting — skipped if empty |
| `NEXT_PUBLIC_DONATION_URL` | optional | Donation link — all donation UI hidden if empty |

---

## Local development setup

### 1. Install Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc
nvm install --lts
```

### 2. Clone and install

```bash
git clone https://github.com/melomuxa/WillDtaeME.git
cd WillDtaeME
npm install
```

### 3. Set up `.env.local` and `.env`

Fill in required variables from the table above.
- `.env.local` — used by Next.js at runtime
- `.env` — used by Prisma CLI (`DATABASE_URL` only, use direct connection not pooled)

### 4. Run database migration

```bash
npx prisma migrate dev --name init
```

### 5. Start dev server

```bash
source ~/.zshrc   # loads nvm so npm is available
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production deployment

1. **Vercel** — import `melomuxa/WillDtaeME`, add all env vars, deploy
2. **Neon** — use the **pooled** connection string in `DATABASE_URL` on Vercel (serverless requirement)
3. **Cloudflare** — domain DNS pointing to Vercel (A record + CNAME). SSL/TLS set to **Full (strict)**
4. **Google Console** — add `https://willdate.me` as authorized JavaScript origin and `https://willdate.me/api/auth/callback/google` as redirect URI
5. **Resend** — verify `willdate.me` domain, set `EMAIL_FROM=WillDate.me <noreply@willdate.me>`

---

## Key technical decisions

**Prisma 7** requires a driver adapter — `@prisma/adapter-pg` is used. `new PrismaClient()` without args throws. On Vercel use Neon's **pooled** connection string to avoid serverless connection timeouts.

**No middleware/proxy** — `proxy.ts` was removed because NextAuth's `auth` function intercepts `/api/auth/*` routes regardless of the matcher, causing JWT state mismatches. Dashboard routes are protected server-side via `auth()` in each server component instead.

**Auth split** — `auth.config.ts` (edge-safe, no Prisma, no Resend provider) is kept for future use. `auth.ts` (with PrismaAdapter + Resend) is used by all server routes. Resend requires a DB adapter and cannot be in the edge config.

**NO button** — uses direct DOM mutation (`btn.style.transform`) not React state, so movement is zero-latency. Natural position captured on mount for correct viewport clamping during CSS transitions. Flee radius 90px, speed 90px, `transition-transform duration-150` for smooth animation.

**Recipient name** — stored as `recipientName` on the Invitation. Dashboard badge shows "Liza said YES! ❤️", email subject becomes "💕 Liza said YES!", detail page title becomes "Invitation for Liza".

**Donation system** — all donation UI (landing page button, create success card, email section) is hidden when `NEXT_PUBLIC_DONATION_URL` is empty. Set the env var in Vercel to re-enable with zero code changes.

**SEO** — `app/sitemap.ts` generates `/sitemap.xml`, `app/robots.ts` generates `/robots.txt` blocking `/dashboard` and `/api`. Full OpenGraph + Twitter card metadata in `layout.tsx`. Submitted to Google Search Console.

---

## Database schema

```
User              — sender accounts (NextAuth)
Invitation        — the date invite (shortId = public URL token, recipientName = who it's for)
LocationOption    — venue choices defined by sender
TimeOption        — time slots defined by sender (isWholeDay supported)
Account / Session / VerificationToken — NextAuth adapter tables
```

---

*Built with Next.js · PostgreSQL · Resend · Cloudflare · Deployed on Vercel*
