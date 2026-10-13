import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Misi hari ini',
  description: 'Satu langkah kecil yang bisa kamu jalani pelan-pelan hari ini.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
