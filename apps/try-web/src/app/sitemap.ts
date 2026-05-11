import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://try.rez.money'

  const routes = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/landing`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/profile`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/history`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/coins`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/missions`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/badges`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/bundles`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/campaigns`, lastModified: new Date(), priority: 0.6 },
  ]

  return routes
}
