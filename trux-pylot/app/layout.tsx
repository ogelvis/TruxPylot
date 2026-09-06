import type { Metadata, Viewport } from 'next';
import './globals.css';
import TruxPylotChat from '@/components/truxpylot-chat';
export const metadata: Metadata = {
  title: 'Trux Pylot',
  description: 'Trusted professionals for every job.',
  manifest: '/manifest.json',
};
export const viewport: Viewport = {
  themeColor: '#073fc8',
};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}
<TruxPylotChat /></body></html>; }
