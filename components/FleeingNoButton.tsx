'use client'

import { useRef, useEffect } from 'react'

const FLEE_RADIUS = 90  // px — start fleeing when cursor is this close
const FLEE_SPEED  = 90  // px — how far it moves each time (small = subtle)

export function FleeingNoButton() {
  const btnRef = useRef<HTMLButtonElement>(null)

  // Tracks the TARGET offset (where the button is going, not mid-animation).
  // Using target (not getBoundingClientRect) fixes the disappearing bug:
  // getBoundingClientRect returns mid-animation positions during CSS transitions,
  // which makes clamping calculations wrong and lets the button drift off screen.
  const pos = useRef({ x: 0, y: 0 })

  // Natural resting position — captured once on mount, never changes.
  const natural = useRef({ left: 0, top: 0, width: 0, height: 0 })

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    // Capture resting position before any movement
    const r = btn.getBoundingClientRect()
    natural.current = { left: r.left, top: r.top, width: r.width, height: r.height }

    const handleMouseMove = (e: MouseEvent) => {
      const n = natural.current

      // Use TARGET position (pos.current) — not getBoundingClientRect which
      // returns wherever the CSS transition currently is mid-animation.
      const targetCx = n.left + pos.current.x + n.width  / 2
      const targetCy = n.top  + pos.current.y + n.height / 2

      const dx   = e.clientX - targetCx
      const dy   = e.clientY - targetCy
      const dist = Math.hypot(dx, dy)

      if (dist < FLEE_RADIUS) {
        const angle = Math.atan2(dy, dx)
        const rawX  = pos.current.x - Math.cos(angle) * FLEE_SPEED
        const rawY  = pos.current.y - Math.sin(angle) * FLEE_SPEED

        // Clamp so the button stays fully inside the viewport at all times
        pos.current = {
          x: Math.max(-n.left, Math.min(window.innerWidth  - n.width  - n.left, rawX)),
          y: Math.max(-n.top,  Math.min(window.innerHeight - n.height - n.top,  rawY)),
        }

        btn.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <button
      ref={btnRef}
      style={{ willChange: 'transform' }}
      className="hidden sm:inline-flex items-center bg-red-800 text-white border-2 border-red-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-red-300 select-none transition-transform duration-150 ease-out"
      aria-hidden="true"
      tabIndex={-1}
      onTouchStart={(e) => e.preventDefault()}
    >
      NO
    </button>
  )
}
