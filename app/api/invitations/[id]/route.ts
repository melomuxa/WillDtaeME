import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { ApiError } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invitations/[id] — get full details of one invitation (sender only)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const { id } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: {
        id: true,
        shortId: true,
        personalMessage: true,
        status: true,
        createdAt: true,
        respondedAt: true,
        chosenLocationId: true,
        chosenTimeId: true,
        senderId: true,
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

    if (invitation.senderId !== session.user.id) {
      return NextResponse.json<ApiError>(
        { error: 'Access denied.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: invitation })
  } catch (err) {
    console.error('[api/invitations/[id] GET] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/invitations/[id] — delete an invitation (sender only)
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check ownership before deleting
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: { senderId: true },
    })

    if (!invitation) {
      return NextResponse.json<ApiError>(
        { error: 'Invitation not found.', code: 'INVITE_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (invitation.senderId !== session.user.id) {
      return NextResponse.json<ApiError>(
        { error: 'Access denied.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    await prisma.invitation.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[api/invitations/[id] DELETE] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
