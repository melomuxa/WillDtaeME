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
    'Create a personalized date invitation, share the link, and get notified when they say yes. The fun way to ask someone out.',
  keywords: ['date invitation', 'ask someone out', 'date app', 'romantic invitation', 'willdate'],
  metadataBase: new URL('https://willdate.me'),
  alternates: {
    canonical: 'https://willdate.me',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'WillDate.me — Ask them out. Unforgettably.',
    description: 'Create a personalized date invitation and share the link. They say yes, you get notified. 💕',
    type: 'website',
    url: 'https://willdate.me',
    siteName: 'WillDate.me',
  },
  twitter: {
    card: 'summary',
    title: 'WillDate.me — Ask them out. Unforgettably.',
    description: 'Create a personalized date invitation and share the link. 💕',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-gray-900">{children}</body>
    </html>
  )
}
