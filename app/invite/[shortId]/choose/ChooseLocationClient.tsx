'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiverStore } from '@/store/receiverStore'
import { ROUTES } from '@/lib/routes'
import type { PublicLocationOption } from '@/types'

interface ChooseLocationClientProps {
  shortId: string
  locationOptions: PublicLocationOption[]
}

export function ChooseLocationClient({ shortId, locationOptions }: ChooseLocationClientProps) {
  const router = useRouter()
  const setChosenLocation = useReceiverStore((s) => s.setChosenLocation)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleContinue() {
    if (!selectedId) return
    setChosenLocation(selectedId)
    router.push(ROUTES.INVITE_TIME(shortId))
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {locationOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedId(opt.id)}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              selectedId === opt.id
                ? 'border-pink-400 bg-pink-50 shadow-md shadow-pink-100'
                : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-sm'
            }`}
          >
            {opt.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opt.imageUrl}
                alt={opt.name}
                className="w-full h-28 object-cover rounded-xl mb-3"
              />
            )}
            {!opt.imageUrl && (
              <div className="w-full h-28 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl mb-3 flex items-center justify-center text-3xl">
                📍
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{opt.name}</p>
                {opt.address && (
                  <p className="text-xs text-gray-400 mt-0.5">{opt.address}</p>
                )}
              </div>
              {opt.category && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                  {opt.category}
                </span>
              )}
            </div>
            {selectedId === opt.id && (
              <div className="mt-2 text-pink-500 text-sm font-medium">✓ Selected</div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedId}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  )
}
