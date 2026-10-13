import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Halaman ini komponen klien, jadi judul tab dan deskripsinya ditetapkan di sini.
export const metadata: Metadata = {
  // Segmen ini punya anak (/assessment/result); judul string biasa akan memutus
  // template akhiran " | Dengar.in" dari root, jadi templatnya diteruskan di sini.
  title: {
    default: 'Asesmen singkat',
    template: '%s | Dengar.in',
  },
  description: 'Beberapa pertanyaan singkat, bukan diagnosis, untuk menyesuaikan langkah kecil yang cocok untukmu.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
