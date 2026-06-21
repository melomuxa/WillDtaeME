'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

const FLEE_RADIUS = 90 // px — start fleeing when cursor is this close (desktop)
const FLEE_SPEED = 90 // px — how far it moves each time (small = subtle)

// ─── Mobile dodge behaviour ───────────────────────────────────────────────────

/** Gap kept from the screen edges when the button teleports, so it never clips. */
const VIEWPORT_MARGIN_PX = 16

/** Smallest the button is allowed to shrink to after repeated taps. */
const MIN_SCALE = 0.55

/** How much the button shrinks each time it dodges a tap. */
const SHRINK_PER_TAP = 0.08

// Escalating taunts cycled through on every dodge. Touch devices have no hover,
// so the joke on mobile is the chase: the button keeps slipping away and trash
// talks while it does. Index wraps with modulo, so it loops forever.
const TAUNTS = [
  'NO',
  'Nope 🙈',
  'Missed! 😏',
  'Too slow 🐢',
  'Try again 😂',
  'Catch me 💨',
  'Never 🙅',
  'Just say YES 😉',
] as const

interface FleeingNoButtonProps {
  /**
   * Called every time the button successfully dodges (cursor flee or tap).
   * Used by the parent to grow the YES button so it becomes more tempting.
   */
  onEvade?: () => void
}

export function FleeingNoButton({ onEvade }: FleeingNoButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  // Tracks the TARGET offset (where the button is going, not mid-animation).
  // Using target (not getBoundingClientRect) fixes the disappearing bug:
  // getBoundingClientRect returns mid-animation positions during CSS transitions,
  // which makes clamping calculations wrong and lets the button drift off screen.
  const pos = useRef({ x: 0, y: 0 })

  // Natural resting position — captured ONCE on mount, never changes.
  const natural = useRef({ left: 0, top: 0 })

  // Current scale, shrunk on each mobile tap. Kept in a ref so rapid taps don't
  // race React state updates; the label is the only thing that needs a re-render.
  const scale = useRef(1)
  const tapCount = useRef(0)

  const [label, setLabel] = useState<string>(TAUNTS[0])

  // Latest onEvade kept in a ref so the mount-only effect never lists it as a
  // dependency. If it were a dependency, every dodge (which calls onEvade →
  // parent setState → re-render → new onEvade identity) would re-run the effect,
  // recapturing `natural` from the ALREADY-translated button. That corrupted the
  // position math: the button stopped fleeing on desktop and crossed the screen
  // edge on mobile after a few interactions.
  const onEvadeRef = useRef(onEvade)
  onEvadeRef.current = onEvade

  // Writes the current target position + scale to the element in one transform.
  const applyTransform = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    btn.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current})`
  }, [])

  // Visible viewport size, excluding scrollbars (clientWidth/Height are more
  // reliable than window.innerWidth on mobile, which can include overscroll).
  const viewport = () => ({
    w: document.documentElement.clientWidth,
    h: document.documentElement.clientHeight,
  })

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    // Capture resting position before any movement
    const r = btn.getBoundingClientRect()
    natural.current = { left: r.left, top: r.top }

    // Desktop: flee from the cursor when it gets close. Touch devices don't fire
    // mousemove, so this is a no-op there — the tap handler below covers mobile.
    const handleMouseMove = (e: MouseEvent) => {
      const n = natural.current
      // Measure live so the math is correct even after the button has shrunk.
      const w = btn.offsetWidth * scale.current
      const h = btn.offsetHeight * scale.current

      // Use TARGET position (pos.current) — not getBoundingClientRect which
      // returns wherever the CSS transition currently is mid-animation.
      const targetCx = n.left + pos.current.x + w / 2
      const targetCy = n.top + pos.current.y + h / 2

      const dx = e.clientX - targetCx
      const dy = e.clientY - targetCy
      const dist = Math.hypot(dx, dy)

      if (dist < FLEE_RADIUS) {
        const angle = Math.atan2(dy, dx)
        const rawX = pos.current.x - Math.cos(angle) * FLEE_SPEED
        const rawY = pos.current.y - Math.sin(angle) * FLEE_SPEED

        // Clamp so the button stays fully inside the viewport at all times.
        // transform-origin is top-left, so the visible left edge is n.left+pos.x.
        const { w: vw, h: vh } = viewport()
        pos.current = {
          x: Math.max(VIEWPORT_MARGIN_PX - n.left, Math.min(vw - w - VIEWPORT_MARGIN_PX - n.left, rawX)),
          y: Math.max(VIEWPORT_MARGIN_PX - n.top, Math.min(vh - h - VIEWPORT_MARGIN_PX - n.top, rawY)),
        }

        applyTransform()
        onEvadeRef.current?.()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [applyTransform])

  /**
   * Mobile dodge. Fires on pointerdown — which lands BEFORE the tap completes —
   * so the button is already gone by the time the finger lifts and never counts
   * as a real press. Teleports to a random on-screen spot, shrinks a little, and
   * advances the taunt. preventDefault stops the synthetic click + any scroll.
   */
  const handleEvadeTap = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const btn = btnRef.current
      if (!btn) return

      // Advance the taunt first. Different taunts have different widths
      // ("NO" vs "Try again 😂"), so we must measure AFTER the new label is
      // in the DOM — otherwise the clamp uses the wrong width and the button
      // drifts off-screen. setLabel + rAF gives us the post-render size.
      tapCount.current += 1
      setLabel(TAUNTS[tapCount.current % TAUNTS.length])
      scale.current = Math.max(MIN_SCALE, scale.current - SHRINK_PER_TAP)
      onEvadeRef.current?.()

      requestAnimationFrame(() => {
        const n = natural.current
        // transform-origin is top-left (see style), so translate maps the
        // layout top-left exactly to (vx, vy) and the visible box is the layout
        // size times the current scale. Clamp with the SCALED size so the button
        // stays fully on-screen no matter how wide the taunt or how small it is.
        const w = btn.offsetWidth * scale.current
        const h = btn.offsetHeight * scale.current

        // Pick a random viewport position, kept fully on-screen with a margin.
        const { w: vw, h: vh } = viewport()
        const maxX = Math.max(VIEWPORT_MARGIN_PX, vw - w - VIEWPORT_MARGIN_PX)
        const maxY = Math.max(VIEWPORT_MARGIN_PX, vh - h - VIEWPORT_MARGIN_PX)
        const vx = VIEWPORT_MARGIN_PX + Math.random() * (maxX - VIEWPORT_MARGIN_PX)
        const vy = VIEWPORT_MARGIN_PX + Math.random() * (maxY - VIEWPORT_MARGIN_PX)

        // Translate is relative to the natural resting spot captured on mount.
        pos.current = { x: vx - n.left, y: vy - n.top }
        applyTransform()
      })
    },
    [applyTransform]
  )

  return (
    <button
      ref={btnRef}
      style={{ willChange: 'transform', touchAction: 'none', transformOrigin: 'top left' }}
      className="inline-flex items-center bg-red-800 text-white border-2 border-red-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-red-300 select-none transition-transform duration-150 ease-out"
      aria-hidden="true"
      tabIndex={-1}
      onPointerDown={handleEvadeTap}
    >
      {label}
    </button>
  )
}
