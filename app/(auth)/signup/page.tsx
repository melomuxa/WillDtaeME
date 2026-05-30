import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

/**
 * Signup and login use the same flow (magic link or Google OAuth).
 * Redirect to login so we don't maintain a duplicate page.
 */
export default function SignupPage() {
  redirect(ROUTES.LOGIN)
}
