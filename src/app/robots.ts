import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/demo', '/privacy', '/terms'], disallow: ['/login', '/dashboard', '/super-admin'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}


// Static export: emit this file at build time.
export const dynamic = 'force-static';
