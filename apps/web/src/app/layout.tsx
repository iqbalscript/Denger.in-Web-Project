import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
title: 'Dengar.in: Ruang Aman untuk Bercerita & Rujukan Kesehatan Mental',
description: 'Ruang aman anonim tanpa registrasi untuk usia 15 hingga 50+ tahun. Tempat rehat, bercerita tanpa dihakimi, dan melangkah pelan-pelan, dengan asesmen non-diagnostik dan akses ke bantuan krisis terverifikasi.',
icons: {
  icon: '/icon.svg',
},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#FFF8EF] text-[#151515] font-sans selection:bg-[#B8F34A] selection:text-[#151515]">
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
