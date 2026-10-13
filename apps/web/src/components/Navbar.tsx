'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  ChevronDown,
  MessagesSquare,
} from 'lucide-react';
import { AccessibilityMenu, QuickExitButton } from './ui';
import { LanguageQuickButton, LanguageSwitch, commonText, useText } from '@/i18n';

type NavText = typeof commonText.id.nav;

function NgobrolMenu({ pathname, focusRing, t }: { pathname: string; focusRing: string; t: NavText }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Dua cara ngobrol dengan Dengar.in, dikumpulkan dalam satu tombol agar navigasi
  // tetap satu baris: menulis (/chat) atau berbicara (/ruang-ngobrol).
  const options = [
    { href: '/chat', title: t.chatWrite, description: t.chatWriteHint, icon: MessageSquare },
    { href: '/ruang-ngobrol', title: t.chatVoice, description: t.chatVoiceHint, icon: Mic },
  ];
  const isActive = options.some((option) => pathname === option.href);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Escape hanya menutup menu ini, tidak memicu Keluar Cepat.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="menu-ngobrol"
        className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 min-h-[44px] text-sm font-bold whitespace-nowrap rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-[transform,box-shadow,background-color] duration-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${
          isActive || open ? 'bg-[#B8F34A] text-[#151515]' : 'bg-white text-[#151515] hover:bg-[#B8F34A]/40'
        }`}
      >
        <MessagesSquare className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        <span>{t.chat}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          id="menu-ngobrol"
          role="group"
          aria-label={t.chatMenu}
          className="absolute left-0 top-full mt-2 z-50 w-72 bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515] p-2 space-y-1"
        >
          {options.map((option) => {
            const Icon = option.icon;
            const current = pathname === option.href;
            return (
              <Link
                key={option.href}
                href={option.href}
                aria-current={current ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[52px] rounded-[4px] border-2 transition-colors duration-200 ${focusRing} ${
                  current ? 'border-[#151515] bg-[#B8F34A]' : 'border-transparent hover:border-[#151515] hover:bg-[#FFF8EF]'
                }`}
              >
                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[4px] border-2 border-[#151515] bg-[#FFF8EF]" aria-hidden="true">
                  <Icon className="w-5 h-5 text-[#151515]" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#151515]">{option.title}</span>
                  <span className="block text-xs text-[#59544D]">{option.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const common = useText(commonText);
  const t = common.nav;

  // Menu seluler menutup sendiri saat berpindah halaman. Escape dari dalam menu
  // hanya menutup menu (Escape di luar menu tetap menjadi tombol Keluar Cepat).
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const bottomDockLinks = [
    { href: '/dashboard', label: t.home, icon: Compass },
    { href: '/mission', label: t.mission, icon: CheckCircle2 },
    { href: '/checkin', label: t.checkin, icon: Shield },
    { href: '/journal', label: t.journal, icon: BookOpen },
  ];

  // Center navigation links (pure navigation links, no heavy boxed border by default)
  const centerLinks = [
    { href: '/dashboard', label: t.home, icon: Compass },
    { href: '/mission', label: t.mission, icon: CheckCircle2 },
    { href: '/checkin', label: t.checkin, icon: Shield },
    { href: '/journal', label: t.journal, icon: BookOpen },
    // Tombol Ngobrol mengambil ruang di laptop 1024px; Ruang Cerita ikut baris atas
    // mulai xl (tetap ada di footer dan menu seluler).
    { href: '/forum', label: t.forum, icon: Users, desktopClass: 'hidden xl:inline-flex' },
    // Enam tautan + tombol kanan tidak muat di bawah 1536px; tautan ini ikut baris
    // atas mulai 2xl saja (tetap ada di menu seluler dan halaman lain).
    { href: '/care-passport', label: t.carePassport, icon: ClipboardList, desktopClass: 'hidden 2xl:inline-flex' },
  ];

  // All links for mobile drawer
  const mobileNavLinks = [
    { href: '/chat', label: t.chatWriteFull, icon: MessageSquare },
    { href: '/ruang-ngobrol', label: t.chatVoiceFull, icon: Mic },
    ...centerLinks,
    { href: '/resources', label: t.resources, icon: HelpCircle },
  ];

  const secondaryMobileLinks = [
    { href: '/perjalanan', label: t.journey, icon: Footprints, iconClass: 'text-[#3357EE]' },
    { href: '/report', label: t.report, icon: BarChart3, iconClass: 'text-[#3357EE]' },
    { href: '/recovery', label: t.recovery, icon: Key, iconClass: 'text-[#A3480B]' },
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
            dilepas dari batas 1280px (max-w-none) agar tersedia 1472px.
            Tombol bahasa ringkas (44 + jarak 8) tidak muat di 1024-1536, jadi di desktop
            ia baru tampil mulai 1680px (bersama label "Akses cepat"); di bawah lg ia
            tampil mulai 400px. Di antaranya, bahasa diganti lewat panel Akses cepat. */}
        <div className="w-full max-w-7xl 2xl:max-w-none mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] gap-2 xl:gap-4">
            {/* LEFT: Dengar.in logo & 100% ANONIM */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className={`flex items-center gap-2.5 group rounded-[4px] min-h-[44px] ${focusRing}`}
                aria-label={t.brandHome}
              >
                <div className="w-9 h-9 rounded-[4px] bg-[#3357EE] border-2 border-[#151515] flex items-center justify-center text-white shadow-[2px_2px_0px_#151515] transition-transform duration-120 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] shrink-0" aria-hidden="true">
                  <span className="font-bold text-base tracking-tight">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-[#151515] tracking-tight leading-none">
                    {common.brand}
                  </span>
                  <span className="text-xs text-[#59544D] font-bold tracking-[0.02em] mt-0.5">
                    {common.anonymous}
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER: Clean Navigation (Beranda, Misi, Check-in, Jurnal, Ruang Cerita) */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1" aria-label={t.main}>
              <NgobrolMenu pathname={pathname} focusRing={focusRing} t={t} />
              {centerLinks.map((item) => {
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
                    {/* Tautan tengah tanpa ikon agar tombol Ngobrol muat dalam satu baris. */}
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
                <span className="hidden xl:inline">{t.help}</span>
                <span className="sr-only xl:hidden">{t.helpFull}</span>
              </Link>

              {/* Keluar Cepat + ESC (Desktop) */}
              <div className="hidden sm:block">
                <QuickExitButton />
              </div>

              {/* Bantuan Darurat (Persistent Call-to-Action) */}
              <Link
                href="/crisis"
                className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-3.5 rounded-[4px] text-sm font-bold bg-[#D32F2F] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] hover:bg-[#B3261E] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-120 whitespace-nowrap ${focusRing}`}
                aria-label={t.emergencyAria}
              >
                <PhoneCall className="w-[18px] h-[18px] text-white shrink-0" aria-hidden="true" />
                <span className="hidden 2xl:inline">{t.emergencyFull}</span>
                <span className="2xl:hidden">{t.emergency}</span>
              </Link>

              {/* Tombol bahasa ringkas: lihat catatan anggaran lebar di atas. */}
              <LanguageQuickButton className="hidden min-[400px]:inline-flex lg:hidden min-[1680px]:inline-flex" />

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
            <p className="text-sm font-bold text-[#59544D]">{t.pickPage}</p>

            {/* Pinned Emergency Action at top of mobile sheet */}
            <Link
              href="/crisis"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 p-3 min-h-[52px] rounded-[4px] text-base font-bold bg-[#D32F2F] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] ${focusRing}`}
            >
              <PhoneCall className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
              <span>{t.emergencyMobile}</span>
            </Link>

            <nav aria-label={t.mobileMenu} className="grid grid-cols-1 gap-2">
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
                    {isActive && <span className="ml-auto text-xs font-bold">{common.thisPage}</span>}
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
                <span>{t.wipe}</span>
              </Link>
            </div>

            {/* Pilihan bahasa di menu seluler (juga ada di panel Akses cepat dan footer). */}
            <LanguageSwitch idPrefix="bahasa-menu" className="border-t border-[#D8D3C9] pt-3" />
          </div>
        )}
      </header>

      {/* Mobile Bottom Dock (PRD-DESIGN.md section 14.2) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#151515] min-h-[4.25rem] pb-[env(safe-area-inset-bottom)] flex items-stretch justify-around px-1" aria-label={t.bottom}>
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
          aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          <span className="text-xs font-bold leading-none">{t.menu}</span>
        </button>
      </nav>
    </>
  );
}
