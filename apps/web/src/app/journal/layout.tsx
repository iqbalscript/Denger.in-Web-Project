import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Jurnal privat',
  description: 'Tuangkan pikiranmu. Tersimpan di perangkatmu dan tidak dikirim ke AI.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
