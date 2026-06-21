'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FleeingNoButton } from '@/components/FleeingNoButton'
import { ROUTES } from '@/lib/routes'
import type { PublicInvitation } from '@/types'

interface InvitePageProps {
  invitation: PublicInvitation
}

/** How much the YES button grows per dodge, and the cap on total growth. */
const YES_GROWTH_PER_EVADE = 0.06
const YES_MAX_GROWTH = 0.6

export function InvitePage({ invitation }: InvitePageProps) {
  const router = useRouter()

  // Every time NO dodges (cursor flee or mobile tap), YES gets a little bigger —
  // the harder NO is to catch, the more tempting YES becomes.
  const [evadeCount, setEvadeCount] = useState(0)
  const yesScale = 1 + Math.min(evadeCount * YES_GROWTH_PER_EVADE, YES_MAX_GROWTH)

  // The No button avoids this rect so it never teleports on top of Yes (a tap
  // on a No covering Yes would otherwise fall through and accept by accident).
  // We report Yes's MAXIMUM footprint: its center is fixed (center-origin
  // scaling) but it grows with a transition, so the live rect is too small
  // mid-animation. offsetWidth is the unscaled size; × max scale = final size.
  const yesRef = useRef<HTMLButtonElement>(null)
  const getYesAvoidRect = () => {
    const el = yesRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const maxScale = 1 + YES_MAX_GROWTH
    const halfW = (el.offsetWidth * maxScale) / 2
    const halfH = (el.offsetHeight * maxScale) / 2
    return { left: cx - halfW, top: cy - halfH, right: cx + halfW, bottom: cy + halfH }
  }

  function handleYes() {
    router.push(ROUTES.INVITE_CHOOSE(invitation.shortId))
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 via-white to-rose-50 px-6 relative overflow-hidden">
      {/* Decorative background hearts */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {['top-10 left-10', 'top-24 right-16', 'bottom-20 left-20', 'bottom-40 right-10'].map(
          (pos, i) => (
            <span
              key={i}
              className={`absolute text-pink-200 text-4xl opacity-40 ${pos}`}
            >
              ❤️
            </span>
          )
        )}
      </div>

      <div className="text-center max-w-md relative z-10">
        <p className="text-6xl mb-6 animate-bounce">💕</p>

        {invitation.personalMessage && (
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm px-6 py-5 mb-10 text-left">
            <p className="text-gray-700 italic text-lg leading-relaxed">
              &ldquo;{invitation.personalMessage}&rdquo;
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          {/* Yes button — primary, pulsing, easy to click. Grows as NO dodges. */}
          <button
            ref={yesRef}
            onClick={handleYes}
            style={{ transform: `scale(${yesScale})` }}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg shadow-pink-200 transition-transform duration-300 animate-pulse hover:animate-none active:scale-95"
          >
            YES ✨
          </button>

          {/* No button — flees the cursor on desktop, dodges taps on mobile */}
          <FleeingNoButton onEvade={() => setEvadeCount((c) => c + 1)} getAvoidRect={getYesAvoidRect} />
        </div>
      </div>
    </main>
  )
}
