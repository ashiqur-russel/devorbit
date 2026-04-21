import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevOrbit — Infrastructure Monitoring',
  description: 'Monitor your CI/CD pipelines, server health, and deployments in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-on-surface`}>{children}</body>
    </html>
  );
}
