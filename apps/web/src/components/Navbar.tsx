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
} from 'lucide-react';
import { QuickExitButton } from './ui';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Compass },
    { href: '/mission', label: 'Misi', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
    { href: '/forum', label: 'Ruang Cerita', icon: Users },
    { href: '/resources', label: 'Bantuan', icon: HelpCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFF8EF] border-b-2 border-[#151515]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand - Strictly Anonymous */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF]"
                aria-label="Kembali ke Beranda Dengar.in"
              >
                <div className="w-8 h-8 rounded-[4px] bg-[#4169FF] border-2 border-[#151515] flex items-center justify-center text-white shadow-[2px_2px_0px_#151515] transition-transform duration-120 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px]">
                  <span className="font-bold text-sm tracking-tight">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-[#151515] tracking-tight leading-tight">
                    Dengar.in
                  </span>
                  <span className="text-[10px] text-[#59544D] font-bold tracking-wider uppercase">
                    100% Anonim
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1.5" aria-label="Navigasi Utama">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs sm:text-sm font-bold transition-all duration-120 ${
                      isActive
                        ? 'bg-[#B8F34A] text-[#151515] border-2 border-[#151515] shadow-[2px_2px_0px_#151515]'
                        : 'text-[#151515] border-2 border-transparent hover:border-[#151515] hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#151515]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Utilities: Quick Exit + Persistent Crisis Emergency Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Persistent Quick Exit (ESC) */}
              <QuickExitButton variant="navbar" />

              {/* Persistent Crisis Emergency Action (PRD-DESIGN.md) */}
              <Link
                href="/crisis"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs sm:text-sm font-bold bg-[#FF5252] text-white border-2 border-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-120"
                aria-label="Akses Bantuan Darurat Krisis"
              >
                <PhoneCall className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="hidden sm:inline">BANTUAN DARURAT</span>
                <span className="sm:hidden">DARURAT</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-[4px] border-2 border-[#151515] bg-white text-[#151515] shadow-[2px_2px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Buka menu navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFF8EF] border-t-2 border-[#151515] px-4 pt-3 pb-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
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
                    <Icon className="w-4 h-4 text-[#151515]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t-2 border-[#151515]/20 pt-3 flex flex-col gap-2">
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-[4px] text-xs font-bold bg-white border-2 border-[#151515]"
              >
                <BarChart3 className="w-4 h-4 text-[#4169FF]" />
                <span>Refleksi Mingguan</span>
              </Link>
              <Link
                href="/recovery"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-[4px] text-xs font-bold bg-white border-2 border-[#151515]"
              >
                <Key className="w-4 h-4 text-[#FF8A3D]" />
                <span>Pemulihan Sesi (12-Kata)</span>
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
