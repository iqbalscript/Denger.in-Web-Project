import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Teman bicara',
  description: 'Ruang bercerita anonim yang mendengarkan tanpa menghakimi.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
