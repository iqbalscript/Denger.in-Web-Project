import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Hasil asesmen',
  description: 'Rangkuman non-diagnostik dari jawabanmu dan jalur pendampingan yang disarankan.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
