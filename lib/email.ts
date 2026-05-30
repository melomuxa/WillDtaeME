import { Resend } from 'resend'
import { env } from '@/lib/env'
import { ROUTES } from '@/lib/routes'

// ─── Client ───────────────────────────────────────────────────────────────────

// Lazy-init so the module can be imported in environments where RESEND_API_KEY
// may not yet be present (e.g. during build-time type checking).
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

// ─── Email: Acceptance Notification ──────────────────────────────────────────

interface AcceptanceEmailProps {
  to: string
  senderName: string
  locationName: string
  timeLabel: string
}

/**
 * Sends a notification email to the sender when their date invitation is accepted.
 *
 * Called non-blocking (fire-and-forget) from the accept API route so that
 * a transient email failure doesn't roll back the acceptance transaction.
 */
export async function sendAcceptanceEmail(props: AcceptanceEmailProps): Promise<void> {
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.DASHBOARD}`

  await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: props.to,
    subject: '💕 They said YES!',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
          <h1 style="color: #e91e8c; margin-bottom: 8px;">They said YES! 🎉</h1>
          <p>Great news, ${escapeHtml(props.senderName)}!</p>
          <p>Your date invitation was accepted. Here are the details:</p>
          <table style="margin: 24px 0; border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 80px;">Where:</td>
              <td style="padding: 8px 0;">${escapeHtml(props.locationName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">When:</td>
              <td style="padding: 8px 0;">${escapeHtml(props.timeLabel)}</td>
            </tr>
          </table>
          <a
            href="${dashboardUrl}"
            style="display: inline-block; background: #e91e8c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;"
          >
            View Dashboard →
          </a>
        </body>
      </html>
    `,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
