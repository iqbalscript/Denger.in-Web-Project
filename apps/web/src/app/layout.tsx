import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Dengar.in — Pendamping Mental Well-being Anonim Berbasis AI',
  description: 'Pendamping kesehatan mental anonim dan bebas registrasi untuk usia 15–54 tahun. Membantu memahami konteks nyata beban hidup, misi harian pemulihan, dan akses bantuan darurat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-sand-50 text-sand-900 selection:bg-calm-200">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
