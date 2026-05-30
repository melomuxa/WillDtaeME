import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'WillDate.me — Ask them out. Unforgettably.',
  description:
    'Create a personalized date invitation, share the link, and get notified when they say yes.',
  openGraph: {
    title: 'WillDate.me',
    description: 'Will you go on a date with me? 💕',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-gray-900">{children}</body>
    </html>
  )
}
