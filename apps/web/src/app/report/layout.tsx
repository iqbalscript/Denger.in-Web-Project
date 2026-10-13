import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Refleksi mingguan',
  description: 'Rangkuman tujuh hari terakhir: suasana hati, misi, dan jurnalmu.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
