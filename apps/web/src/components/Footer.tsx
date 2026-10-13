import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Key, BarChart3, Users } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#FFF8EF] border-t-2 border-[#151515] mt-20 text-[#151515] text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12 md:mb-16">
          {/* Col 1: Identity */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-[#4169FF] border-2 border-[#151515] flex items-center justify-center text-white text-sm font-bold shadow-[2px_2px_0px_#151515]" aria-hidden="true">
                D
              </div>
              <span className="font-bold text-xl text-[#151515] tracking-[-0.02em]">Dengar.in</span>
            </div>
            <p className="text-[#59544D] text-[15px] leading-relaxed max-w-[44ch]">
              Pendamping kesehatan mental anonim yang mendengarkan tanpa menghakimi, menemanimu memahami
              beban pikiran (sekolah, kampus, kerja, keuangan) dan mengambil langkah kecil yang aman.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#151515] font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-[#4169FF] shrink-0" aria-hidden="true" />
              <span>Tanpa registrasi, tanpa email, tanpa nomor HP.</span>
            </div>
          </div>

          {/* Col 2: Fitur & Navigasi */}
          <nav className="md:col-span-3 md:col-start-7 space-y-4" aria-labelledby="footer-akses">
            <h2 id="footer-akses" className="text-base font-bold text-[#151515]">Akses mandiri</h2>
            <ul className="space-y-2.5 text-sm text-[#59544D] font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/mission" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Misi Harian
                </Link>
              </li>
              <li>
                <Link href="/checkin" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Check-in Emosi
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Jurnal Privat
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Direktori Bantuan
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring inline-flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#4169FF]" aria-hidden="true" />
                  <span>Refleksi Mingguan</span>
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#4169FF]" aria-hidden="true" />
                  <span>Ruang Cerita</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Col 3: Keamanan & Kontak Darurat */}
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-base font-bold text-[#151515]">Kontak darurat</h2>
            <ul className="space-y-2.5 text-sm text-[#59544D] font-medium">
              <li>
                <a href="tel:119,8" className="font-bold text-[#D93838] hover:underline underline-offset-2">
                  Healing119 (Kemenkes): <span className="tabular-nums">119 ext 8</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/628113855472" target="_blank" rel="noopener noreferrer" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  LISA Helpline (WhatsApp): <span className="tabular-nums">0811-3855-472</span>
                </a>
              </li>
              <li>
                <a href="tel:1500771" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  TePSA Kemensos (anak, 15-17 th): <span className="tabular-nums">1500-771</span>
                </a>
              </li>
              <li>
                <a href="tel:157" className="hover:text-[#151515] hover:underline underline-offset-2 transition-colors duration-200 ease-spring">
                  Kontak OJK (pinjol ilegal): <span className="tabular-nums">157</span>
                </a>
              </li>
              <li className="pt-2">
                <Link
                  href="/recovery"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4169FF] hover:underline underline-offset-2 transition-colors duration-200 ease-spring"
                >
                  <Key className="w-3.5 h-3.5 text-[#FF8A3D]" aria-hidden="true" />
                  <span>Kunci Pemulihan (12 Bagian)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Medical Disclaimer Boundary */}
        <div className="border-t border-[#D8D3C9] pt-8 md:pt-10 text-[13px] text-[#59544D] space-y-5">
          <div className="bg-white p-4 sm:p-6 rounded-[6px] border border-[#D8D3C9]">
            <p className="leading-relaxed max-w-[90ch]">
              <strong className="text-[#151515] font-bold">Batasan Medis & Hukum:</strong> Dengar.in adalah pendamping mandiri,{' '}
              <strong className="text-[#151515] font-bold">
                BUKAN pengganti psikolog, psikiater, layanan gawat darurat, atau penasihat keuangan/hukum berlisensi
              </strong>
              . Dengar.in tidak memberikan diagnosis klinis atau resep medis. Jika Anda berada dalam bahaya mendesak atau memiliki pikiran untuk mengakhiri hidup,{' '}
              segera hubungi <a href="tel:119,8" className="text-[#D93838] font-bold tabular-nums hover:underline underline-offset-2">Healing119 di 119 ext 8</a> atau kunjungi fasilitas kesehatan terdekat.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[13px] text-[#59544D]">
            <span>© 2026 Dengar.in, MindCraft Web Competition 2026</span>
            <span className="inline-flex items-center gap-1">
              Website by 5 Pria Berflanell (Telkom University Surabaya)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
