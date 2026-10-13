import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Bantuan darurat',
  description: 'Kontak darurat resmi: Healing119 Kemenkes (119 ext 8), LISA Helpline, dan TePSA.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
