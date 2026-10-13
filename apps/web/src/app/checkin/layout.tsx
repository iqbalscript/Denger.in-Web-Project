import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Check-in',
  description: 'Catat suasana hati dan energimu hari ini. Tersimpan hanya di perangkat ini.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
