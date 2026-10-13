import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Catatan konsultasi',
  description: 'Siapkan catatan ringkas untuk dibawa ke psikolog atau layanan kesehatan, tanpa data pribadi.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
