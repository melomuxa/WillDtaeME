# DateMe — Technical Specification

> A micro-SaaS where someone creates a personalized date invitation link, sends it to their crush, and gets notified when they accept.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Flows](#2-user-roles--flows)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Application Pages & UI Logic](#5-application-pages--ui-logic)
6. [Core Feature Logic](#6-core-feature-logic)
7. [API Endpoints](#7-api-endpoints)
8. [Email System](#8-email-system)
9. [Authentication](#9-authentication)
10. [Hosting & Infrastructure](#10-hosting--infrastructure)
11. [Project File Structure](#11-project-file-structure)
12. [Development Phases](#12-development-phases)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. Product Overview

**DateMe** lets a sender create a personalized date invitation with choices for location, food/drink, and time. A unique shareable link is generated. The receiver opens it, cannot refuse (the "No" button runs away from the cursor), accepts "Yes", picks their favorite options, and confirms a time. The sender gets an email notification and sees the response in their dashboard.

### Core Value Proposition
- Fun, memorable way to invite someone on a date
- Removes the awkward "what do you want to do?" back-and-forth
- Sender stays in control by pre-defining options

---

## 2. User Roles & Flows

### Sender (Creator)
1. Signs up / logs in
2. Creates a new date invitation:
   - Writes a personal message (optional)
   - Adds 2–4 venue/location options (name + optional photo URL)
   - Adds 2–4 food or drink options (name + optional photo URL)
   - Adds 2–4 time options (specific datetime OR "Any time — whole day")
3. Gets a unique shareable link (e.g. `dateme.app/invite/abc123xyz`)
4. Shares the link (copy, WhatsApp, Instagram DM, etc.)
5. Waits on their dashboard — sees "Pending" status
6. Receives an email when the receiver accepts, showing their chosen options
7. Dashboard updates to "Accepted" with full details

### Receiver (No account required)
1. Opens the shared link
2. Sees the animated "Will you date me?" page with "Yes" and "No" buttons
3. Cannot click "No" — it runs away from the cursor
4. Clicks "Yes"
5. Chooses one location/venue option
6. Chooses one food or drink option
7. Chooses one time option
8. Sees a success/celebration animation
9. No account needed, no personal data stored beyond their choices

---

## 3. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| **Next.js 14** (App Router) | Framework — handles routing, SSR, API routes |
| **TypeScript** | Type safety across frontend and backend |
| **Tailwind CSS** | Styling — fast, utility-first |
| **Framer Motion** | Animations — the running "No" button, celebration screen |
| **React Hook Form** | Form handling for the invitation creator |
| **Zustand** | Lightweight state for multi-step receiver flow |

### Backend
| Tool | Purpose |
|---|---|
| **Next.js API Routes** | Backend — runs on the same project, no separate server needed |
| **Prisma ORM** | Database access with type-safe queries |
| **PostgreSQL** | Primary database (hosted on Neon or Supabase) |
| **Resend** (or Nodemailer + Gmail SMTP) | Transactional emails |
| **Nanoid** | Generating short unique invite link IDs |

### Auth
| Tool | Purpose |
|---|---|
| **NextAuth.js v5** | Authentication — Google OAuth + email magic link |

### Storage (optional, for venue photos)
| Tool | Purpose |
|---|---|
| **Cloudinary** or **Uploadthing** | Image upload and hosting for venue/food option images |

### Hosting
| Tool | Purpose |
|---|---|
| **Vercel** | Deploy Next.js app (free tier works for MVP) |
| **Neon** or **Supabase** | Managed PostgreSQL (free tier available) |

---

## 4. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  image         String?
  createdAt     DateTime     @default(now())
  invitations   Invitation[]
}

model Invitation {
  id              String           @id @default(nanoid(10))
  // The short ID used in the URL: dateme.app/invite/{shortId}
  shortId         String           @unique @default(nanoid(8))

  senderId        String
  sender          User             @relation(fields: [senderId], references: [id])

  personalMessage String?          // Optional romantic message from sender
  status          InviteStatus     @default(PENDING)

  createdAt       DateTime         @default(now())
  respondedAt     DateTime?

  // Options defined by sender
  locationOptions LocationOption[]
  timeOptions     TimeOption[]

  // Choices made by receiver (null until accepted)
  chosenLocationId String?
  chosenTimeId     String?

  // Receiver response metadata
  receiverNote    String?          // Optional note from receiver (future feature)
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

model LocationOption {
  id           String     @id @default(cuid())
  invitationId String
  invitation   Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  name         String     // e.g. "Café Lula", "Sushi Garden", "Riverside Park"
  category     String?    // e.g. "Restaurant", "Café", "Outdoor", "Bar"
  imageUrl     String?    // Optional photo
  address      String?    // Optional address

  order        Int        @default(0)
}

model TimeOption {
  id           String     @id @default(cuid())
  invitationId String
  invitation   Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  label        String     // e.g. "Saturday 7 PM", "Sunday afternoon", "Any time!"
  isWholeDay   Boolean    @default(false)
  datetime     DateTime?  // Exact datetime, null if isWholeDay is true

  order        Int        @default(0)
}
```

### Key Design Decisions
- `Invitation.id` is used internally; `shortId` is the 8-character URL-safe code in the public link
- Location and time options cascade-delete if the invitation is deleted
- The receiver never has a User record — their choices are stored directly on the Invitation row

---

## 5. Application Pages & UI Logic

### Page Map

```
/                          → Landing / marketing page
/signup                    → Sign up page
/login                     → Login page
/dashboard                 → Sender's dashboard (auth required)
/dashboard/new             → Create new invitation (auth required)
/dashboard/invite/[id]     → Invitation detail & status page (auth required)
/invite/[shortId]          → Public invitation page (no auth needed)
/invite/[shortId]/choose   → Step 1: Choose location
/invite/[shortId]/time     → Step 2: Choose time
/invite/[shortId]/success  → Celebration page
```

---

### Page: `/` — Landing

- Hero headline: "Ask them out. Unforgettably."
- Short demo GIF or screenshot of the app
- "Create your invitation" CTA → `/signup`
- Simple 3-step explainer: Create → Share → They say yes

---

### Page: `/dashboard` — Sender Dashboard

**Components:**
- List of all invitations created by the logged-in user
- Each card shows:
  - Status badge: `Pending` / `Accepted` / `Expired`
  - Creation date
  - Short link with copy button
  - If Accepted: chosen location name, chosen time label
- "Create New Invitation" button → `/dashboard/new`

**State logic:**
- Poll or use Vercel's on-demand revalidation so status updates appear without full page reload
- Accepted invitations highlight in green with a ❤ icon

---

### Page: `/dashboard/new` — Create Invitation

Multi-step form (3 steps, progress bar at top):

**Step 1 — Personal Message**
- Text area: "Write a message to your date (optional)" — max 280 characters
- Example placeholder: "Hey, I'd love to take you out this weekend... 🌸"

**Step 2 — Add Options**
- Location/Venue options (min 1, max 4):
  - Name (required)
  - Category (optional dropdown: Restaurant, Café, Bar, Outdoor, Other)
  - Image URL or upload (optional)
  - Address (optional)
  - Add / remove option buttons
- Time options (min 1, max 4):
  - Label (required) — free text like "Saturday 8 PM"
  - Toggle: "Whole day / any time" (hides datetime picker if on)
  - Datetime picker (if not whole day)

**Step 3 — Preview & Create**
- Preview card showing how the invitation will look
- "Create Invitation" button
- On success: modal showing the shareable link with copy button and share options (WhatsApp, copy link)

**Validation rules:**
- At least 1 location option required
- At least 1 time option required
- Each option name is required and max 60 characters
- Personal message max 280 characters

---

### Page: `/invite/[shortId]` — The Invitation Page

This is the main fun page. The receiver sees this.

**Layout:**
- Animated entrance: hearts or sparkles float in, the question fades in
- Personal message displayed (if set by sender) — styled like a handwritten note
- Large text: "Will you go on a date with me? 💕"
- Two buttons:
  - `YES ✨` — large, centered, easy to click, slightly animated (gentle pulse)
  - `NO` — smaller, positioned nearby

**The "No" Button Logic (JavaScript):**
```
1. Listen for `mousemove` event on the document
2. Calculate distance between mouse cursor and the center of the "No" button
3. If distance < FLEE_RADIUS (e.g. 120px):
   a. Calculate a flee direction (opposite of the mouse vector)
   b. Compute new position: current position + flee vector * FLEE_SPEED
   c. Clamp the new position so the button stays within viewport bounds
   d. Apply new position via CSS `transform: translate(x, y)` with no transition
4. On mobile (touch devices):
   a. Disable touch events on the "No" button entirely
   b. OR shrink it to near-invisible so it cannot be tapped
5. Button has no onClick handler — clicking it does nothing even if somehow caught
```

**"Yes" Button Logic:**
- `onClick` → Navigate to `/invite/[shortId]/choose`
- Trigger a small burst animation on click (hearts fly out)

**Error states:**
- If `shortId` not found → 404 page: "Hmm, this invitation doesn't exist 🥺"
- If invitation is already `ACCEPTED` → "This date is already happening! 🎉"
- If invitation is `EXPIRED` → "Oh no, this invitation has expired 😢"

---

### Page: `/invite/[shortId]/choose` — Choose Location

**Layout:**
- Progress dots at top: ① Location  ○ Time
- Heading: "Where would you like to go? 🍽️"
- Grid of location option cards (2 columns):
  - Each card: image (or emoji placeholder), name, category badge, address
  - Hover: card glows / lifts
  - Click: card gets a checkmark, Continue button activates
- "Continue →" button (disabled until one card is selected)

**State:**
- Selected option ID stored in Zustand store keyed by `shortId`
- On "Continue" → navigate to `/invite/[shortId]/time`

---

### Page: `/invite/[shortId]/time` — Choose Time

**Layout:**
- Progress dots: ✓ Location  ② Time
- Heading: "When works for you? 🗓️"
- List of time option cards:
  - Label (e.g. "Saturday, June 14 at 8 PM")
  - If `isWholeDay`: shows "Any time this day 🌟" badge
  - Click to select
- "Confirm Date! 💕" button

**On confirm:**
1. Call `POST /api/invite/[shortId]/accept` with `{ locationOptionId, timeOptionId }`
2. Show loading spinner
3. On success → navigate to `/invite/[shortId]/success`
4. API marks invitation as `ACCEPTED`, records choices, sends email to sender

---

### Page: `/invite/[shortId]/success` — Celebration

- Full-screen confetti animation (use `canvas-confetti` library)
- Animated hearts raining down
- Large text: "You said YES! 🎉"
- Subtext: "They're going to be SO happy. Get ready for an amazing date! 💖"
- Static — no further action needed from receiver

---

## 6. Core Feature Logic

### Generating the Shareable Link

```typescript
// lib/invitations.ts
import { nanoid } from 'nanoid'

async function createInvitation(senderId: string, data: CreateInvitationInput) {
  const shortId = nanoid(8) // e.g. "aB3xK9mQ"

  const invitation = await prisma.invitation.create({
    data: {
      shortId,
      senderId,
      personalMessage: data.personalMessage,
      locationOptions: {
        create: data.locationOptions.map((opt, i) => ({ ...opt, order: i }))
      },
      timeOptions: {
        create: data.timeOptions.map((opt, i) => ({ ...opt, order: i }))
      }
    }
  })

  return {
    invitation,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${shortId}`
  }
}
```

---

### The Fleeing "No" Button

```typescript
// components/FleeingNoButton.tsx
'use client'
import { useRef, useEffect, useState } from 'react'

const FLEE_RADIUS = 130   // px — how close before it runs
const FLEE_SPEED  = 180   // px — how far it jumps each time

export function FleeingNoButton() {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const btn = btnRef.current
      if (!btn) return

      const rect = btn.getBoundingClientRect()
      const btnCx = rect.left + rect.width / 2
      const btnCy = rect.top  + rect.height / 2

      const dx = e.clientX - btnCx
      const dy = e.clientY - btnCy
      const dist = Math.hypot(dx, dy)

      if (dist < FLEE_RADIUS) {
        // Flee in the opposite direction of the mouse
        const angle = Math.atan2(dy, dx)
        const fleeX = -Math.cos(angle) * FLEE_SPEED
        const fleeY = -Math.sin(angle) * FLEE_SPEED

        setOffset(prev => {
          const newX = prev.x + fleeX
          const newY = prev.y + fleeY

          // Clamp within viewport
          const maxX = window.innerWidth  - rect.width  - rect.left + prev.x
          const maxY = window.innerHeight - rect.height - rect.top  + prev.y
          const minX = -rect.left + prev.x

          return {
            x: Math.max(minX, Math.min(maxX, newX)),
            y: Math.max(-rect.top + prev.y, Math.min(maxY, newY))
          }
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <button
      ref={btnRef}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="flee-btn"
      aria-hidden="true"         // Hidden from screen readers — it's decorative
      tabIndex={-1}              // Not focusable via keyboard
      onTouchStart={(e) => e.preventDefault()}  // Block mobile tap
    >
      No
    </button>
  )
}
```

**Mobile handling:**
- On touch devices, the button is completely hidden (`display: none`) — there is no cursor to flee from
- This is correct UX: on mobile, "Yes" is the only visible option

---

### Accepting the Invitation

```typescript
// app/api/invite/[shortId]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAcceptanceEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: { shortId: string } }
) {
  const { shortId } = params
  const { locationOptionId, timeOptionId } = await req.json()

  // 1. Validate invitation exists and is still pending
  const invitation = await prisma.invitation.findUnique({
    where: { shortId },
    include: {
      sender: true,
      locationOptions: true,
      timeOptions: true
    }
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
  if (invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invitation already responded to' }, { status: 409 })
  }

  // 2. Validate that chosen options belong to this invitation
  const validLocation = invitation.locationOptions.find(o => o.id === locationOptionId)
  const validTime     = invitation.timeOptions.find(o => o.id === timeOptionId)

  if (!validLocation || !validTime) {
    return NextResponse.json({ error: 'Invalid option selection' }, { status: 400 })
  }

  // 3. Mark accepted and save choices
  await prisma.invitation.update({
    where: { shortId },
    data: {
      status: 'ACCEPTED',
      chosenLocationId: locationOptionId,
      chosenTimeId: timeOptionId,
      respondedAt: new Date()
    }
  })

  // 4. Send email to sender
  await sendAcceptanceEmail({
    to: invitation.sender.email,
    senderName: invitation.sender.name ?? 'You',
    locationName: validLocation.name,
    timeLabel: validTime.label
  })

  return NextResponse.json({ success: true })
}
```

---

### Rate Limiting (Security)

To prevent spam submissions on a single invite link:
- Use `@upstash/ratelimit` + Upstash Redis (free tier)
- Max 3 acceptance attempts per `shortId` per hour
- IP-based limiting on `/api/invite/[shortId]/accept`

---

## 7. API Endpoints

| Method | Path | Auth? | Description |
|---|---|---|---|
| `POST` | `/api/invitations` | Yes | Create a new invitation |
| `GET`  | `/api/invitations` | Yes | List sender's invitations |
| `GET`  | `/api/invitations/[id]` | Yes | Get full invitation details |
| `DELETE` | `/api/invitations/[id]` | Yes | Delete an invitation |
| `GET`  | `/api/invite/[shortId]` | No | Get public invitation data (options only, no sender PII) |
| `POST` | `/api/invite/[shortId]/accept` | No | Submit receiver's choices |

### Public invite response shape (`GET /api/invite/[shortId]`)

```json
{
  "shortId": "aB3xK9mQ",
  "personalMessage": "Hey, I'd love to take you out this weekend 🌸",
  "status": "PENDING",
  "locationOptions": [
    { "id": "clx1...", "name": "Café Lula", "category": "Café", "imageUrl": "..." },
    { "id": "clx2...", "name": "Sushi Garden", "category": "Restaurant", "imageUrl": null }
  ],
  "timeOptions": [
    { "id": "clt1...", "label": "Saturday 8 PM", "isWholeDay": false },
    { "id": "clt2...", "label": "Any time Sunday", "isWholeDay": true }
  ]
}
```

Note: sender email and internal IDs are never exposed in the public endpoint.

---

## 8. Email System

### Provider
Use **Resend** — simple API, good free tier (3,000 emails/month), React email template support.

### Emails Sent

**1. Acceptance Notification (to Sender)**

Trigger: receiver submits their choices via `POST /api/invite/[shortId]/accept`

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AcceptanceEmailProps {
  to: string
  senderName: string
  locationName: string
  timeLabel: string
}

export async function sendAcceptanceEmail(props: AcceptanceEmailProps) {
  await resend.emails.send({
    from: 'DateMe <noreply@dateme.app>',
    to: props.to,
    subject: '💕 They said YES!',
    html: `
      <h1>They said YES! 🎉</h1>
      <p>Great news, ${props.senderName}!</p>
      <p>Your date invitation was accepted. Here are the details:</p>
      <ul>
        <li><strong>Where:</strong> ${props.locationName}</li>
        <li><strong>When:</strong> ${props.timeLabel}</li>
      </ul>
      <p>Go check your dashboard for full details.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard →</a>
    `
  })
}
```

**2. Magic Link / Welcome Email (to Sender on Signup)**
- Handled automatically by NextAuth.js email provider

---

## 9. Authentication

Using **NextAuth.js v5** (also called Auth.js).

```typescript
// auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      from: 'noreply@dateme.app',
    }),
  ],
  pages: {
    signIn: '/login',
  },
})
```

**Protected routes:** `/dashboard` and all sub-routes require a session. Use Next.js middleware:

```typescript
// middleware.ts
import { auth } from '@/auth'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*']
}
```

---

## 10. Hosting & Infrastructure

### Recommended Setup (MVP — $0/month)

| Service | Free tier limits | Used for |
|---|---|---|
| **Vercel** | 100 GB bandwidth, unlimited deployments | Next.js hosting + API routes |
| **Neon** | 0.5 GB storage, 1 project | PostgreSQL database |
| **Resend** | 3,000 emails/month | Transactional emails |
| **Upstash** | 10,000 commands/day | Redis for rate limiting |
| **Cloudinary** | 25 GB storage | Venue/food images (optional) |

### Environment Variables

```bash
# .env.local

DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

RESEND_API_KEY="re_..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

NEXT_PUBLIC_APP_URL="https://dateme.app"
```

---

## 11. Project File Structure

```
dateme/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    ← Sender dashboard
│   │   │   ├── new/page.tsx                ← Create invitation form
│   │   │   └── invite/[id]/page.tsx        ← Invitation detail
│   ├── invite/
│   │   └── [shortId]/
│   │       ├── page.tsx                    ← "Will you date me?" page
│   │       ├── choose/page.tsx             ← Location choice
│   │       ├── time/page.tsx               ← Time choice
│   │       └── success/page.tsx            ← Celebration
│   ├── api/
│   │   ├── invitations/
│   │   │   ├── route.ts                    ← GET list, POST create
│   │   │   └── [id]/route.ts               ← GET, DELETE by id
│   │   └── invite/
│   │       └── [shortId]/
│   │           ├── route.ts                ← GET public invite data
│   │           └── accept/route.ts         ← POST acceptance
│   ├── layout.tsx
│   └── page.tsx                            ← Landing page
│
├── components/
│   ├── FleeingNoButton.tsx                 ← The running No button
│   ├── InvitationCard.tsx                  ← Dashboard card
│   ├── CreateInvitationForm.tsx            ← Multi-step form
│   ├── LocationOptionCard.tsx              ← Receiver choice card
│   ├── TimeOptionCard.tsx                  ← Time choice card
│   ├── ConfettiOverlay.tsx                 ← Success animation
│   └── ui/                                 ← Shadcn/ui components
│
├── lib/
│   ├── prisma.ts                           ← Prisma client singleton
│   ├── email.ts                            ← Email sending functions
│   ├── ratelimit.ts                        ← Upstash rate limiter
│   └── validations.ts                      ← Zod schemas
│
├── store/
│   └── receiverStore.ts                    ← Zustand store for receiver flow
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── auth.ts
├── middleware.ts
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 12. Development Phases

### Phase 1 — Core MVP (2–3 weeks)

- [ ] Set up Next.js + Prisma + PostgreSQL
- [ ] Auth with Google OAuth
- [ ] Create invitation form (no image upload yet)
- [ ] Generate shareable links
- [ ] "Will you date me?" page with fleeing No button
- [ ] Location choice page
- [ ] Time choice page
- [ ] Success page (simple, no confetti yet)
- [ ] Acceptance API endpoint
- [ ] Email notification to sender
- [ ] Basic dashboard showing status

### Phase 2 — Polish (1–2 weeks)

- [ ] Confetti animation on success page
- [ ] Animated entrance on invitation page (hearts, sparkles)
- [ ] Mobile: hide No button completely, optimize for touch
- [ ] Image upload for location options (Cloudinary)
- [ ] Dashboard invitation detail page with chosen options
- [ ] Rate limiting on acceptance endpoint
- [ ] Error and loading states throughout

### Phase 3 — Growth Features (ongoing)

- [ ] Copy link / share buttons (WhatsApp, Instagram link)
- [ ] Invitation expiry (auto-expire after N days)
- [ ] Custom theme per invitation (dark/light/romantic/playful)
- [ ] Receiver can leave a short note with acceptance
- [ ] Link shortener (custom vanity URLs)
- [ ] Analytics: how many times link was opened vs accepted
- [ ] Reminder email to sender after 3 days if still pending

---

## 13. Future Enhancements

| Feature | Description |
|---|---|
| **Multiple invitations per link** | Let several people receive the same link (first to accept wins) |
| **Calendar export** | After acceptance, generate `.ics` file for both sender and receiver |
| **QR code** | Generate a QR code for the invitation link to share in person |
| **Custom domain invites** | `your-name.dateme.app/invite/abc` |
| **Animated themes** | Valentine's, summer, cinematic — different visual themes |
| **Waitlist mode** | If already accepted, redirect new openers to a waitlist |
| **Pro plan** | Remove branding, custom themes, analytics dashboard |

---

## Quick Start Commands

```bash
# 1. Clone / initialize
npx create-next-app@latest dateme --typescript --tailwind --app

# 2. Install dependencies
npm install prisma @prisma/client @auth/prisma-adapter next-auth \
  framer-motion zustand react-hook-form zod nanoid resend \
  canvas-confetti @upstash/ratelimit @upstash/redis

npm install -D @types/canvas-confetti

# 3. Init Prisma
npx prisma init

# 4. After writing schema.prisma:
npx prisma migrate dev --name init
npx prisma generate

# 5. Run development server
npm run dev
```

---

*Built with Next.js · PostgreSQL · Resend · Hosted on Vercel*
