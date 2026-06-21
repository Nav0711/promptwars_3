import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import { AppProvider } from '@/components/AppContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'EcoLoop — Gamified Carbon Footprint Tracking',
  description: 'Track and reduce your personal carbon footprint through conversational daily logging, a living virtual ecosystem, and high-impact carbon swap challenges.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full font-body flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {/*
          Fix 5: Skip-to-content link (WCAG 2.4.1 — Bypass Blocks)
          Visually hidden until focused by keyboard. Allows screen reader and
          keyboard users to jump past repeated navigation to the main content.
        */}
        <a
          href="#main-content"
          className="skip-to-content"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
