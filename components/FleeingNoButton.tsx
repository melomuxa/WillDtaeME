'use client'

import { useRef, useEffect } from 'react'

const FLEE_RADIUS = 90   // px — start fleeing when mouse is this close
const FLEE_SPEED  = 220  // px — how far it jumps each time

/**
 * NO button that flees the cursor.
 *
 * - Direct DOM mutation (no React state) → zero re-render latency
 * - CSS transition on transform → browser interpolates smoothly between jumps
 * - Large radius (90px) means it starts moving before the cursor reaches it
 */
export function FleeingNoButton() {
  const btnRef = useRef<HTMLButtonElement>(null)
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const btnCx = rect.left + rect.width  / 2
      const btnCy = rect.top  + rect.height / 2

      const dx   = e.clientX - btnCx
      const dy   = e.clientY - btnCy
      const dist = Math.hypot(dx, dy)

      if (dist < FLEE_RADIUS) {
        // Flee in the exact opposite direction of the incoming mouse
        const angle  = Math.atan2(dy, dx)
        const fleeX  = -Math.cos(angle) * FLEE_SPEED
        const fleeY  = -Math.sin(angle) * FLEE_SPEED

        const raw = {
          x: pos.current.x + fleeX,
          y: pos.current.y + fleeY,
        }

        // Clamp: keep button fully inside the viewport
        pos.current = {
          x: Math.max(-rect.left + pos.current.x,
             Math.min(window.innerWidth  - rect.right  + pos.current.x, raw.x)),
          y: Math.max(-rect.top  + pos.current.y,
             Math.min(window.innerHeight - rect.bottom + pos.current.y, raw.y)),
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
      // transition-transform makes each jump smooth; duration-100 keeps it fast
      style={{ willChange: 'transform' }}
      className="hidden sm:inline-flex items-center bg-red-800 hover:bg-red-900 text-white border-2 border-red-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-red-300 select-none transition-transform duration-100 ease-out"
      aria-hidden="true"
      tabIndex={-1}
      onTouchStart={(e) => e.preventDefault()}
    >
      NO
    </button>
  )
}
