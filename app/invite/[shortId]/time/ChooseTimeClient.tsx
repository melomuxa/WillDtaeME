'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiverStore } from '@/store/receiverStore'
import { API_ROUTES, ROUTES } from '@/lib/routes'
import type { PublicTimeOption } from '@/types'

interface ChooseTimeClientProps {
  shortId: string
  timeOptions: PublicTimeOption[]
}

export function ChooseTimeClient({ shortId, timeOptions }: ChooseTimeClientProps) {
  const router = useRouter()
  const { chosenLocationId, setChosenTime } = useReceiverStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!selectedId || !chosenLocationId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(API_ROUTES.ACCEPT_INVITE(shortId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationOptionId: chosenLocationId,
          timeOptionId: selectedId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Something went wrong.')
      }

      setChosenTime(selectedId)
      router.push(ROUTES.INVITE_SUCCESS(shortId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Guard: if somehow they landed here without choosing a location, redirect */}
      {!chosenLocationId && (
        <p className="text-sm text-red-500 mb-4">
          Please go back and choose a location first.{' '}
          <button
            onClick={() => router.push(ROUTES.INVITE_CHOOSE(shortId))}
            className="underline"
          >
            Go back
          </button>
        </p>
      )}

      <div className="space-y-3 mb-8">
        {timeOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedId(opt.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              selectedId === opt.id
                ? 'border-pink-400 bg-pink-50 shadow-md shadow-pink-100'
                : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{opt.label}</span>
              {opt.isWholeDay && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Any time 🌟
                </span>
              )}
            </div>
            {selectedId === opt.id && (
              <div className="mt-1 text-pink-500 text-sm font-medium">✓ Selected</div>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedId || !chosenLocationId || submitting}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-full text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pink-200"
      >
        {submitting ? 'Confirming…' : 'Confirm Date! 💕'}
      </button>
    </div>
  )
}
