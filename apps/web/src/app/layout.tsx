import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ACCESSIBILITY_INIT_SCRIPT } from '@/components/ui/AccessibilityMenu';
import { LANGUAGE_INIT_SCRIPT } from '@/i18n/language';
import { SkipLink } from '@/components/SkipLink';

// Judul: Schibsted Grotesk (Bakken & Bæck), di-host sendiri oleh next/font saat build
// sehingga memenuhi CSP `font-src 'self'`. Teks biasa memakai font sistem perangkat:
// paling jelas dan paling ringan untuk ponsel murah.
const displayFont = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-display',
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
  width: 'device-width',
  initialScale: 1,
  // Poni dan garis beranda: dock bawah dan lembar memakai env(safe-area-inset-*).
  viewportFit: 'cover',
  // Chrome Android: keyboard layar mengecilkan viewport (100dvh ikut mengecil),
  // sehingga kotak tulis chat/jurnal tetap terlihat di atas keyboard.
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang="id" adalah nilai server (halaman tetap statis dan bisa di-cache).
    // Bila cookie dengarin-lang=en, LANGUAGE_INIT_SCRIPT mengganti atributnya
    // sebelum render pertama, dan store i18n menjaganya saat bahasa diganti.
    <html lang="id" className={displayFont.variable} suppressHydrationWarning>
      <head>
        {/* Terapkan pilihan bahasa dan Akses cepat sebelum halaman tampil (tanpa kedipan). */}
        <script dangerouslySetInnerHTML={{ __html: LANGUAGE_INIT_SCRIPT + ACCESSIBILITY_INIT_SCRIPT }} />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-[#FFF8EF] text-[#151515] font-sans selection:bg-[#B8F34A] selection:text-[#151515]">
        <SkipLink />
        <Navbar />
        <main id="konten-utama" tabIndex={-1} className="flex-1 pb-24 lg:pb-0 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
