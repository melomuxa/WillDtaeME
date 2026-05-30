import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { InviteStatus } from '@/app/generated/prisma/enums'
import { ROUTES } from '@/lib/routes'
import { ChooseTimeClient } from './ChooseTimeClient'

export default async function ChooseTimePage({
  params,
}: {
  params: Promise<{ shortId: string }>
}) {
  const { shortId } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { shortId },
    select: {
      status: true,
      timeOptions: {
        select: { id: true, label: true, isWholeDay: true, datetime: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!invitation) notFound()

  if (invitation.status !== InviteStatus.PENDING) {
    redirect(ROUTES.INVITE(shortId))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="w-12 h-px bg-gray-200" />
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="ml-2 text-xs text-gray-400">Step 2 of 2</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          When works for you? 🗓️
        </h1>
        <p className="text-gray-500 mb-8">Choose your preferred time.</p>

        <ChooseTimeClient shortId={shortId} timeOptions={invitation.timeOptions} />
      </div>
    </main>
  )
}
