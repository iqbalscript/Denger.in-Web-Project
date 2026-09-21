/**
 * Hook instrumentation Next.js — dijalankan sekali saat server start.
 *
 * File ini dikompilasi untuk SEMUA runtime (Node.js, Edge, dan browser),
 * jadi ia tidak boleh mengimpor apa pun yang khusus Node.js di level atas.
 * Client Redis memakai modul inti seperti 'stream' dan 'net' yang tidak ada
 * di Edge/browser — mengimpornya di sini menghasilkan:
 *   Module not found: Can't resolve 'stream'
 *
 * Penjaga NEXT_RUNTIME di bawah berjalan saat RUNTIME, sedangkan webpack
 * menelusuri impor saat BUILD — karena itu kode Node-only harus benar-benar
 * berada di file terpisah, bukan sekadar di balik cabang `if`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { registerNodeInstrumentation } = await import('./instrumentation-node');
  await registerNodeInstrumentation();
}
