import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/demo', '/privacy', '/terms'].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.6 }));
}


// Static export: emit this file at build time.
export const dynamic = 'force-static';
