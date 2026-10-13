import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Jurnal',
  description: 'Tulis isi pikiranmu. Tersimpan di perangkat ini dan tidak dikirim ke AI.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
