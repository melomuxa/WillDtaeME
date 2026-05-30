import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InviteStatus } from '@/app/generated/prisma/enums'
import { InvitePage } from './InvitePage'

export default async function PublicInvitePage({
  params,
}: {
  params: Promise<{ shortId: string }>
}) {
  const { shortId } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { shortId },
    select: {
      shortId: true,
      personalMessage: true,
      status: true,
      locationOptions: {
        select: { id: true, name: true, category: true, imageUrl: true, address: true, order: true },
        orderBy: { order: 'asc' },
      },
      timeOptions: {
        select: { id: true, label: true, isWholeDay: true, datetime: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!invitation) notFound()

  if (invitation.status === InviteStatus.ACCEPTED) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This date is already happening!</h1>
          <p className="text-gray-500">Looks like someone said yes already. 💕</p>
        </div>
      </main>
    )
  }

  if (invitation.status === InviteStatus.EXPIRED) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😢</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This invitation has expired</h1>
          <p className="text-gray-500">Oh no, it seems you missed this one.</p>
        </div>
      </main>
    )
  }

  return <InvitePage invitation={invitation} />
}
