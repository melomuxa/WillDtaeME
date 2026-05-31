'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

/**
 * Celebration page — shown to the receiver after they accept the invitation.
 * Fires confetti on mount.
 */
export function SuccessClient() {
  useEffect(() => {
    // Fire confetti bursts from both sides
    const end = Date.now() + 3000

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f472b6', '#e91e8c', '#fda4af', '#fb7185'],
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f472b6', '#e91e8c', '#fda4af', '#fb7185'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-rose-50 px-6 text-center">
      <p className="text-7xl mb-6">🎉</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">You said YES!</h1>
      <p className="text-xl text-gray-600 max-w-sm leading-relaxed">
        Get ready for an amazing date! 💖
      </p>

      {/* Floating hearts */}
      <div className="mt-12 flex gap-4 text-3xl animate-bounce" aria-hidden>
        <span>❤️</span>
        <span style={{ animationDelay: '0.2s' }}>💕</span>
        <span style={{ animationDelay: '0.4s' }}>💖</span>
      </div>
    </main>
  )
}
