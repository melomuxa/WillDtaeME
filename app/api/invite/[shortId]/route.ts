import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiError, PublicInvitation } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invite/[shortId] — public invitation data (no auth, no sender PII)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
): Promise<NextResponse> {
  try {
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

    if (!invitation) {
      return NextResponse.json<ApiError>(
        { error: 'Invitation not found.', code: 'INVITE_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json<{ data: PublicInvitation }>({ data: invitation })
  } catch (err) {
    console.error('[api/invite/[shortId] GET] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
