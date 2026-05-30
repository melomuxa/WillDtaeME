import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { InvitationCard } from '@/components/invitation/InvitationCard'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect(ROUTES.LOGIN)

  const invitations = await prisma.invitation.findMany({
    where: { senderId: session.user.id },
    select: {
      id: true,
      shortId: true,
      personalMessage: true,
      status: true,
      createdAt: true,
      respondedAt: true,
      chosenLocationId: true,
      chosenTimeId: true,
      locationOptions: {
        select: { id: true, name: true, category: true, imageUrl: true, address: true, order: true },
        orderBy: { order: 'asc' },
      },
      timeOptions: {
        select: { id: true, label: true, isWholeDay: true, datetime: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Invitations</h1>
            <p className="text-gray-500 mt-1">
              {session.user.name ? `Hi ${session.user.name}! ` : ''}Manage your date invitations.
            </p>
          </div>
          <Link
            href={ROUTES.DASHBOARD_NEW}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-5 py-2.5 rounded-full transition-colors text-sm"
          >
            + New Invitation
          </Link>
        </div>

        {/* Invitation list */}
        {invitations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">💌</p>
            <p className="text-lg font-medium text-gray-500 mb-6">No invitations yet</p>
            <Link
              href={ROUTES.DASHBOARD_NEW}
              className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Create your first invitation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
