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
        <ThemeProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
