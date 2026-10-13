import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Perjalanan kecil',
  description: 'Langkah, ritme tujuh hari, dan lencana dari kebiasaan kecil yang kamu jaga.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
