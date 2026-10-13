import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Key } from 'lucide-react';

const footerLink =
  'inline-flex items-center gap-1.5 min-h-[44px] text-base font-semibold text-[#151515] underline underline-offset-4 decoration-2 decoration-[#D8D3C9] hover:decoration-[#151515] transition-colors duration-200 ease-spring rounded-[4px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

// Kontak darurat: nama di atas, nomor di bawah (tidak pernah terpotong di tengah).
const contactLink =
  'flex flex-col py-1.5 min-h-[44px] rounded-[4px] group focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';
const contactName = 'text-sm font-semibold text-[#59544D]';
const contactNumber =
  'text-base font-bold tabular-nums whitespace-nowrap underline underline-offset-4 decoration-2 decoration-[#D8D3C9] group-hover:decoration-current';

export function Footer() {
  return (
    <footer className="bg-[#FFF8EF] border-t-2 border-[#151515] mt-20 text-[#151515] text-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12 md:mb-16">
          {/* Col 1: Identity */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[4px] bg-[#3357EE] border-2 border-[#151515] flex items-center justify-center text-white text-base font-bold shadow-[2px_2px_0px_#151515]" aria-hidden="true">
                D
              </div>
              <span className="font-bold text-xl text-[#151515] tracking-[-0.02em]">Dengar.in</span>
            </div>
            <p className="text-[#59544D] text-base leading-relaxed max-w-[44ch]">
              Pendamping kesehatan mental anonim yang mendengarkan tanpa menghakimi, menemanimu memahami
              beban pikiran (sekolah, kampus, kerja, keuangan) dan mengambil langkah kecil yang aman.
            </p>
            <div className="flex items-center gap-2 text-base text-[#151515] font-semibold pt-1">
              <ShieldCheck className="w-5 h-5 text-[#3357EE] shrink-0" aria-hidden="true" />
              <span>Tanpa registrasi, tanpa email, tanpa nomor HP.</span>
            </div>
          </div>

          {/* Col 2: Fitur & Navigasi */}
          <nav className="md:col-span-3 md:col-start-7 space-y-3" aria-labelledby="footer-akses">
            <h2 id="footer-akses" className="text-lg font-bold text-[#151515]">Akses mandiri</h2>
            <ul className="space-y-0.5">
              <li>
                <Link href="/chat" className={footerLink}>
                  Ngobrol: tulis pesan
                </Link>
              </li>
              <li>
                <Link href="/ruang-ngobrol" className={footerLink}>
                  Ngobrol: pakai suara
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={footerLink}>
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/mission" className={footerLink}>
                  Misi Harian
                </Link>
              </li>
              <li>
                <Link href="/checkin" className={footerLink}>
                  Check-in Emosi
                </Link>
              </li>
              <li>
                <Link href="/journal" className={footerLink}>
                  Jurnal Privat
                </Link>
              </li>
              <li>
                <Link href="/resources" className={footerLink}>
                  Direktori Bantuan
                </Link>
              </li>
              <li>
                <Link href="/report" className={footerLink}>
                  Refleksi Mingguan
                </Link>
              </li>
              <li>
                <Link href="/forum" className={footerLink}>
                  Ruang Cerita
                </Link>
              </li>
              <li>
                {/* Di navigasi atas tautan ini baru tampil mulai 1536px; di sini
                    selalu ada supaya tetap terjangkau di laptop. */}
                <Link href="/care-passport" className={footerLink}>
                  Catatan Konsultasi
                </Link>
              </li>
            </ul>
          </nav>

          {/* Col 3: Keamanan & Kontak Darurat */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="text-lg font-bold text-[#151515]">Kontak darurat</h2>
            <ul className="space-y-0.5">
              <li>
                <a href="tel:119,8" className={contactLink}>
                  <span className={contactName}>Healing119 (Kemenkes)</span>
                  <span className={`${contactNumber} text-[#B3261E]`}>119 ext 8</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/628113855472" target="_blank" rel="noopener noreferrer" className={contactLink}>
                  <span className={contactName}>LISA Helpline (WhatsApp)</span>
                  <span className={`${contactNumber} text-[#151515]`}>0811-3855-472</span>
                </a>
              </li>
              <li>
                <a href="tel:1500771" className={contactLink}>
                  <span className={contactName}>TePSA Kemensos (anak, 15-17 th)</span>
                  <span className={`${contactNumber} text-[#151515]`}>1500-771</span>
                </a>
              </li>
              <li>
                <a href="tel:157" className={contactLink}>
                  <span className={contactName}>Kontak OJK (pinjol ilegal)</span>
                  <span className={`${contactNumber} text-[#151515]`}>157</span>
                </a>
              </li>
              <li className="pt-2">
                <Link href="/recovery" className={`${footerLink} text-[#2B51E6] decoration-[#2B51E6]`}>
                  <Key className="w-4 h-4 text-[#A3480B]" aria-hidden="true" />
                  <span>Kunci Pemulihan (12 Bagian)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Medical Disclaimer Boundary */}
        <div className="border-t border-[#D8D3C9] pt-8 md:pt-10 text-sm text-[#59544D] space-y-5">
          <div className="bg-white p-4 sm:p-6 rounded-[6px] hairline">
            <p className="leading-relaxed max-w-[90ch] text-base">
              <strong className="text-[#151515] font-bold">Batasan medis dan hukum:</strong> Dengar.in adalah pendamping mandiri,{' '}
              <strong className="text-[#151515] font-bold">
                bukan pengganti psikolog, psikiater, layanan gawat darurat, atau penasihat keuangan/hukum berlisensi
              </strong>
              . Dengar.in tidak memberikan diagnosis klinis atau resep medis. Jika Anda berada dalam bahaya mendesak atau memiliki pikiran untuk mengakhiri hidup,{' '}
              segera hubungi <a href="tel:119,8" className="text-[#B3261E] font-bold tabular-nums underline underline-offset-4 decoration-2 rounded-[2px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]">Healing119 di 119 ext 8</a> atau kunjungi fasilitas kesehatan terdekat.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-sm text-[#59544D]">
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
