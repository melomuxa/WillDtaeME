import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createInvitationSchema } from '@/lib/validations'
import { nanoid } from 'nanoid'
import { INVITE_ID_LENGTH } from '@/lib/constants'
import type { ApiError } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invitations — list all invitations for the authenticated sender
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const invitations = await prisma.invitation.findMany({
      where: { senderId: session.user.id },
      select: {
        id: true,
        shortId: true,
        recipientName: true,
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

    return NextResponse.json({ data: invitations })
  } catch (err) {
    console.error('[api/invitations GET] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/invitations — create a new invitation
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createInvitationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid request body.', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // DECISION: shortId is generated here (not in the DB) so we can use nanoid
    // with a custom alphabet. Prisma doesn't support nanoid as a default value.
    const shortId = nanoid(INVITE_ID_LENGTH)

    const invitation = await prisma.invitation.create({
      data: {
        shortId,
        senderId: session.user.id,
        recipientName: parsed.data.recipientName?.trim() || null,
        personalMessage: parsed.data.personalMessage ?? null,
        locationOptions: {
          create: parsed.data.locationOptions.map((opt, i) => ({
            name: opt.name,
            category: opt.category ?? null,
            imageUrl: opt.imageUrl || null,
            address: opt.address ?? null,
            order: i,
          })),
        },
        timeOptions: {
          create: parsed.data.timeOptions.map((opt, i) => ({
            label: opt.label,
            isWholeDay: opt.isWholeDay,
            datetime: opt.datetime ? new Date(opt.datetime) : null,
            order: i,
          })),
        },
      },
      select: {
        id: true,
        shortId: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: invitation }, { status: 201 })
  } catch (err) {
    console.error('[api/invitations POST] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
