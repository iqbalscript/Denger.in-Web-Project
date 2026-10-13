import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Bantuan dan kontak resmi',
  description: 'Daftar layanan psikolog, kontak darurat resmi, dan bantuan soal keuangan.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
