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
  // For "whole day" slots the receiver can optionally pick a specific time
  const [preferredTime, setPreferredTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedOption = timeOptions.find((o) => o.id === selectedId)

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
          // Include receiver's preferred time if they picked one on a whole-day slot
          receiverPreferredTime: preferredTime || undefined,
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
      {!chosenLocationId && (
        <p className="text-sm text-red-500 mb-4">
          Please go back and choose a location first.{' '}
          <button onClick={() => router.push(ROUTES.INVITE_CHOOSE(shortId))} className="underline">
            Go back
          </button>
        </p>
      )}

      <div className="space-y-3 mb-6">
        {timeOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setSelectedId(opt.id)
              setPreferredTime('')
            }}
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
              <p className="mt-1 text-pink-500 text-sm font-medium">✓ Selected</p>
            )}
          </button>
        ))}
      </div>

      {/* Whole-day slot: let receiver suggest a specific date + time */}
      {selectedOption?.isWholeDay && (
        <WholeDayPicker value={preferredTime} onChange={setPreferredTime} />
      )}

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

// ─── Whole Day Picker ─────────────────────────────────────────────────────────

function WholeDayPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  // Compute today and +14 days in local time as "YYYY-MM-DDTHH:mm" strings
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

  const minDatetime = toLocal(now)
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + 14)
  // Max is end of day 14 days from now
  maxDate.setHours(23, 59)
  const maxDatetime = toLocal(maxDate)

  // Format the chosen value nicely for the preview label
  function formatPreview(raw: string): string {
    if (!raw) return ''
    const d = new Date(raw)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month:   'short',
      day:     'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
    })
  }

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-medium text-yellow-800">
        📅 When works best for you?{' '}
        <span className="font-normal text-yellow-600">(optional — within the next 2 weeks)</span>
      </p>

      <input
        type="datetime-local"
        value={value}
        min={minDatetime}
        max={maxDatetime}
        onChange={(e) => onChange(e.target.value)}
        className="block border border-yellow-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
      />

      {value && (
        <p className="text-xs text-yellow-700">
          You&apos;ll suggest <strong>{formatPreview(value)}</strong> to your date ✨
        </p>
      )}
    </div>
  )
}
