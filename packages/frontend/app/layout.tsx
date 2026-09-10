import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ReactNode } from 'react';
import { Navbar } from '@/components/f1/navbar';
import { LiveSessionProvider } from '@/components/live/live-session-provider';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        default: 'Purple Sector',
        template: '%s | Purple Sector',
    },
    description: 'Formula 1 statistics, race results, standings and telemetry analytics.',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.variable} dark antialiased`}>
        <body className="min-h-screen flex flex-col bg-background text-foreground">
        <LiveSessionProvider>
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-8 w-full overflow-x-clip">
                {children}
            </main>

            <footer className="border-t border-border py-8 bg-card/25 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground">
                    Purple Sector is an unofficial pet project and is not affiliated with the Formula 1 companies.
                </div>
            </footer>
        </LiveSessionProvider>
        </body>
        </html>
    );
}