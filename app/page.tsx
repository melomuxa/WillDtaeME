import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

// Donation UI is hidden when this env var is empty.
// To re-enable: set NEXT_PUBLIC_DONATION_URL in Vercel and redeploy.
const DONATION_URL = process.env.NEXT_PUBLIC_DONATION_URL || null

export default function LandingPage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24 bg-gradient-to-b from-pink-50 to-white">

      {/* Donation button — shown only when NEXT_PUBLIC_DONATION_URL is set */}
      {DONATION_URL && (
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-5 right-5 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-sm px-4 py-2 rounded-full transition-colors shadow-sm"
        >
          ☕ Buy me a coffee
        </a>
      )}

      {/* Hero */}
      <div className="text-center max-w-2xl">
        <p className="text-5xl mb-6">💕</p>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
          Ask them out.{' '}
          <span className="text-pink-500">Unforgettably.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-md mx-auto">
          Create a personalized date invitation, share the link, and get notified when they say yes.
        </p>
        <Link
          href={ROUTES.LOGIN}
          className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold text-lg px-8 py-4 rounded-full transition-colors shadow-lg shadow-pink-200"
        >
          Create your invitation →
        </Link>
      </div>

      {/* How it works */}
      <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-3xl w-full text-center">
        <div>
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="font-semibold text-gray-800 mb-1">1. Create</h3>
          <p className="text-gray-500 text-sm">
            Pick venues, time options, and write a personal message.
          </p>
        </div>
        <div>
          <div className="text-4xl mb-3">🔗</div>
          <h3 className="font-semibold text-gray-800 mb-1">2. Share</h3>
          <p className="text-gray-500 text-sm">
            Send the link via WhatsApp, Instagram, or however you talk.
          </p>
        </div>
        <div>
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-semibold text-gray-800 mb-1">3. They say yes</h3>
          <p className="text-gray-500 text-sm">
            Get an email notification and see the details in your dashboard.
          </p>
        </div>
      </div>
    </main>
  )
}
