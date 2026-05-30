'use client'

import { useRef, useEffect, useState } from 'react'
import { NO_BUTTON_FLEE_RADIUS_PX, NO_BUTTON_FLEE_SPEED_PX } from '@/lib/constants'

/**
 * A "No" button that flees the cursor whenever it gets too close.
 * On touch devices it is hidden entirely — there's no cursor to flee from,
 * and we don't want it accidentally tappable.
 */
export function FleeingNoButton() {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const btn = btnRef.current
      if (!btn) return

      const rect = btn.getBoundingClientRect()
      const btnCx = rect.left + rect.width / 2
      const btnCy = rect.top + rect.height / 2

      const dx = e.clientX - btnCx
      const dy = e.clientY - btnCy
      const dist = Math.hypot(dx, dy)

      if (dist < NO_BUTTON_FLEE_RADIUS_PX) {
        const angle = Math.atan2(dy, dx)
        const fleeX = -Math.cos(angle) * NO_BUTTON_FLEE_SPEED_PX
        const fleeY = -Math.sin(angle) * NO_BUTTON_FLEE_SPEED_PX

        setOffset((prev) => {
          const newX = prev.x + fleeX
          const newY = prev.y + fleeY

          // Clamp so the button never leaves the visible viewport.
          // We subtract the button's size to prevent clipping at edges.
          const maxX = window.innerWidth - rect.width - rect.left + prev.x
          const maxY = window.innerHeight - rect.height - rect.top + prev.y
          const minX = -rect.left + prev.x
          const minY = -rect.top + prev.y

          return {
            x: Math.max(minX, Math.min(maxX, newX)),
            y: Math.max(minY, Math.min(maxY, newY)),
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
      // Hidden from screen readers and keyboard navigation — it's decorative.
      // On touch devices display:none removes it so only "Yes" is visible.
      className="hidden sm:inline-flex items-center text-gray-400 border border-gray-200 bg-white px-6 py-3 rounded-full text-sm font-medium hover:text-gray-600 transition-none select-none"
      aria-hidden="true"
      tabIndex={-1}
      onTouchStart={(e) => e.preventDefault()}
    >
      No
    </button>
  )
}
