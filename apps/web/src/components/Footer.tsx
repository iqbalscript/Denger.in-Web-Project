import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Key, BarChart3, Users } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-sand-100/80 border-t border-sand-200 mt-20 text-sand-800 text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-calm-700 flex items-center justify-center text-white text-xs font-bold shadow-soft-xs">
                D
              </div>
              <span className="font-bold text-base text-sand-900 tracking-tight">Dengar.in</span>
            </div>
            <p className="text-sand-700 text-xs sm:text-sm leading-relaxed max-w-md">
              Pendamping kesehatan mental anonim untuk membantu memahami beban pikiran,
              mengurai konteks nyata (sekolah, kampus, kerja, finansial), dan mengambil langkah kecil yang aman.
            </p>
            <div className="flex items-center gap-2 text-xs text-calm-800 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-calm-700" />
              <span>100% Bebas Registrasi • Tanpa Email • Tanpa Nomor HP</span>
            </div>
          </div>

          {/* Col 2: Fitur & Navigasi */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-sand-900 uppercase tracking-wider">Akses Mandiri</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-sand-700">
              <li>
                <Link href="/dashboard" className="hover:text-calm-800 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/mission" className="hover:text-calm-800 transition-colors">
                  Misi Harian
                </Link>
              </li>
              <li>
                <Link href="/checkin" className="hover:text-calm-800 transition-colors">
                  Check-in Emosi
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-calm-800 transition-colors">
                  Jurnal Privat
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-calm-800 transition-colors">
                  Direktori Bantuan
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-calm-800 transition-colors inline-flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-calm-700" />
                  <span>Laporan Mingguan</span>
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-calm-800 transition-colors inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-calm-700" />
                  <span>Ruang Cerita (Skeleton)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Keamanan & Kontak Darurat */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-sand-900 uppercase tracking-wider">Kontak Darurat</h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-sand-700">
              <li className="font-semibold text-crisis flex items-center gap-1">
                <span>Kemenkes Sejiwa: 119 ext 8</span>
              </li>
              <li>Lisa Helpline: 021-3777-5472</li>
              <li>KPAI / Anak (15–17 th): 1500-771</li>
              <li>Satgas Pinjol/OJK: 157</li>
              <li className="pt-2">
                <Link
                  href="/recovery"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-calm-800 hover:text-calm-950 hover:underline transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-calm-700" />
                  <span>12-Kata Kode Pemulihan</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Medical Disclaimer Boundary */}
        <div className="border-t border-sand-200 pt-6 text-xs text-sand-700 space-y-3">
          <div className="bg-sand-200/60 p-4 rounded-2xl border border-sand-300/70">
            <p className="leading-relaxed">
              <strong className="text-sand-900 font-semibold">Batasan Medis & Hukum:</strong> Dengar.in adalah pendamping mandiri,{' '}
              <strong className="text-sand-900 font-semibold">
                BUKAN pengganti psikolog, psikiater, layanan gawat darurat, atau penasihat keuangan/hukum berlisensi
              </strong>
              . Dengar.in tidak memberikan diagnosis klinis atau resep medis. Jika Anda berada dalam bahaya mendesak atau memiliki pikiran untuk mengakhiri hidup,{' '}
              segera hubungi <strong className="text-crisis font-semibold">119 ext 8</strong> atau kunjungi fasilitas kesehatan terdekat.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-sand-600">
            <span>© 2026 Dengar.in — MindCraft Web Competition 2026</span>
            <span className="inline-flex items-center gap-1">
              Didesain dengan empati, privasi, dan ketenangan <Heart className="w-3.5 h-3.5 text-calm-700 fill-calm-700" /> untuk Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
