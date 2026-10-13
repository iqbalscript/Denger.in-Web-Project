import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Ngobrol: pakai suara',
  description: 'Cerita lewat suara, tanpa perlu menyusun kata dengan sempurna.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
