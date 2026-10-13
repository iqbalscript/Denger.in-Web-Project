import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Beranda',
  description: 'Misi kecil hari ini, check-in emosi, dan perjalananmu sejauh ini.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
