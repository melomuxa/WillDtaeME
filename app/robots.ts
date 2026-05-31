import { MetadataRoute } from 'next'

/**
 * Block private and API routes from being indexed.
 * Public invite links are allowed so they can be shared,
 * but the dashboard requires auth so it should stay private.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://willdate.me'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
