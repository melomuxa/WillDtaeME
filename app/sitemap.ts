import { MetadataRoute } from 'next'

/**
 * Only public marketing pages go in the sitemap.
 * Dashboard, API routes, and invite links are excluded —
 * invite links are ephemeral and dashboard requires auth.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://willdate.me'

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
