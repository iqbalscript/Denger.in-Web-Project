import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Ngobrol: tulis pesan',
  description: 'Ngobrol anonim lewat tulisan, didengarkan tanpa dihakimi.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
