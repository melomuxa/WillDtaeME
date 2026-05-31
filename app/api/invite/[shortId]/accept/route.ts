import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { acceptInviteSchema } from '@/lib/validations'
import { sendAcceptanceEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'
import { InviteStatus } from '@/app/generated/prisma/enums'
import type { ApiError } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/invite/[shortId]/accept
//
// Records the receiver's chosen location and time, marks the invitation as
// ACCEPTED, and sends a notification email to the sender.
//
// No authentication required — the receiver does not have an account.
// Rate-limited per shortId to prevent spamming.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
): Promise<NextResponse> {
  try {
    const { shortId } = await params

    // 1. Rate limit by shortId
    const rateLimitResult = await rateLimit(shortId)
    if (!rateLimitResult.success) {
      return NextResponse.json<ApiError>(
        { error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // 2. Validate request body
    const body = await req.json()
    const parsed = acceptInviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid request body.', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // 3. Load the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { shortId },
      include: {
        sender: { select: { email: true, name: true } },
        locationOptions: true,
        timeOptions: true,
      },
    })

    if (!invitation) {
      return NextResponse.json<ApiError>(
        { error: 'Invitation not found.', code: 'INVITE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Reject if already responded to (idempotency guard)
    if (invitation.status !== InviteStatus.PENDING) {
      return NextResponse.json<ApiError>(
        { error: 'This invitation has already been responded to.', code: 'INVITE_NOT_PENDING' },
        { status: 409 }
      )
    }

    // 5. Validate that the chosen options belong to this invitation
    const chosenLocation = invitation.locationOptions.find(
      (o) => o.id === parsed.data.locationOptionId
    )
    const chosenTime = invitation.timeOptions.find(
      (o) => o.id === parsed.data.timeOptionId
    )

    if (!chosenLocation || !chosenTime) {
      return NextResponse.json<ApiError>(
        { error: 'Selected options do not belong to this invitation.', code: 'INVALID_OPTION' },
        { status: 400 }
      )
    }

    // 6. Accept the invitation and save choices atomically
    const receiverPreferredTime = typeof body.receiverPreferredTime === 'string'
      ? body.receiverPreferredTime
      : undefined

    await prisma.$transaction([
      prisma.invitation.update({
        where: { shortId },
        data: {
          status: InviteStatus.ACCEPTED,
          chosenLocationId: chosenLocation.id,
          chosenTimeId: chosenTime.id,
          respondedAt: new Date(),
          receiverNote: receiverPreferredTime
            ? `Preferred time: ${receiverPreferredTime}`
            : null,
        },
      }),
    ])

    // 7. Send notification email to sender — fire-and-forget so a transient
    //    email failure doesn't fail the acceptance request for the receiver.
    sendAcceptanceEmail({
      to: invitation.sender.email,
      senderName: invitation.sender.name ?? 'there',
      recipientName: invitation.recipientName ?? null,
      locationName: chosenLocation.name,
      timeLabel: chosenTime.label,
    }).catch((err) => {
      console.error('[email] Failed to send acceptance email:', err)
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[api/invite/accept] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
