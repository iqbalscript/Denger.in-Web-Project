'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  CheckCircle2,
  Shield,
  BookOpen,
  HelpCircle,
  Menu,
  X,
  PhoneCall,
  Users,
  BarChart3,
  Key,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { QuickExitButton } from './ui';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Center navigation links (pure navigation links, no heavy boxed border by default)
  const centerLinks = [
    { href: '/dashboard', label: 'Home', icon: Compass },
    { href: '/mission', label: 'Misi', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
    { href: '/forum', label: 'Ruang Cerita', icon: Users },
  ];

  // All links for mobile drawer
  const mobileNavLinks = [
    ...centerLinks,
    { href: '/chat', label: 'Teman Bicara', icon: MessageSquare },
    { href: '/resources', label: 'Bantuan', icon: HelpCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFF8EF] border-b-2 border-[#151515]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 xl:gap-4">
            {/* LEFT: Dengar.in logo & 100% ANONIM */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF]"
                aria-label="Kembali ke Beranda Dengar.in"
              >
                <div className="w-8 h-8 rounded-[4px] bg-[#4169FF] border-2 border-[#151515] flex items-center justify-center text-white shadow-[2px_2px_0px_#151515] transition-transform duration-120 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] shrink-0">
                  <span className="font-bold text-sm tracking-tight">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base sm:text-lg text-[#151515] tracking-tight leading-none">
                    Dengar.in
                  </span>
                  <span className="text-[10px] text-[#59544D] font-bold tracking-wider uppercase mt-0.5">
                    100% ANONIM
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER: Clean Navigation (Home, Misi, Check-in, Jurnal, Ruang Cerita) */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1" aria-label="Navigasi Utama">
              {centerLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-bold whitespace-nowrap rounded-[4px] transition-colors duration-120 ${
                      isActive
                        ? 'bg-[#B8F34A] text-[#151515] border-2 border-[#151515] shadow-[2px_2px_0px_#151515]'
                        : 'text-[#151515] hover:text-[#4169FF] hover:bg-[#151515]/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-current" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT: Action Group (Bantuan, Keluar Cepat + ESC, Bantuan Darurat) */}
            <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
              {/* Bantuan (Desktop) */}
              <Link
                href="/resources"
                className={`hidden lg:inline-flex items-center justify-center gap-1.5 h-9 px-2.5 xl:px-3 rounded-[4px] text-xs font-bold border-2 border-[#151515] shadow-[2px_2px_0px_#151515] transition-all duration-120 active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap ${
                  pathname === '/resources'
                    ? 'bg-[#B8F34A] text-[#151515]'
                    : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#151515] shrink-0" />
                <span>Bantuan</span>
              </Link>

              {/* Keluar Cepat + ESC (Desktop) */}
              <div className="hidden sm:block">
                <QuickExitButton className="h-9" />
              </div>

              {/* Bantuan Darurat (Persistent Call-to-Action) */}
              <Link
                href="/crisis"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3.5 rounded-[4px] text-xs font-bold bg-[#FF5252] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-120 whitespace-nowrap"
                aria-label="Akses Bantuan Darurat Krisis"
              >
                <PhoneCall className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="hidden xl:inline">BANTUAN DARURAT</span>
                <span className="xl:hidden">DARURAT</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-[4px] border-2 border-[#151515] bg-white text-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Buka menu navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer (PRD-DESIGN.md Section 14.2) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFF8EF] border-t-2 border-[#151515] px-4 pt-3 pb-5 space-y-3">
            {/* Pinned Emergency Action at top of mobile sheet */}
            <Link
              href="/crisis"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-3 rounded-[4px] text-xs font-bold bg-[#FF5252] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <PhoneCall className="w-4 h-4 text-white shrink-0" />
              <span>HUBUNGI BANTUAN DARURAT (119 EXT 8)</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              {mobileNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-3 rounded-[4px] text-xs font-bold border-2 border-[#151515] transition-all ${
                      isActive
                        ? 'bg-[#B8F34A] text-[#151515] shadow-[2px_2px_0px_#151515]'
                        : 'bg-white text-[#151515] hover:bg-[#FFF8EF]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#151515] shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden pt-1">
              <QuickExitButton className="w-full h-9 justify-center" />
            </div>

            <div className="border-t-2 border-[#151515]/20 pt-3 flex flex-col gap-2">
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-[4px] text-xs font-bold bg-white border-2 border-[#151515]"
              >
                <BarChart3 className="w-4 h-4 text-[#4169FF] shrink-0" />
                <span>Refleksi Mingguan</span>
              </Link>
              <Link
                href="/recovery"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-[4px] text-xs font-bold bg-white border-2 border-[#151515]"
              >
                <Key className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                <span>Pemulihan Sesi (12-Kata)</span>
              </Link>
              <Link
                href="/recovery"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-[4px] text-xs font-bold bg-white text-[#FF5252] border-2 border-[#FF5252]"
              >
                <Trash2 className="w-4 h-4 text-[#FF5252] shrink-0" />
                <span>Hapus Data Lokal</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Dock (PRD-DESIGN.md section 14.2) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#151515] h-16 flex items-center justify-around px-2" aria-label="Mobile Bottom Navigation">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${pathname === '/dashboard' ? 'text-[#4169FF] font-bold' : 'text-[#151515]'}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Home</span>
        </Link>
        <Link
          href="/mission"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${pathname === '/mission' ? 'text-[#4169FF] font-bold' : 'text-[#151515]'}`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Misi</span>
        </Link>
        <Link
          href="/checkin"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${pathname === '/checkin' ? 'text-[#4169FF] font-bold' : 'text-[#151515]'}`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Check-in</span>
        </Link>
        <Link
          href="/journal"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${pathname === '/journal' ? 'text-[#4169FF] font-bold' : 'text-[#151515]'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Jurnal</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[#151515]"
          aria-label="Menu Lengkap"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Menu</span>
        </button>
      </nav>
    </>
  );
}
