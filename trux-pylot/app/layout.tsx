import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Trux Pylot',
  description: 'Trusted professionals for every job.',
  manifest: '/manifest.json',
  themeColor: '#073fc8',
};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
