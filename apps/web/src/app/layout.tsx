import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Dengar.in — Ruang Aman, Asesmen Adaptif, & Rujukan Kesehatan Mental',
  description: 'Ruang aman anonim bebas registrasi untuk usia 15 hingga 50+ tahun. Asesmen adaptif non-diagnostik, pendampingan mandiri terarah, dan akses rujukan krisis terverifikasi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FFF8EF] text-[#151515] font-sans selection:bg-[#B8F34A] selection:text-[#151515]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
