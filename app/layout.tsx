import type { Metadata } from 'next';
import './globals.css';
import './extra.css';
import './landing.css';

export const metadata: Metadata = {
  title: 'PulseLock — Smart medication access',
  description: 'Adaptive medication access, built around you.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
