/**
 * Dynamic Sitemap Generation for Revalidate.ai
 * 
 * Usage: Place this file at app/sitemap.ts
 * 
 * This file generates a dynamic sitemap.xml that updates automatically
 * based on your application's routes. With Next.js 13.3+, this creates
 * a sitemap.xml endpoint at /sitemap.xml
 * 
 * Documentation: https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://revalidate.ai'

  // Define all your public routes here with metadata
  const routes = [
    // Homepage - Highest Priority
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    
    // Main Navigation Pages
    {
      url: `${baseUrl}/features`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'weekly' as const,
      priority: 0.95,
    },
    
    // Contact & Support
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    
    // Legal Pages
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    },
    
    // Authentication Pages (Low priority - for completeness)
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'never' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'never' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/forgot-password`,
      lastModified: new Date('2026-07-24'),
      changeFrequency: 'never' as const,
      priority: 0.2,
    },
    
    // Future Blog Routes (uncomment when blog is added)
    // {
    //   url: `${baseUrl}/blog`,
    //   lastModified: new Date(),
    //   changeFrequency: 'daily' as const,
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/blog/email-validation-best-practices`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.8,
    // },
  ]

  return routes
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Copy this file to: app/sitemap.ts
 * 
 * 2. Next.js will automatically generate /sitemap.xml
 * 
 * 3. Update robots.txt to include:
 *    Sitemap: https://revalidate.ai/sitemap.xml
 * 
 * 4. Test the sitemap:
 *    curl https://revalidate.ai/sitemap.xml
 * 
 * ADDITIONAL SETUP FOR MULTIPLE SITEMAPS:
 * 
 * If your sitemap grows beyond 50,000 URLs, create a sitemap index:
 * 
 * File: app/sitemap-index.ts
 * 
 * import { MetadataRoute } from 'next'
 * 
 * export default function sitemapIndex(): MetadataRoute.SitemapIndex {
 *   return [
 *     {
 *       url: 'https://revalidate.ai/sitemap.xml',
 *     },
 *     {
 *       url: 'https://revalidate.ai/blog-sitemap.xml',
 *     },
 *   ]
 * }
 * 
 * THEN update robots.txt:
 * Sitemap: https://revalidate.ai/sitemap-index.xml
 * 
 */