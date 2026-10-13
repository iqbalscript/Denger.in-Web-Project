import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Mulai perlahan',
  description: 'Beberapa pilihan singkat supaya bahasa dan langkahnya terasa pas untukmu.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
