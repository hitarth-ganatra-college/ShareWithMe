import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShareWithMe — Instant Web Project Deployment & QR Sharing',
  description:
    'Deploy static HTML, CSS & JavaScript projects in seconds. Get instant live links and scannable QR codes for your friends and classroom.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
