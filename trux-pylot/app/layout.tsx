import type { Metadata, Viewport } from 'next';
import './globals.css';

const baseUrl = 'https://truxpylot.com';
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: 'TruxPylot | Find the Right Professional', template: '%s | TruxPylot' },
  description: 'Find trusted professionals for repairs, services and everyday jobs. Compare real profiles, work history, reviews and TruxPylot trust signals.',
  applicationName: 'TruxPylot',
  keywords: ['TruxPylot','find a professional','trusted professionals','service professionals','home services','Nigeria professionals'],
  alternates: { canonical: '/' },
  openGraph: { title: 'TruxPylot | Find the Right Professional', description: 'Find the right professional for your next job.', url: baseUrl, siteName: 'TruxPylot', type: 'website', images: [{ url: '/trux-pylot-logo.png', width: 1200, height: 630, alt: 'TruxPylot' }] },
  twitter: { card: 'summary_large_image', title: 'TruxPylot | Find the Right Professional', description: 'Find the right professional for your next job.', images: ['/trux-pylot-logo.png'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  manifest: '/manifest.json',
};
export const viewport: Viewport = { themeColor: '#073fc8' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
