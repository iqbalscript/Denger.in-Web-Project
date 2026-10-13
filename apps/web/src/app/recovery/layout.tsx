import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  title: 'Kunci pemulihan',
  description: 'Simpan atau pulihkan sesi anonimmu dengan kunci 12 bagian.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
