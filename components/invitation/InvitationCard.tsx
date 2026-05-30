'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ROUTES, API_ROUTES } from '@/lib/routes'
import { CopyButton } from '@/components/ui/CopyButton'
import { getCategoryIcon } from '@/lib/constants'
import type { DashboardInvitation } from '@/types'
import { InviteStatus } from '@/app/generated/prisma/enums'

const STATUS_LABELS: Record<InviteStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted ❤️',
  EXPIRED: 'Expired',
}

const STATUS_COLORS: Record<InviteStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

interface InvitationCardProps {
  invitation: DashboardInvitation
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const [deleted, setDeleted] = useState(false)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.INVITE(invitation.shortId)}`

  const chosenLocation = invitation.locationOptions.find(
    (o) => o.id === invitation.chosenLocationId
  )
  const chosenTime = invitation.timeOptions.find((o) => o.id === invitation.chosenTimeId)

  if (deleted) return null

  async function handleDelete() {
    if (!confirm('Delete this invitation? This cannot be undone.')) return
    await fetch(API_ROUTES.INVITATION(invitation.id), { method: 'DELETE' })
    setDeleted(true)
  }

  return (
    <div
      className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
        invitation.status === InviteStatus.ACCEPTED
          ? 'border-green-200'
          : 'border-pink-100'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[invitation.status]}`}
            >
              {STATUS_LABELS[invitation.status]}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(invitation.createdAt).toLocaleDateString()}
            </span>
          </div>

          {invitation.personalMessage && (
            <p className="text-sm text-gray-600 italic truncate mb-2">
              &ldquo;{invitation.personalMessage}&rdquo;
            </p>
          )}

          {/* Accepted details */}
          {invitation.status === InviteStatus.ACCEPTED && chosenLocation && chosenTime && (
            <div className="text-sm text-green-700 mb-3 space-y-0.5">
              <p>{getCategoryIcon(chosenLocation.category)} {chosenLocation.name}</p>
              <p>🗓️ {chosenTime.label}</p>
            </div>
          )}

          {/* Location previews when pending */}
          {invitation.status !== InviteStatus.ACCEPTED && (
            <div className="flex gap-1 flex-wrap mb-2">
              {invitation.locationOptions.map((loc) => (
                <span key={loc.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {getCategoryIcon(loc.category)} {loc.name}
                </span>
              ))}
            </div>
          )}

          {/* Share link */}
          <div className="flex items-center gap-2 mt-3">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 min-w-0"
            />
            <CopyButton text={shareUrl} className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium" />
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={ROUTES.DASHBOARD_INVITE(invitation.id)}
            className="text-xs text-pink-500 hover:underline"
          >
            Details →
          </Link>
          <button
            onClick={handleDelete}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
