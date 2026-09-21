const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  // Mengganti cache ISR/SSG bawaan Next.js dengan cache Redis bersama.
  // Wajib berupa path absolut. Hanya dipakai pada build produksi
  // (`next build` + `next start`) — `next dev` mengabaikannya.
  cacheHandler: path.resolve(__dirname, 'cache-handler.mjs'),

  // Mematikan cache in-memory bawaan Next.js. Tanpa ini setiap instance
  // menyimpan salinannya sendiri dan bisa menyajikan halaman basi meski
  // Redis sudah diperbarui.
  cacheMaxMemorySize: 0,

  // Biarkan paket-paket ini di-`require` langsung oleh Node.js, jangan
  // di-bundle oleh webpack.
  //
  // Tanpa ini, webpack menelusuri instrumentation.ts -> cache-handler.mjs ->
  // redis lalu mencoba mem-bundle client Redis untuk runtime browser/Edge,
  // yang tidak punya modul inti Node seperti 'stream' atau 'net':
  //   Module not found: Can't resolve 'stream'
  // Penjaga `NEXT_RUNTIME` di instrumentation.ts hanya berlaku saat RUNTIME,
  // sedangkan webpack menganalisis impor saat BUILD — jadi penjaga itu saja
  // tidak cukup.
  serverExternalPackages: ['redis', '@redis/client', '@fortedigital/nextjs-cache-handler']
};

module.exports = nextConfig;
