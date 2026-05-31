import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { InviteStatus } from '@/app/generated/prisma/enums'
import { CopyButton } from '@/components/ui/CopyButton'

const STATUS_LABELS: Record<InviteStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
}

const STATUS_COLORS: Record<InviteStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default async function InvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect(ROUTES.LOGIN)

  const { id } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: {
      locationOptions: { orderBy: { order: 'asc' } },
      timeOptions: { orderBy: { order: 'asc' } },
    },
  })

  if (!invitation || invitation.senderId !== session.user.id) notFound()

  const chosenLocation = invitation.locationOptions.find(
    (o) => o.id === invitation.chosenLocationId
  )
  const chosenTime = invitation.timeOptions.find((o) => o.id === invitation.chosenTimeId)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.INVITE(invitation.shortId)}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href={ROUTES.DASHBOARD} className="text-pink-500 hover:underline text-sm mb-8 block">
          ← Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {invitation.recipientName
                  ? `Invitation for ${invitation.recipientName}`
                  : 'Invitation Details'}
              </h1>
            </div>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[invitation.status]}`}
            >
              {invitation.status === InviteStatus.ACCEPTED && invitation.recipientName
                ? `${invitation.recipientName} said YES! ❤️`
                : STATUS_LABELS[invitation.status]}
            </span>
          </div>

          {invitation.personalMessage && (
            <blockquote className="border-l-4 border-pink-300 pl-4 text-gray-600 italic mb-6">
              {invitation.personalMessage}
            </blockquote>
          )}

          {/* Shareable link */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 mb-2">Share link</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>

          {/* Accepted response */}
          {invitation.status === InviteStatus.ACCEPTED && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6">
              <p className="text-green-800 font-semibold mb-3">They said YES! 🎉</p>
              <div className="space-y-1 text-sm text-green-700">
                {chosenLocation && (
                  <p>
                    <span className="font-medium">Where:</span> {chosenLocation.name}
                  </p>
                )}
                {chosenTime && (
                  <p>
                    <span className="font-medium">When:</span> {chosenTime.label}
                  </p>
                )}
                {invitation.respondedAt && (
                  <p className="text-green-600 text-xs mt-2">
                    Responded {new Date(invitation.respondedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">Locations</p>
              <ul className="space-y-1">
                {invitation.locationOptions.map((opt) => (
                  <li key={opt.id} className="text-sm text-gray-700">
                    {opt.name}
                    {opt.category && (
                      <span className="text-gray-400 ml-1">· {opt.category}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">Time options</p>
              <ul className="space-y-1">
                {invitation.timeOptions.map((opt) => (
                  <li key={opt.id} className="text-sm text-gray-700">
                    {opt.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Created {new Date(invitation.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  )
}

