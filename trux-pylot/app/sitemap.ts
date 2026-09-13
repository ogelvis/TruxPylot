import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://truxpylot.com';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'daily', priority: .9 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'daily', priority: .9 },
    { url: `${base}/support`, lastModified: now, changeFrequency: 'weekly', priority: .6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: .3 },
  ];
}
