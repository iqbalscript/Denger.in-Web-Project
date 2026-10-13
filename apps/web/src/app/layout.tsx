import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Self-hosted at build time by next/font, so it satisfies the `font-src 'self'` CSP.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  // Setiap rute mengisi judulnya sendiri lewat layout.tsx kecil di foldernya,
  // sehingga tab peramban, riwayat, dan pengumuman pembaca layar saat pindah
  // halaman (Next route announcer membaca document.title) menyebut halaman yang benar.
  title: {
    default: 'Dengar.in: Ruang Aman untuk Bercerita & Rujukan Kesehatan Mental',
    template: '%s | Dengar.in',
  },
  description: 'Ruang aman anonim tanpa registrasi untuk usia 15 hingga 50+ tahun. Tempat rehat, bercerita tanpa dihakimi, dan melangkah pelan-pelan, dengan asesmen non-diagnostik dan akses ke bantuan krisis terverifikasi.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Dengar.in: Gak harus beres semuanya hari ini.',
    description: 'Ruang aman anonim untuk rehat, bercerita tanpa dihakimi, dan melangkah pelan-pelan. Tanpa akun, tanpa email.',
    locale: 'id_ID',
    type: 'website',
    siteName: 'Dengar.in',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFF8EF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={spaceGrotesk.variable}>
      <body className="min-h-[100dvh] flex flex-col bg-[#FFF8EF] text-[#151515] font-sans selection:bg-[#B8F34A] selection:text-[#151515]">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-5 focus:py-3 focus:bg-[#B8F34A] focus:text-[#151515] focus:font-bold focus:text-base focus:border-2 focus:border-[#151515] focus:rounded-[4px] focus:shadow-[3px_3px_0px_#151515]"
        >
          Langsung ke konten utama
        </a>
        <Navbar />
        <main id="konten-utama" tabIndex={-1} className="flex-1 pb-24 lg:pb-0 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
