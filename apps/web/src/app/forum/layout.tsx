import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Ruang cerita',
  description: 'Tempat cerita anonim yang dicek dulu oleh moderator, untuk saling menguatkan.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
