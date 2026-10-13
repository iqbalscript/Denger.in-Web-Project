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

const CHAT_ROUTES = ['/chat', '/ruang-ngobrol'] as const;

// Dua cara ngobrol dengan Dengar.in, dikumpulkan dalam satu tombol: menulis
// (/chat) atau berbicara (/ruang-ngobrol). Dipakai oleh menu desktop dan dock bawah.
function ngobrolOptions(t: NavText) {
  return [
    { href: '/chat', title: t.chatWrite, description: t.chatWriteHint, icon: MessageSquare },
    { href: '/ruang-ngobrol', title: t.chatVoice, description: t.chatVoiceHint, icon: Mic },
  ];
}

function NgobrolOptionList({
  pathname,
  focusRing,
  t,
  onPick,
}: {
  pathname: string;
  focusRing: string;
  t: NavText;
  onPick: () => void;
}) {
  return (
    <>
      {ngobrolOptions(t).map((option) => {
        const Icon = option.icon;
        const current = pathname === option.href;
        return (
          <Link
            key={option.href}
            href={option.href}
            aria-current={current ? 'page' : undefined}
            onClick={onPick}
            className={`flex items-center gap-3 px-3 py-2.5 min-h-[52px] rounded-[4px] border-2 transition-colors duration-200 ${focusRing} ${
              current ? 'border-[#151515] bg-[#B8F34A]' : 'border-transparent hover:border-[#151515] hover:bg-[#FFF8EF]'
            }`}
          >
            <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[4px] border-2 border-[#151515] bg-[#FFF8EF]" aria-hidden="true">
              <Icon className="w-5 h-5 text-[#151515]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#151515]">{option.title}</span>
              <span className="block text-xs text-[#59544D]">{option.description}</span>
            </span>
          </Link>
        );
      })}
    </>
  );
}

function NgobrolMenu({ pathname, focusRing, t }: { pathname: string; focusRing: string; t: NavText }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isActive = CHAT_ROUTES.some((href) => pathname === href);

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
        className={`inline-flex items-center gap-1.5 px-2 xl:px-2.5 min-h-[44px] text-sm font-bold whitespace-nowrap rounded-[4px] border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-[transform,box-shadow,background-color] duration-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${
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
          <NgobrolOptionList pathname={pathname} focusRing={focusRing} t={t} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/**
 * Tombol Ngobrol di tengah dock bawah (HP dan tablet tegak). Membuka lembar kecil
 * di atas dock dengan dua pilihan yang sama seperti menu desktop. Menutup saat
 * ketuk di luar, Escape, atau pindah halaman.
 */
function NgobrolDockButton({
  pathname,
  open,
  onOpenChange,
  t,
}: {
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: NavText;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isActive = CHAT_ROUTES.some((href) => pathname === href);
  const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-1 min-w-[56px]" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="menu-ngobrol-dock"
        aria-current={isActive && !open ? 'page' : undefined}
        className={`flex-1 flex flex-col items-center justify-center gap-1 my-1.5 mx-0.5 min-h-[52px] rounded-[4px] border-2 border-[#151515] text-[#151515] shadow-[2px_2px_0px_#151515] transition-[transform,box-shadow,background-color] duration-120 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515] ${focusRing} ${
          isActive || open ? 'bg-[#B8F34A]' : 'bg-[#B8F34A]/70'
        }`}
      >
        <MessagesSquare className="w-6 h-6" aria-hidden="true" />
        <span className="dock-label text-xs font-bold leading-tight text-center max-w-full">{t.chat}</span>
      </button>

      {open && (
        <div
          id="menu-ngobrol-dock"
          role="group"
          aria-label={t.chatMenu}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white border-2 border-[#151515] rounded-[6px] shadow-[4px_4px_0px_#151515] p-2 space-y-1 text-left"
        >
          <div className="flex items-center justify-between gap-2 px-1 pt-1 pb-2 border-b border-[#D8D3C9]">
            <span className="text-sm font-bold text-[#151515]">{t.chatMenu}</span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                buttonRef.current?.focus();
              }}
              aria-label={t.chatMenuClose}
              className={`shrink-0 inline-flex items-center justify-center w-11 h-11 -my-1.5 -mr-1 rounded-[4px] text-[#151515] hover:bg-[#151515]/5 ${focusRing}`}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <NgobrolOptionList pathname={pathname} focusRing={focusRing} t={t} onPick={() => onOpenChange(false)} />
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dockChatOpen, setDockChatOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const common = useText(commonText);
  const t = common.nav;

  // Menu seluler dan lembar Ngobrol menutup sendiri saat berpindah halaman. Escape
  // dari dalam menu hanya menutup menu (Escape di luar menu tetap Keluar Cepat).
  useEffect(() => {
    setMobileMenuOpen(false);
    setDockChatOpen(false);
  }, [pathname]);

  // Ketuk di luar menu seluler (selain tombol Menu di dock) menutupnya.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (drawerRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileMenuOpen]);

  const openMobileMenu = (open: boolean) => {
    setMobileMenuOpen(open);
    if (open) setDockChatOpen(false);
  };
  const openDockChat = (open: boolean) => {
    setDockChatOpen(open);
    if (open) setMobileMenuOpen(false);
  };

  // Dock bawah: lima slot supaya tetap muat di HP 360px pada kedua bahasa, juga
  // dengan teks 140% (lihat .dock-label di globals.css). Ngobrol mengisi slot
  // tengah; Jurnal pindah ke menu lengkap (tetap ada di beranda dan footer).
  const bottomDockLinks = [
    { href: '/dashboard', label: t.home, icon: Compass },
    { href: '/mission', label: t.mission, icon: CheckCircle2 },
    { href: '/checkin', label: t.checkin, icon: Shield },
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
      menuButtonRef.current?.focus();
    }
  };

  const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';
  const dockItem =
    'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-[56px] min-h-[64px] rounded-[4px] transition-colors duration-120 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#3357EE]';

  return (
    <>
      {/* Permukaan kertas 92% + blur hanya pada header lengket (bukan konten bergulir);
          teks tinta tetap kontras > 12:1 di atasnya. */}
      <header className="sticky top-0 z-40 bg-[#FFF8EF] supports-[backdrop-filter]:bg-[#FFF8EF]/[0.92] supports-[backdrop-filter]:backdrop-blur-md border-b-2 border-[#151515]">
        {/* Anggaran lebar baris atas, diukur dengan font sistem tebal 14px (SF Pro; Roboto
            sedikit lebih sempit, Segoe UI sedikit lebih lebar). Angka ID / EN:
            lg 1024 (lebar isi 960): logo 128/154 + Ngobrol 121/94 + 4 tautan (px-2) 271/288
              + jarak 16+16 + Bantuan(ikon) 46 + Keluar Cepat 141/121 + Darurat 109/134
              + Akses 44 + jarak 24 = 916/936 dari 960.
            xl 1280 (1216): + Ruang Cerita, ikon Bantuan berlabel, petunjuk Esc, px-2.5
              = 1185/1170 dari 1216.
            2xl 1536 (1472, wadah dilepas dari batas 1280px): + Catatan Konsultasi dan
              "Bantuan darurat" = 1404/1366.
            1680 (1616): + tombol bahasa ringkas 52 dan label "Akses cepat" = 1548/1517.
            iPad mendatar 1024-1194 masuk rentang lg; 1366 masuk xl.
            Di bawah lg: logo 128/154, Darurat 105/130, Akses 44, jarak 16; nama merek
            kecil "100% anonim" baru tampil mulai 480px, tombol bahasa ringkas mulai 412px
            (EN "100% anonymous" 108px dan "Emergency" 78px lebih panjang dari ID).
            Saat teks diperbesar, .brand-wordmark disembunyikan di bawah 480px (globals.css). */}
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
                <div className="brand-wordmark flex flex-col">
                  <span className="font-bold text-lg text-[#151515] tracking-tight leading-none whitespace-nowrap">
                    {common.brand}
                  </span>
                  <span className="hidden min-[480px]:block text-xs text-[#59544D] font-bold tracking-[0.02em] mt-0.5 whitespace-nowrap">
                    {common.anonymous}
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER: Clean Navigation (Beranda, Misi, Check-in, Jurnal, Ruang Cerita) */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 flex-1" aria-label={t.main}>
              <NgobrolMenu pathname={pathname} focusRing={focusRing} t={t} />
              {centerLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${item.desktopClass ?? 'inline-flex'} items-center gap-1.5 px-2 xl:px-2.5 min-h-[44px] text-sm font-bold whitespace-nowrap rounded-[4px] transition-colors duration-120 ${focusRing} ${
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

              {/* Tombol bahasa ringkas: lihat catatan anggaran lebar di atas. Di bawah 412px
                  bahasa diganti lewat panel Akses cepat (bagian paling atas) atau menu lengkap. */}
              <LanguageQuickButton className="hidden min-[412px]:inline-flex lg:hidden min-[1680px]:inline-flex" />

              {/* Akses cepat mandiri (pojok kanan atas, semua ukuran layar). Tombol menu
                  seluler ada di dock bawah, jadi tidak diulang di sini. */}
              <AccessibilityMenu />
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer (PRD-DESIGN.md Section 14.2). Tingginya berhenti di atas
            dock bawah; di tablet daftar tautan jadi dua kolom supaya tidak seperti HP yang
            direntangkan. */}
        {mobileMenuOpen && (
          <div
            id="menu-seluler"
            ref={drawerRef}
            onKeyDown={handleMenuKeyDown}
            className="lg:hidden bg-[#FFF8EF] border-t-2 border-[#151515] px-4 pt-3 pb-4 max-h-[calc(100dvh-4.25rem-5rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto w-full max-w-3xl space-y-3">
              <p className="text-sm font-bold text-[#59544D]">{t.pickPage}</p>

              {/* Pinned Emergency Action at top of mobile sheet */}
              <Link
                href="/crisis"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center gap-2 p-3 min-h-[52px] rounded-[4px] text-base font-bold bg-[#D32F2F] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] ${focusRing}`}
              >
                <PhoneCall className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
                <span className="text-center">{t.emergencyMobile}</span>
              </Link>

              <nav aria-label={t.mobileMenu} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className={`animate-reveal-up flex items-center gap-3 px-4 py-2 min-h-[52px] rounded-[4px] text-base font-bold border-2 border-[#151515] transition-colors duration-200 ease-spring ${focusRing} ${
                        isActive
                          ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                          : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-[#151515] shrink-0" aria-hidden="true" />
                      <span className="min-w-0">{item.label}</span>
                      {isActive && <span className="ml-auto shrink-0 text-xs font-bold">{common.thisPage}</span>}
                    </Link>
                  );
                })}
              </nav>

              <div className="sm:hidden pt-1">
                <QuickExitButton className="w-full justify-center" />
              </div>

              <div className="animate-reveal-up [animation-delay:320ms] border-t border-[#D8D3C9] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {secondaryMobileLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 min-h-[48px] rounded-[4px] text-base font-bold bg-white border-2 border-[#151515] ${focusRing}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${item.iconClass}`} aria-hidden="true" />
                      <span className="min-w-0">{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/recovery"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 min-h-[48px] rounded-[4px] text-base font-bold bg-white text-[#151515] border-2 border-[#D32F2F] ${focusRing}`}
                >
                  <Trash2 className="w-5 h-5 text-[#B3261E] shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{t.wipe}</span>
                </Link>
              </div>

              {/* Pilihan bahasa di menu seluler (juga ada di panel Akses cepat dan footer). */}
              <LanguageSwitch idPrefix="bahasa-menu" className="border-t border-[#D8D3C9] pt-3 sm:max-w-md" />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Dock (PRD-DESIGN.md section 14.2). Jarak bawah minimal 0.5rem
          (Android: env() biasanya 0), lebih besar di HP dengan garis beranda.
          Disembunyikan saat kolom teks fokus (lihat .dock-bottom di globals.css). */}
      <nav
        className="dock-bottom lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#151515] min-h-[4.25rem] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] flex items-stretch justify-around"
        aria-label={t.bottom}
      >
        {bottomDockLinks.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`${dockItem} ${isActive ? 'text-[#2B51E6]' : 'text-[#151515] hover:text-[#3357EE]'}`}
            >
              {isActive && <span className="absolute top-0 left-3 right-3 h-[3px] bg-[#3357EE]" aria-hidden="true" />}
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="dock-label text-xs font-bold leading-tight text-center max-w-full">{item.label}</span>
            </Link>
          );
        })}

        <NgobrolDockButton pathname={pathname} open={dockChatOpen} onOpenChange={openDockChat} t={t} />

        {bottomDockLinks.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`${dockItem} ${isActive ? 'text-[#2B51E6]' : 'text-[#151515] hover:text-[#3357EE]'}`}
            >
              {isActive && <span className="absolute top-0 left-3 right-3 h-[3px] bg-[#3357EE]" aria-hidden="true" />}
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="dock-label text-xs font-bold leading-tight text-center max-w-full">{item.label}</span>
            </Link>
          );
        })}

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => openMobileMenu(!mobileMenuOpen)}
          className={`${dockItem} ${mobileMenuOpen ? 'text-[#2B51E6]' : 'text-[#151515] hover:text-[#3357EE]'}`}
          aria-expanded={mobileMenuOpen}
          aria-controls="menu-seluler"
          aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          <span className="dock-label text-xs font-bold leading-tight text-center max-w-full">{t.menu}</span>
        </button>
      </nav>
    </>
  );
}
