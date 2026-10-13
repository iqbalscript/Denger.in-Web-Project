'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  CheckCircle2,
  Shield,
  BookOpen,
  HelpCircle,
  Menu,
  PhoneCall,
  Users,
  BarChart3,
  Key,
  Trash2,
  MessageSquare,
  Footprints,
  ClipboardList,
  Mic,
  X,
} from 'lucide-react';
import { AccessibilityMenu, QuickExitButton } from './ui';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu seluler menutup sendiri saat berpindah halaman. Escape dari dalam menu
  // hanya menutup menu (Escape di luar menu tetap menjadi tombol Keluar Cepat).
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const bottomDockLinks = [
    { href: '/dashboard', label: 'Beranda', icon: Compass },
    { href: '/mission', label: 'Misi', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
  ];

  // Center navigation links (pure navigation links, no heavy boxed border by default)
  const centerLinks = [
    { href: '/dashboard', label: 'Beranda', icon: Compass },
    { href: '/mission', label: 'Misi', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
    { href: '/forum', label: 'Ruang Cerita', icon: Users },
    // Enam tautan + tombol kanan tidak muat di bawah 1536px; tautan ini ikut baris
    // atas mulai 2xl saja (tetap ada di menu seluler dan halaman lain).
    { href: '/care-passport', label: 'Catatan Konsultasi', icon: ClipboardList, desktopClass: 'hidden 2xl:inline-flex' },
  ];

  // All links for mobile drawer
  const mobileNavLinks = [
    ...centerLinks,
    { href: '/chat', label: 'Teman Bicara (tulis)', icon: MessageSquare },
    { href: '/ruang-ngobrol', label: 'Ruang Ngobrol (suara)', icon: Mic },
    { href: '/resources', label: 'Bantuan & Kontak Resmi', icon: HelpCircle },
  ];

  const secondaryMobileLinks = [
    { href: '/perjalanan', label: 'Perjalanan Kecil', icon: Footprints, iconClass: 'text-[#3357EE]' },
    { href: '/report', label: 'Refleksi Mingguan', icon: BarChart3, iconClass: 'text-[#3357EE]' },
    { href: '/recovery', label: 'Simpan / Pulihkan Sesi (kunci 12 bagian)', icon: Key, iconClass: 'text-[#A3480B]' },
  ];

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setMobileMenuOpen(false);
    }
  };

  const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

  return (
    <>
      {/* Permukaan kertas 92% + blur hanya pada header lengket (bukan konten bergulir);
          teks tinta tetap kontras > 12:1 di atasnya. */}
      <header className="sticky top-0 z-40 bg-[#FFF8EF] supports-[backdrop-filter]:bg-[#FFF8EF]/[0.92] supports-[backdrop-filter]:backdrop-blur-md border-b-2 border-[#151515]">
        {/* Lebar baris (Space Grotesk 700, diukur dari berkas font):
            lg 1024: logo 126 + 5 tautan 411 + Bantuan(ikon) 46 + Keluar Cepat 137 + Darurat 104 + Akses 44 + jarak 40 = ~910 dari 960.
            xl 1280: + ikon tautan, label Bantuan, petunjuk Esc = ~1188 dari 1216.
            2xl 1536: + Catatan Konsultasi dan "Bantuan darurat" = ~1440; karena itu wadah
            dilepas dari batas 1280px (max-w-none) agar tersedia 1472px. */}
        <div className="w-full max-w-7xl 2xl:max-w-none mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] gap-2 xl:gap-4">
            {/* LEFT: Dengar.in logo & 100% ANONIM */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className={`flex items-center gap-2.5 group rounded-[4px] min-h-[44px] ${focusRing}`}
                aria-label="Dengar.in, ke halaman depan"
              >
                <div className="w-9 h-9 rounded-[4px] bg-[#3357EE] border-2 border-[#151515] flex items-center justify-center text-white shadow-[2px_2px_0px_#151515] transition-transform duration-120 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] shrink-0" aria-hidden="true">
                  <span className="font-bold text-base tracking-tight">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-[#151515] tracking-tight leading-none">
                    Dengar.in
                  </span>
                  <span className="text-xs text-[#59544D] font-bold tracking-[0.02em] mt-0.5">
                    100% anonim
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER: Clean Navigation (Beranda, Misi, Check-in, Jurnal, Ruang Cerita) */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1" aria-label="Navigasi utama">
              {centerLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${item.desktopClass ?? 'inline-flex'} items-center gap-1.5 px-2.5 xl:px-3 min-h-[44px] text-sm font-bold whitespace-nowrap rounded-[4px] transition-colors duration-120 ${focusRing} ${
                      isActive
                        ? 'bg-[#B8F34A] text-[#151515] border-2 border-[#151515] shadow-[2px_2px_0px_#151515]'
                        : 'border-2 border-transparent text-[#151515] hover:text-[#3357EE] hover:bg-[#151515]/5 hover:underline underline-offset-4 decoration-2'
                    }`}
                  >
                    {/* Ikon baru tampil mulai xl agar baris navigasi muat di laptop 1024px. */}
                    <Icon className="hidden xl:block w-[18px] h-[18px] shrink-0 text-current" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT: Action Group (Bantuan, Keluar Cepat + ESC, Bantuan Darurat) */}
            <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
              {/* Bantuan (Desktop) */}
              <Link
                href="/resources"
                aria-current={pathname === '/resources' ? 'page' : undefined}
                className={`hidden lg:inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-[4px] text-sm font-bold border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap ${focusRing} ${
                  pathname === '/resources'
                    ? 'bg-[#B8F34A] text-[#151515]'
                    : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                }`}
              >
                <HelpCircle className="w-[18px] h-[18px] text-[#151515] shrink-0" aria-hidden="true" />
                <span className="hidden xl:inline">Bantuan</span>
                <span className="sr-only xl:hidden">Bantuan dan kontak resmi</span>
              </Link>

              {/* Keluar Cepat + ESC (Desktop) */}
              <div className="hidden sm:block">
                <QuickExitButton />
              </div>

              {/* Bantuan Darurat (Persistent Call-to-Action) */}
              <Link
                href="/crisis"
                className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-3.5 rounded-[4px] text-sm font-bold bg-[#D32F2F] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] hover:bg-[#B3261E] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-120 whitespace-nowrap ${focusRing}`}
                aria-label="Bantuan darurat: hubungi layanan krisis"
              >
                <PhoneCall className="w-[18px] h-[18px] text-white shrink-0" aria-hidden="true" />
                <span className="hidden 2xl:inline">Bantuan darurat</span>
                <span className="2xl:hidden">Darurat</span>
              </Link>

              {/* Akses cepat mandiri (pojok kanan atas, semua ukuran layar). Tombol menu
                  seluler ada di dock bawah, jadi tidak diulang di sini. */}
              <AccessibilityMenu />
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer (PRD-DESIGN.md Section 14.2) */}
        {mobileMenuOpen && (
          <div
            id="menu-seluler"
            onKeyDown={handleMenuKeyDown}
            className="lg:hidden bg-[#FFF8EF] border-t-2 border-[#151515] px-4 pt-3 pb-24 space-y-3 max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain"
          >
            <p className="text-sm font-bold text-[#59544D]">Pilih halaman yang ingin dibuka</p>

            {/* Pinned Emergency Action at top of mobile sheet */}
            <Link
              href="/crisis"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 p-3 min-h-[52px] rounded-[4px] text-base font-bold bg-[#D32F2F] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] ${focusRing}`}
            >
              <PhoneCall className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
              <span>Hubungi bantuan darurat (119 ext 8)</span>
            </Link>

            <nav aria-label="Menu seluler" className="grid grid-cols-1 gap-2">
              {mobileNavLinks.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{ animationDelay: `${40 + index * 30}ms` }}
                    className={`animate-reveal-up flex items-center gap-3 px-4 min-h-[52px] rounded-[4px] text-base font-bold border-2 border-[#151515] transition-colors duration-200 ease-spring ${focusRing} ${
                      isActive
                        ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                        : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#151515] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                    {isActive && <span className="ml-auto text-xs font-bold">Halaman ini</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="sm:hidden pt-1">
              <QuickExitButton className="w-full justify-center" />
            </div>

            <div className="animate-reveal-up [animation-delay:320ms] border-t border-[#D8D3C9] pt-3 flex flex-col gap-2">
              {secondaryMobileLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 min-h-[48px] rounded-[4px] text-base font-bold bg-white border-2 border-[#151515] ${focusRing}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${item.iconClass}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/recovery"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 min-h-[48px] rounded-[4px] text-base font-bold bg-white text-[#151515] border-2 border-[#D32F2F] ${focusRing}`}
              >
                <Trash2 className="w-5 h-5 text-[#B3261E] shrink-0" aria-hidden="true" />
                <span>Hapus Data di Perangkat Ini</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Dock (PRD-DESIGN.md section 14.2) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#151515] min-h-[4.25rem] pb-[env(safe-area-inset-bottom)] flex items-stretch justify-around px-1" aria-label="Navigasi bawah">
        {bottomDockLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-[56px] min-h-[64px] rounded-[4px] transition-colors duration-120 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#3357EE] ${isActive ? 'text-[#2B51E6]' : 'text-[#151515] hover:text-[#3357EE]'}`}
            >
              {isActive && <span className="absolute top-0 left-3 right-3 h-[3px] bg-[#3357EE]" aria-hidden="true" />}
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-bold leading-none">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-[56px] min-h-[64px] rounded-[4px] transition-colors duration-120 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#3357EE] ${mobileMenuOpen ? 'text-[#2B51E6]' : 'text-[#151515] hover:text-[#3357EE]'}`}
          aria-expanded={mobileMenuOpen}
          aria-controls="menu-seluler"
          aria-label={mobileMenuOpen ? 'Tutup menu lengkap' : 'Buka menu lengkap'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          <span className="text-xs font-bold leading-none">Menu</span>
        </button>
      </nav>
    </>
  );
}
